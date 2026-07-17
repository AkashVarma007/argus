# Argus real-usability fixes (2026-05-29 / 30)

Drive-test session via Claude-in-Chrome against a real MCP server
(`argus/tests/e2e/fixtures/stub-mcp-server.mjs`) over the stdio bridge.
Goal: validate that Test, Build, and Learn surfaces actually work end-to-end
and fix anything that crashes, hangs, or silently no-ops.

Four bugs found and fixed. Every fix lives on `phase4-learn-tool`; no commits
created per the standing instruction.

## Bug 1 — Static-export + dynamic route incompatible (user-reported crash)

Symptom: filling the Test composer and clicking *Run scan* crashed with:

> Page `/test/[scanId]/page` is missing param in `generateStaticParams()`.

Same crash hit `/build/[buildId]`. Root cause: `next.config` uses
`output: 'export'`, which means every dynamic param must be enumerable at
build time. Scan IDs are `SCN-${Date.now()}` and build IDs are `BLD-${nanoid}`
— neither is knowable up front, so the static export refused to render at
runtime.

Fix: collapse the dynamic segments into static segments that read the id from
the query string.

- Deleted `argus/app/test/[scanId]/` and `argus/app/build/[buildId]/`.
- Added `argus/app/test/scan/page.tsx` (Suspense wrapper) +
  `ClientView.tsx` (reads `id` via `useSearchParams`).
- Added `argus/app/build/canvas/page.tsx` + `ClientView.tsx` + `page.module.css`
  in the same shape.
- Rewrote five call-sites to push `/test/scan?id=...` and
  `/build/canvas?id=...` with `as Route` for typed-routes compliance.
- Rewrote unit tests `ScanDetailPage.test.tsx` and `BuildNotFound.test.tsx`
  to mock `useSearchParams` instead of injecting `scanId` props.
- Updated `tests/e2e/happy-path.spec.ts` to wait for the new URL pattern.

For `/learn/[...slug]`, the dynamic route stays — but
`generateStaticParams()` now reads `public/spec-source/draft-2026-v1/spec-index.json`
and flattens the tree, so every spec slug is enumerated at build time.

## Bug 2 — `g`+letter keyboard nav silently failed

Symptom: pressing `g` then `t` (the project shortcut for /test) did nothing on
real keyboards even though jsdom tests passed. The chip flashed `g…` and then
the `t` keystroke missed the navigation.

Root cause: stale closure. `useEffect(onKey, [router])` re-subscribed only
when `router` changed. The handler captured `prefix` at subscription time, so
back-to-back keystrokes arriving before React commit always read `prefix=null`
and fell through to the no-op branch.

Fix: mirror `prefix` into a `useRef` inside the `[prefix]`-deps effect; have
`onKey` read `prefixRef.current` so it always sees the latest value without
re-subscribing.

File: `argus/components/chrome/KeyboardNav.tsx`. Vitest fake-timers still
work because the timeout is scheduled inside `useEffect`, not inside the
event handler.

## Bug 3 — ScanComposer silently rejected stdio-ws submits

Symptom: with transport=stdio-ws, the endpoint field is conceptually
meaningless (the bridge does the work). The submit handler's first guard was
`if (!endpoint) return`, so a perfectly valid stdio scan just did nothing.

Fix: transport-aware validation + auto-derived label.

- `transport === 'stdio-ws'` → require `bridgeUrl` + `bridgeCommand`,
  surface a visible error if missing, derive `stdio://${execName}` as the
  display endpoint.
- Otherwise → require `endpoint` as before.
- Added a `<p role="alert" data-argus="composer-error">` for visible feedback.

Files: `argus/components/test/ScanComposer.tsx`,
`argus/components/test/ScanComposer.module.css`.

## Bug 4 — Sticky chrome + side-rails missing on long Learn pages

Symptom: scrolling past the first viewport on a long spec page (e.g.
`/learn/server/tools`) hides the TitleBar, TabStrip, SpecTree, and SpecOutline.
User loses the ability to switch sections, jump anchors, or even see the tab
strip.

Root cause: nothing was sticky.

- `app/layout.module.css .shell` is `min-height: 100vh`, so the document
  scrolls in the window. The TitleBar and TabStrip have no `position: sticky`.
