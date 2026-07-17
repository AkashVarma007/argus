# Phase 6 — Polish & Ship

Status: planned (execution starts 2026-05-29, immediately after Phase 5).

## 1. Goal

Take Argus from "all features green in unit tests" to "first-time visitor can land, learn, test, and build without bouncing." This phase smooths sharp edges — empty states, error surfaces, global keyboard shortcuts, perf hot spots, and a Playwright happy-path that exercises the four surfaces end-to-end in a real Chromium.

No new product surfaces. No new conformance checks. Just the difference between "ships" and "works."

## 2. Current state

What already works (after Phases 1–5):
- Phase 1 shell: Lattice, TabStrip, CommandPalette wiring at the top level.
- Phase 2 conformance engine: 60+ checks across initialization, transport, capabilities, tools, resources, prompts, logging, sampling, completion, security.
- Phase 3 build: ScaffoldComposer + ValidationStrip + PreviewPane + ExportTray with 11 wired validation rules carrying `spec://` refs.
- Phase 4 learn tool: SpecTree, SpecBody, SpecOutline, CommandPalette, AnchorPulse, deep links from BuildIssue + CheckCard.
- Phase 5 stdio bridge: `argus-bridge` published-shaped, `--cmd` one-shot mode, `probeBridge` helper, ScanComposer hint + readiness check.
- 498/498 argus unit tests + 15/15 bridge tests pass.

What's missing for "ships":
- Empty states on every surface (no scans yet, no builds yet, no recent specs, no checks for a filter).
- Error states (failed scan, bridge unreachable, build invalid JSON, learn 404).
- Global keyboard shortcuts beyond `⌘K` — `g h`, `g t`, `g b`, `g l` jump between surfaces.
- Perf: TestIndex with hundreds of checks is rendered eagerly; lazy-load by category + virtualize the run feed.
- No browser-driven E2E test. A unit-test-only project at this size will silently break on layout regression or route-level Suspense bugs.
- `README.md` lacks "first scan in 60s" walkthrough.

## 3. Scope

Phase 6 ships:
1. Empty states on home, test, build, learn (with a one-line "next step" CTA each).
2. Error states for: scan transport failure, bridge unreachable mid-scan, invalid scaffold JSON, learn route 404.
3. Global keyboard shortcuts wired at the `Lattice` level: `g h` → `/`, `g t` → `/test`, `g b` → `/build`, `g l` → `/learn`. Composed with the existing `⌘K` palette.
4. Lazy-load TestIndex check rows by category — collapsed by default, render on expand.
5. Virtualized RawProtocolLog (it can grow to thousands of frames during a scan).
6. Playwright happy-path test: load `/`, navigate via `g t`, run a mocked scan against a stub MCP server (in-tree Node script via `argus-bridge --cmd`), reach the grade reveal.
7. README walkthrough updated; CHANGELOG seeded for v0.1.0 (argus + argus-bridge).

Out of scope:
- New conformance checks, new spec versions, new transports.
- Theming, accessibility audit beyond what shortcuts touch.
- Cloud/server-side build hosting.

## 4. Tasks

### Task 1: Empty states

**Files:** `argus/components/test/TestIndexPage.tsx`, `argus/components/build/BuildIndexPage.tsx` (or equivalent), `argus/app/page.tsx`, `argus/components/learn/LearnShell.tsx`.

For each surface, render an `<EmptyState>` block when the relevant store slice is empty.

Reuse pattern:

```tsx
<div className={styles.empty}>
  <h2>No scans yet</h2>
  <p>Run your first conformance scan to see results here.</p>
  <Link href="/test/new" className={styles.cta}>Start a scan</Link>
</div>
```

Each empty state must include: a heading, a one-sentence explanation, and a primary CTA link. No emojis.

**Tests:** unit-test each empty-state component renders the heading + CTA when the data slice is empty, and does NOT render it when the slice has entries.

### Task 2: Error states

**Files:**
- `argus/components/test/ScanRunner.tsx` (or wherever the scan promise is awaited) — render a `<ScanError>` strip with the JSON-RPC method that failed + the error message + a "Retry" button.
- `argus/app/build/[buildId]/page.tsx` — render a `<BuildError>` when the persisted scaffold JSON fails to parse.
- `argus/app/learn/[...slug]/page.tsx` — render an in-page 404 with a "Back to spec index" link when the slug doesn't exist in `spec-index.json`.
- `argus/components/test/ScanComposer.tsx` — when `probeBridge` returns a non-`ok` string, surface it inline (already done in Phase 5; widen to also block "Run scan" if the user just probed and got an error).

**Tests:** unit-test each error component. Mock the failure path; assert the user sees the message and the recovery affordance.

### Task 3: Global keyboard shortcuts

**File:** `argus/components/shell/Lattice.tsx` (or wherever the global key handler lives — likely already where `⌘K` is bound).

Add a state machine that accepts a `g` prefix (1500ms timeout), then maps the next key:
- `g h` → `router.push('/')`
- `g t` → `router.push('/test')`
- `g b` → `router.push('/build')`
- `g l` → `router.push('/learn')`
- `g <anything else>` → cancel

Do **not** fire when:
- The active element is `INPUT`, `TEXTAREA`, `[contenteditable]`, or `SELECT`.
- A modal (the command palette) is open.

Show a tiny chip in the bottom-right while the `g` prefix is pending: "g…" or similar.

**Tests:** unit-test the key handler in isolation. Cases: `g h` navigates; `g x` cancels; `g` then timeout cancels; key fires inside `<input>` is ignored.

### Task 4: Lazy-load checks by category

**File:** `argus/components/test/TestIndexPage.tsx` + `argus/components/test/CategoryStrip.tsx`.

Today TestIndex eagerly renders every `CheckCard`. With 60+ checks and growing this is wasteful (and creates scroll jank on low-end hardware).

Change: each category starts collapsed. Expanding the category strip mounts the `CheckCard` list for that category. Persist expand/collapse state in the `prefs` store keyed by category id.

Keep accessibility: clicking the category header toggles `aria-expanded`; the list is `role="region"` with the header as its `aria-labelledby`.

**Tests:** unit-test that toggling a category renders/unmounts its CheckCards. Confirm prefs persistence.

### Task 5: Virtualized RawProtocolLog

**File:** `argus/components/test/RawProtocolLog.tsx`.

For a long-running scan the frame list can hit 1000+. Switch to a small windowed renderer.

Don't pull in `react-window`/`react-virtuoso` if the existing component is simple enough; instead, render only the last N frames + a "Load earlier" button that grows N by 200 each click. Default N=200.

**Tests:** assert that with 500 mock frames, only ~200 list items mount; assert "Load earlier" grows the rendered count.

### Task 6: Playwright happy-path

**Files (new):**
- `argus/playwright.config.ts`
- `argus/tests/e2e/happy-path.spec.ts`
- `argus/tests/e2e/fixtures/stub-mcp-server.mjs` — a tiny stdio JSON-RPC server that handles `initialize`, `ping`, `tools/list` with hard-coded responses.
- `argus/tests/e2e/README.md` — how to run locally.

**Test sequence:**
1. Spawn `argus-bridge --cmd "node tests/e2e/fixtures/stub-mcp-server.mjs"` as a child process before the test, kill in `afterAll`.
2. Start the Next dev server (Playwright `webServer`).
3. Visit `/`, click into Test (or `g t`).
4. Fill the ScanComposer for transport=stdio-ws, bridge=ws://127.0.0.1:7879/bridge.
5. Click "Run scan".
6. Assert the LiveProgress strip shows initialize, then ping, then tools/list.
7. Assert the grade reveal renders a letter grade.

Keep the Playwright scope narrow — one test, no auth flows, no flaky waits. Use `expect.poll()` for the final grade assertion with a generous timeout.

Add `pnpm test:e2e` script. Add Playwright as a dev dep. Don't wire to CI yet — Phase 6 only needs it green locally.

### Task 7: Lattice keyboard chip + palette polish

**File:** `argus/components/shell/Lattice.tsx`.

When the `g` prefix is pending, render a small monospace chip in the bottom-right: `g…`. Hide when prefix clears. Use the existing token palette — no new colors.

Confirm `⌘K` still works alongside the prefix. (`Meta+K` should always preempt any pending `g`.)

### Task 8: README walkthrough

**File:** `argus/README.md`.

Replace the "Status" section with a "First scan in 60 seconds" walkthrough:

```
1. pnpm install
2. pnpm dev → open http://localhost:3000
3. (stdio servers only) npm i -g argus-bridge && argus-bridge
4. Test → paste your server command → Run scan
5. Watch the grade reveal
```

Add a "Surfaces" section linking to `/test`, `/build`, `/learn` with one-line descriptions.

### Task 9: CHANGELOG.md (new)

**Files (new):** `argus/CHANGELOG.md`, `argus-bridge/CHANGELOG.md`.

Seed both with `## [0.1.0] - 2026-05-29` summarizing Phases 1–6 for argus and Phase 5 for argus-bridge.

### Task 10: Final sweep

- `pnpm test` in `argus/` → green.
- `pnpm build` in `argus/` → green.
- `pnpm test` in `argus-bridge/` → green.
- `pnpm build` in `argus-bridge/` → green.
- `pnpm test:e2e` in `argus/` → green.

Document the failing-then-fixed iterations inline as you go.

## 5. Definition of done

- Every surface in `/`, `/test`, `/build`, `/learn` shows an empty state on a fresh load.
- Every surface shows an actionable error state on its primary failure mode.
- `g h`, `g t`, `g b`, `g l` and `⌘K` all work, including inside the build editor.
- TestIndex with 60 checks renders < 100 `CheckCard` DOM nodes on first paint.
- RawProtocolLog with 1000 frames renders < 250 list items.
- Playwright happy-path passes locally.
- README walks a first-time user through scan-to-grade.
- Both packages have a CHANGELOG seeded.

## 6. Risks / Open questions

- Global key handlers and the command palette can race; ensure `Meta+K` always wins.
- Lazy-loading category rows must not break existing keyboard nav inside the category — tab order regressions are easy here. Add a unit test for tab traversal after expand.
- Playwright spawning `argus-bridge` from CI vs. local needs `pnpm --filter argus-bridge build` to have run first. Document this prerequisite.

## 7. Sequencing

Execute in numeric order; each task ends with `pnpm test` green before moving on. Tasks 1–3 are independent; 4–5 are perf and can defer if time-boxed; 6 (Playwright) depends on 1–3 being stable. 7–9 are paperwork. 10 is the gate.