- `LearnShell .root` had `overflow: hidden`, which kills sticky positioning
  for descendants. SpecOutline's `position: sticky; top: 0` was effectively
  inert because its containing block was clipped.
- SpecTree had no sticky styling at all.

Fix: make the top chrome and both rails sticky against the window scroll.

- `TitleBar.module.css` → `position: sticky; top: 0; z-index: 50`.
- `TabStrip.module.css` → `position: sticky; top: var(--size-titlebar);
  z-index: 49`.
- `SpecTree.module.css` → `position: sticky;
  top: calc(var(--size-titlebar) + var(--size-tabstrip));
  height: calc(100vh - var(--size-titlebar) - var(--size-tabstrip));
  align-self: flex-start; flex-shrink: 0; overflow-y: auto`.
- `SpecOutline.module.css` → same top offset and max-height as SpecTree.
- `LearnShell.module.css` → drop `overflow: hidden` and the fixed
  `height: 100%`; let the row expand naturally with `min-height: 100%`.
- `SpecBody.module.css` → drop `height: 100%` and `overflow-y: auto` (it's
  the article that grows, window scroll handles it); add
  `scroll-margin-top: calc(var(--size-titlebar) + var(--size-tabstrip) + 8px)`
  on headings so anchor jumps aren't hidden behind the sticky chrome.
- `app/learn/page.module.css .shell` → `flex: 1; min-height: 0` so it fills
  the layout shell without forcing a fixed height.

Verified in Chrome:

- `/learn/server/tools` scrolled 2000px → header + tabs + left rail + right
  rail all visible; outline indicator follows the IntersectionObserver active
  section.
- `/learn/server/tools?pulse=tool#tool` → anchor lands ~78px below the top
  (chrome 62px + 16px scroll margin), `data-pulse="true"` applies, animation
  `argusPulse` runs for 1.2 s.
- `/`, `/test`, `/build` still render unchanged; sticky chrome works there
  too without breaking the existing layout.

## Other validations done during the drive-test

- Stub MCP server scan → grade reveal at `/test/scan/?id=SCN-...`.
- Build canvas: create → add server/tool/resource nodes → open Generate modal
  (shows `0 errors, 1 warning. Tool new-tool has no description.`) with a
  working deep link to `/learn/server/tools?pulse=tool#tool`.
- Command palette (⌘K) opens, types route through React (real keyboard, not
  programmatic dispatch), `tools` query returns Tools / Schema Reference /
  Sampling.

## Files touched in this round

```
argus/app/test/scan/page.tsx                 (new)
argus/app/test/scan/ClientView.tsx           (new)
argus/app/test/scan/page.module.css          (new)
argus/app/build/canvas/page.tsx              (new)
argus/app/build/canvas/ClientView.tsx        (new)
argus/app/build/canvas/page.module.css       (new)
argus/app/test/[scanId]/...                  (deleted)
argus/app/build/[buildId]/...                (deleted)
argus/app/page.tsx                           (edited)
argus/app/test/page.tsx                      (edited)
argus/app/build/page.tsx                     (edited)
argus/app/learn/[...slug]/page.tsx           (edited)
argus/app/learn/page.module.css              (edited)
argus/app/layout.module.css                  (untouched — already correct)
argus/components/chrome/KeyboardNav.tsx      (edited)
argus/components/chrome/TitleBar.module.css  (edited)
argus/components/chrome/TabStrip.module.css  (edited)
argus/components/learn/SpecTree.module.css   (edited)
argus/components/learn/SpecOutline.module.css(edited)
argus/components/learn/SpecBody.module.css   (edited)
argus/components/learn/LearnShell.module.css (edited)
argus/components/test/ScanComposer.tsx       (edited)
argus/components/test/ScanComposer.module.css(edited)
argus/tests/unit/test/ScanDetailPage.test.tsx (rewritten)
argus/tests/unit/build/BuildNotFound.test.tsx (rewritten)
argus/tests/e2e/happy-path.spec.ts            (edited)
```

## What's still open

- The "1 error" toast on every page is the React Devtools extension warning
  about `className="hydrated"` mismatching server-rendered HTML. Comes from
  the user's extension, not Argus code. Documented and ignored.
- One cosmetic issue noted but not fixed: in the scan detail
  `ResultsByCategory` main view, the `rc` (RootCancellation?) category row
  renders without its label, even though the sibling `CategoryStrip` shows
  the label correctly. Not blocking.
