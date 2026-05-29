# Argus Phase 4 — Learn Tool

Branch: `phase4-learn-tool` (off `phase3-build-engine`)
Surface: `/learn/[...slug]` — browse the MCP DRAFT-2026-v1 spec with tree nav, prose body, outline rail, and `⌘K` fuzzy search. Deep-links from failed test checks open the relevant clause.

---

## 0. Hard constraints

- **Browser-only.** All Learn UI renders client-side. Spec sync script is the only Node-side step.
- **No commits.** Every task ends with `git add <files>` only. Controller commits at phase boundary.
- **No `git push`.** Push at human direction.
- TypeScript strict, ESLint clean.
- Vitest + jsdom + `@testing-library/react` for UI; pure functions for sync script.
- Next.js 15 App Router, `output: 'export'`, static export must build cleanly.
- Reuse Phase 1 design tokens (`--color-*`, `--space-*`, `--text-*`, `--font-mono`).
- Reuse Phase 1 chrome (TitleBar, TabStrip, Footer).
- Spec source lives at `argus/public/spec-source/draft-2026-v1/` — generated, gitignored, regenerated on each `pnpm build` via `prebuild` hook.
- No copyrighted spec text is checked in to argus repo; only the sync script. The source lives at `modelcontextprotocol-main/` already in the parent repo.

---

## 1. Architecture

```
modelcontextprotocol-main/docs/specification/draft/*.mdx
                        │
                        │  scripts/sync-spec.ts  (pnpm prebuild)
                        ▼
argus/public/spec-source/draft-2026-v1/
  ├── *.md                          // stripped of Mintlify front-matter, anchors preserved
  └── spec-index.json               // { tree: SpecNode[], entries: SpecIndexEntry[] }

         /learn (index)              /learn/[...slug]
              │                            │
              ▼                            ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │ LearnShell                                                       │
        │  ┌──────────┐  ┌────────────────────┐  ┌────────────────────┐    │
        │  │ SpecTree │  │ SpecBody (prose +  │  │ SpecOutline (h2/h3 │    │
        │  │ (left)   │  │ prism code blocks) │  │ TOC + check links) │    │
        │  └──────────┘  └────────────────────┘  └────────────────────┘    │
        │  ┌────────────────────────────────────────────────────────────┐  │
        │  │ CommandPalette (⌘K overlay, fuse.js fuzzy search)          │  │
        │  └────────────────────────────────────────────────────────────┘  │
        └──────────────────────────────────────────────────────────────────┘

Deep-link: spec://<slug>[#anchor]
  resolveSpecHref('spec://7.4')      → '/learn/basic/transports#7.4'
  CheckCard.specRef → spec://… → router.push(href + pulse anchor)
```

Rendering rules:
- Markdown → react-markdown with `remark-gfm` (tables) + `rehype-slug` (id headings) + `rehype-prism-plus` (syntax highlight).
- Anchors keyed by heading slug; deep-link target highlights with `--color-accent` pulse (1.2s).
- Spec body never auto-fetches; pages fetch on slug change (single round trip), cache in-memory per session.
- All assets are static (`fetch('/spec-source/draft-2026-v1/index.md')`).

---

## 2. Module layout (new files in this phase)

```
argus/
  scripts/
    sync-spec.ts                       // Node script: copy + strip + index
    sync-spec/                          // pure helpers (testable in vitest)
      frontMatter.ts                    // strip Mintlify keys, keep title
      anchors.ts                        // extract h1/h2/h3 → anchor list
      tree.ts                           // build SpecNode[]
      index.ts                          // build SpecIndexEntry[]
  components/
    learn/
      LearnShell.tsx + LearnShell.module.css
      SpecTree.tsx + SpecTree.module.css
      SpecBody.tsx + SpecBody.module.css
      SpecOutline.tsx + SpecOutline.module.css
      CommandPalette.tsx + CommandPalette.module.css
      AnchorPulse.tsx                   // floating pulse over the active anchor
  lib/
    learn/
      types.ts                          // SpecNode, SpecIndexEntry, SpecAnchor
      href.ts                           // resolveSpecHref, parseSpecScheme
      useSpecIndex.ts                   // singleton fetch + Zustand-ish hook
      useSpecBody.ts                    // body fetch + in-memory cache
      search.ts                         // Fuse.js wrapper
  tests/unit/
    learn/
      frontMatter.test.ts
      anchors.test.ts
      tree.test.ts
      indexBuilder.test.ts
      href.test.ts
      search.test.ts
    components/learn/
      SpecTree.test.tsx
      SpecBody.test.tsx
      SpecOutline.test.tsx
      CommandPalette.test.tsx
  app/learn/
    page.tsx                            // /learn (landing → redirects to index slug)
    page.module.css
    [...slug]/
      page.tsx                          // server wrapper, generateStaticParams
      ClientView.tsx                    // client shell
```

---

## 3. Phase task list

> Each task: file list, public API or visual contract, test plan, staging step.
> Implementer subagents may adapt to existing-code shape if a literal block conflicts.

---

### Task 1: Add dependencies

**Files modified:**
- `argus/package.json`
- `argus/pnpm-lock.yaml`

**Add (runtime):**
- `react-markdown` (^9.x)
- `remark-gfm` (^4.x)
- `rehype-slug` (^6.x)
- `rehype-prism-plus` (^2.x)
- `fuse.js` (^7.x)

**Add (script-side, devDependency):**
- `gray-matter` (^4.x)
- `tsx` (^4.x) — already present via TS codegen tests; verify.

**Step:** `pnpm add react-markdown remark-gfm rehype-slug rehype-prism-plus fuse.js && pnpm add -D gray-matter`

**Stage:** `git add argus/package.json argus/pnpm-lock.yaml`

---

### Task 2: Learn domain types

**File created:**
- `argus/lib/learn/types.ts`

**Public API:**
```ts
export interface SpecAnchor {
  id: string          // heading slug, e.g. "lifecycle-initialization"
  text: string        // heading text
  level: 1 | 2 | 3
}
export interface SpecNode {
  slug: string        // path-relative slug, e.g. "basic/transports"
  title: string
  parentSlug: string | null
  children: SpecNode[]
}
export interface SpecIndexEntry {
  slug: string
  title: string
  excerpt: string     // first ~160 chars of body
  anchors: SpecAnchor[]
  parentSlug: string | null
}
export interface SpecIndex {
  tree: SpecNode[]
  entries: SpecIndexEntry[]
  version: 'draft-2026-v1'
  generatedAt: string
}
```

**Tests:** none new (type-only).

**Stage:** `git add argus/lib/learn/types.ts`

---

### Task 3: Front-matter stripper

**File created:**
- `argus/scripts/sync-spec/frontMatter.ts`

**Public API:**
```ts
export interface StripResult { title: string; body: string }
export function stripFrontMatter(raw: string): StripResult
```

**Behavior:**
- Uses `gray-matter` to parse `---` front-matter.
- Extracts `title` (falls back to first `# ` heading, then to `'Untitled'`).
- Drops Mintlify-specific keys (`mode`, `sidebarTitle`, `icon`, `iconType`, `description` is kept inline only if first paragraph is missing).
- Returns body without the front-matter block.

**Tests:** `argus/tests/unit/learn/frontMatter.test.ts`
- Parses `--- title: Foo ---` correctly.
- Falls back to first `#` heading.
- Falls back to `'Untitled'` when neither present.
- Round-trip preserves body text untouched (no Mintlify tags rewritten in Phase 4).

**Stage:** `git add argus/scripts/sync-spec/frontMatter.ts argus/tests/unit/learn/frontMatter.test.ts`

---

### Task 4: Anchor extractor

**File created:**
- `argus/scripts/sync-spec/anchors.ts`

**Public API:**
```ts
import type { SpecAnchor } from '@/lib/learn/types'
export function extractAnchors(markdown: string): SpecAnchor[]
```

**Behavior:**
- Walks markdown lines, picks up `# `, `## `, `### ` headings.
- Slug each heading via `slugify` from `@/lib/build/slug` (reused).
- Skips headings inside fenced code blocks.
- Levels 1/2/3 only; ignores deeper.

**Tests:** `argus/tests/unit/learn/anchors.test.ts`
- Extracts three headings.
- Skips `### Inside Code` if inside ``` fence.
- Handles trailing whitespace.

**Stage:** `git add argus/scripts/sync-spec/anchors.ts argus/tests/unit/learn/anchors.test.ts`

---

### Task 5: Tree builder

**File created:**
- `argus/scripts/sync-spec/tree.ts`

**Public API:**
```ts
import type { SpecNode } from '@/lib/learn/types'
export interface RawDoc { slug: string; title: string; parentSlug: string | null }
export function buildTree(docs: RawDoc[]): SpecNode[]
```

**Behavior:**
- Given a flat list of `{ slug, title, parentSlug }`, returns a forest where children are nested under their parent.
- Root nodes are those whose `parentSlug` is `null` or whose parent is not in the doc set.
- Children sorted alphabetically by slug, with `index` slugs floated to top within each level.

**Tests:** `argus/tests/unit/learn/tree.test.ts`
- Builds 2-level tree from `basic/index`, `basic/transports`.
- Floats `index` siblings to top.
- Returns nodes with empty `children` for leaves.

**Stage:** `git add argus/scripts/sync-spec/tree.ts argus/tests/unit/learn/tree.test.ts`

---

### Task 6: Index builder

**File created:**
- `argus/scripts/sync-spec/index.ts` (helper, not the script entrypoint)

**Public API:**
```ts
import type { SpecIndex, SpecIndexEntry, SpecNode } from '@/lib/learn/types'
export interface BuildIndexInput {
  entries: SpecIndexEntry[]
  tree: SpecNode[]
}
export function buildSpecIndex(input: BuildIndexInput): SpecIndex
```

**Behavior:**
- Stamps `version: 'draft-2026-v1'`.
- Stamps `generatedAt: new Date().toISOString()`.
- Pass-through for entries + tree.

**Tests:** `argus/tests/unit/learn/indexBuilder.test.ts`
- Stamps version + generatedAt.
- Preserves input entries + tree.

**Stage:** `git add argus/scripts/sync-spec/index.ts argus/tests/unit/learn/indexBuilder.test.ts`

---

### Task 7: Sync script entrypoint

**File created:**
- `argus/scripts/sync-spec.ts`

**Behavior:**
- Walks `../modelcontextprotocol-main/docs/specification/draft/` recursively.
- For each `*.mdx`:
  - Strip front-matter (Task 3).
  - Extract anchors (Task 4).
  - Compute `slug` from relative path with `.mdx`/`.md`/`index` removed.
  - Compute `parentSlug` from directory.
  - First ~160 chars of body → `excerpt` (newline-normalized, code-fence aware).
  - Write `<slug>.md` to `argus/public/spec-source/draft-2026-v1/<slug>.md` (mkdir -p).
- Build tree (Task 5) + index (Task 6).
- Write `argus/public/spec-source/draft-2026-v1/spec-index.json`.
- If source dir missing, exit 0 with warning (allows phase to be re-runnable without the vendored repo).

**Wiring:**
- `argus/package.json` `"scripts"`: add `"prebuild": "tsx scripts/sync-spec.ts"` and `"sync-spec": "tsx scripts/sync-spec.ts"`.
- `argus/.gitignore`: add `public/spec-source/`.

**Tests:** integration-style is unnecessary; helper tests (Tasks 3-6) cover units. Manual `pnpm sync-spec` verification.

**Stage:** `git add argus/scripts/sync-spec.ts argus/package.json argus/.gitignore`

---

### Task 8: spec:// href resolver

**File created:**
- `argus/lib/learn/href.ts`

**Public API:**
```ts
export interface ParsedSpecHref { slug: string; anchor: string | null }
export function parseSpecScheme(href: string): ParsedSpecHref | null
export function resolveSpecHref(specRef: string, index: SpecIndex): string | null
```

**Behavior:**
- `parseSpecScheme('spec://basic/transports#streaming-http')` → `{ slug: 'basic/transports', anchor: 'streaming-http' }`.
- `resolveSpecHref('spec://7.4', index)`: numeric ref (e.g. `7.4`) maps to the first entry whose anchors contain `'7.4'`; returns `/learn/<slug>#<anchor>`.
- Returns `null` on bad input.

**Tests:** `argus/tests/unit/learn/href.test.ts`
- Parses spec scheme.
- Resolves slug-based ref.
- Resolves numeric ref via anchor scan.
- Returns null for malformed.

**Stage:** `git add argus/lib/learn/href.ts argus/tests/unit/learn/href.test.ts`

---

### Task 9: Spec index hook (client)

**File created:**
- `argus/lib/learn/useSpecIndex.ts`

**Public API:**
```ts
export interface UseSpecIndexResult {
  index: SpecIndex | null
  loading: boolean
  error: string | null
}
export function useSpecIndex(): UseSpecIndexResult
```

**Behavior:**
- Singleton fetch from `/spec-source/draft-2026-v1/spec-index.json` on first call.
- Subsequent calls return cached value.
- `error` non-null if fetch fails.

**Tests:** mocked `fetch`; verify cache shape.

**Stage:** `git add argus/lib/learn/useSpecIndex.ts argus/tests/unit/learn/useSpecIndex.test.ts`

---

### Task 10: Spec body hook

**File created:**
- `argus/lib/learn/useSpecBody.ts`

**Public API:**
```ts
export interface UseSpecBodyResult {
  body: string | null
  loading: boolean
  error: string | null
}
export function useSpecBody(slug: string | null): UseSpecBodyResult
```

**Behavior:**
- Fetches `/spec-source/draft-2026-v1/<slug>.md` on slug change.
- In-memory `Map<slug, body>` cache survives within session.
- Returns `null` body if `slug` is null.

**Stage:** `git add argus/lib/learn/useSpecBody.ts argus/tests/unit/learn/useSpecBody.test.ts`

---

### Task 11: Fuzzy search wrapper

**File created:**
- `argus/lib/learn/search.ts`

**Public API:**
```ts
export interface SpecSearchHit {
  slug: string
  title: string
  excerpt: string
  score: number
  matchedAnchor: SpecAnchor | null
}
export function searchSpec(index: SpecIndex, query: string, max?: number): SpecSearchHit[]
```

**Behavior:**
- Wraps Fuse.js with weighted keys: `title 0.6`, `excerpt 0.3`, `anchors.text 0.1`.
- `max` defaults to 20.
- Empty query → empty array.

**Tests:** `argus/tests/unit/learn/search.test.ts`
- Returns title match first.
- Returns excerpt match second.
- Empty query yields empty.

**Stage:** `git add argus/lib/learn/search.ts argus/tests/unit/learn/search.test.ts`

---

### Task 12: SpecTree component

**File created:**
- `argus/components/learn/SpecTree.tsx`
- `argus/components/learn/SpecTree.module.css`

**Props:**
```ts
interface SpecTreeProps {
  tree: SpecNode[]
  activeSlug: string | null
  onSelect(slug: string): void
}
```

**Visual contract:**
- Mono font, nested `<ul>` indented 12px per level.
- Active row: phosphor underline + `--color-accent` background tint.
- Expand/collapse on click of folder triangle (▾/▸); leaves have no triangle.
- Persisted expansion state lives in component (`Set<string>`), default expanded for ancestors of active slug.

**Tests:** `argus/tests/unit/components/learn/SpecTree.test.tsx`
- Renders root + nested nodes.
- Active slug highlighted.
- Click leaf fires onSelect.
- Click triangle toggles children visibility.

**Stage:** `git add argus/components/learn/SpecTree.tsx argus/components/learn/SpecTree.module.css argus/tests/unit/components/learn/SpecTree.test.tsx`

---

### Task 13: SpecBody component

**File created:**
- `argus/components/learn/SpecBody.tsx`
- `argus/components/learn/SpecBody.module.css`

**Props:**
```ts
interface SpecBodyProps {
  markdown: string
  onAnchorMount?(anchors: SpecAnchor[]): void
}
```

**Visual contract:**
- Rendered via `react-markdown` with `remark-gfm`, `rehype-slug`, `rehype-prism-plus`.
- Code blocks: mono phosphor-green-on-paper (override Prism theme via CSS module).
- Tables: token-border `--color-hairline`.
- Headings: id set by rehype-slug → anchor targets.
- Sized for ~720px reading width centered.

**Tests:** `argus/tests/unit/components/learn/SpecBody.test.tsx`
- Renders headings, paragraphs, code block.
- `id` attributes present on h2/h3.

**Stage:** `git add argus/components/learn/SpecBody.tsx argus/components/learn/SpecBody.module.css argus/tests/unit/components/learn/SpecBody.test.tsx`

---

### Task 14: SpecOutline component

**File created:**
- `argus/components/learn/SpecOutline.tsx`
- `argus/components/learn/SpecOutline.module.css`

**Props:**
```ts
interface SpecOutlineProps {
  anchors: SpecAnchor[]
  activeAnchorId: string | null
  onJump(id: string): void
}
```

**Visual contract:**
- Right rail, sticky.
- h2 left-aligned; h3 indented 12px.
- Active anchor: left border phosphor-green.
- Below the TOC: a `Checks` section listing related conformance check IDs by category (Phase 4 v1: render the slug→category mapping table; full check linkage deferred to Phase 6).

**Tests:** `argus/tests/unit/components/learn/SpecOutline.test.tsx`
- Renders anchors at correct indent.
- Click fires onJump.
- Active anchor styled.

**Stage:** `git add argus/components/learn/SpecOutline.tsx argus/components/learn/SpecOutline.module.css argus/tests/unit/components/learn/SpecOutline.test.tsx`

---

### Task 15: CommandPalette component

**File created:**
- `argus/components/learn/CommandPalette.tsx`
- `argus/components/learn/CommandPalette.module.css`

**Props:**
```ts
interface CommandPaletteProps {
  open: boolean
  onClose(): void
  onPick(slug: string, anchor: string | null): void
  search(query: string): SpecSearchHit[]
}
```

**Visual contract:**
- Modal centered, 600px wide, backdrop `rgba(8,10,14,0.7)`.
- Input + result list, max 8 visible at a time.
- Arrow up/down navigates; Enter picks; Esc closes.
- Each result row: title, slug as crumb, excerpt fragment (highlight matched term).
- `⌘K` / `Ctrl+K` global keybind opens.

**Tests:** `argus/tests/unit/components/learn/CommandPalette.test.tsx`
- Opens on prop change; closes on Esc.
- Arrow navigation moves selection.
- Enter calls onPick.
- Renders search results.

**Stage:** `git add argus/components/learn/CommandPalette.tsx argus/components/learn/CommandPalette.module.css argus/tests/unit/components/learn/CommandPalette.test.tsx`

---

### Task 16: AnchorPulse component

**File created:**
- `argus/components/learn/AnchorPulse.tsx`

**Behavior:**
- Reads `?pulse=<anchorId>` from URL on mount.
- Scrolls anchor into view (smooth, block: 'start').
- Adds `data-pulse="true"` to the heading for 1.2s; CSS in `SpecBody.module.css` provides the keyframe (border-bottom phosphor sweep).

**Tests:** behavior verified via `SpecBody` integration; no standalone test.

**Stage:** `git add argus/components/learn/AnchorPulse.tsx`

---

### Task 17: LearnShell

**File created:**
- `argus/components/learn/LearnShell.tsx`
- `argus/components/learn/LearnShell.module.css`

**Props:**
```ts
interface LearnShellProps {
  index: SpecIndex
  activeSlug: string
  activeAnchor: string | null
  onNavigate(slug: string, anchor: string | null): void
}
```

**Behavior:**
- Orchestrates SpecTree (left), SpecBody (center), SpecOutline (right), CommandPalette (overlay).
- Tracks `activeAnchorId` based on scroll position (IntersectionObserver on headings).
- Opens palette on `⌘K`.
- Resolves anchors for the current body once it loads; feeds Outline.

**Tests:** smoke render test only (mock useSpecBody).

**Stage:** `git add argus/components/learn/LearnShell.tsx argus/components/learn/LearnShell.module.css argus/tests/unit/components/learn/LearnShell.test.tsx`

---

### Task 18: /learn index page

**File modified:**
- `argus/app/learn/page.tsx` (already exists from Phase 1 placeholder; replace).
- `argus/app/learn/page.module.css`

**Behavior:**
- Client component that mounts `LearnShell` for the spec landing (slug `'index'` or first root child).
- Shows loading state while `useSpecIndex` resolves.
- Shows "spec not synced — run `pnpm sync-spec`" empty state if fetch fails.

**Stage:** `git add argus/app/learn/page.tsx argus/app/learn/page.module.css`

---

### Task 19: /learn/[...slug] page

**File modified:**
- `argus/app/learn/[...slug]/page.tsx` (already exists; replace).
- `argus/app/learn/[...slug]/ClientView.tsx` (new)

**Behavior:**
- Server wrapper: `generateStaticParams` → `[{ slug: ['index'] }]` (placeholder; runtime navigation handles real slugs).
- ClientView reads `params` (catch-all), joins on `/`, parses optional `?anchor=` and `?pulse=` from `useSearchParams`.
- Renders `LearnShell` with resolved slug + anchor.

**Stage:** `git add argus/app/learn/[...slug]/page.tsx argus/app/learn/[...slug]/ClientView.tsx`

---

### Task 20: Wire spec deep-link from CheckCard

**File modified:**
- `argus/components/test/CheckCard.tsx`

**Change:**
- If `check.specRef` is non-empty and starts with `spec://`, render a small "Open spec" anchor linking to `resolveSpecHref(check.specRef, index)`.
- Use `useSpecIndex()` inside CheckCard; gracefully render nothing if index not loaded yet (no flash).
- Open target in new tab (`target="_blank"`, `rel="noopener"`); append `?pulse=<anchor>` if anchor present.

**Tests:** `argus/tests/unit/test/CheckCard.specLink.test.tsx`
- Renders link when specRef present + index loaded.
- Hides link when no specRef.

**Stage:** `git add argus/components/test/CheckCard.tsx argus/tests/unit/test/CheckCard.specLink.test.tsx`

---

### Task 21: Wire spec deep-link from ValidationStrip

**File modified:**
- `argus/lib/store/types.ts` — extend `BuildIssue` with optional `specRef?: string`.
- `argus/lib/build/validate.ts` — populate `specRef` for issues that map to a known spec clause (e.g. server missing → `spec://basic/lifecycle#initialization`).
- `argus/components/build/ValidationStrip.tsx` — render a small "spec" link next to each issue with a specRef.

**Tests:** extend existing `argus/tests/unit/build/validate.test.ts` to assert one mapping. Extend `argus/tests/unit/components/ValidationStrip.test.tsx` to assert link presence.

**Stage:** `git add argus/lib/store/types.ts argus/lib/build/validate.ts argus/components/build/ValidationStrip.tsx argus/tests/unit/build/validate.test.ts argus/tests/unit/components/ValidationStrip.test.tsx`

---

### Task 22: Static-export verification + README

**Verification:**
- `pnpm sync-spec && pnpm build` succeeds.
- `out/learn/index.html` exists.
- `out/learn/index/index.html` exists.
- All tests pass.

**File modified:**
- `argus/README.md` — add Phase 4 section.

**Stage:** `git add argus/README.md`

---

## 4. Done criteria

- `/learn` loads tree + body for `index` slug.
- Click a tree node updates body without full reload.
- `⌘K` opens palette; type "transport" → ranks transport-related docs first.
- Failing check on a `/test` results page shows "Open spec" → new tab → highlighted heading.
- `pnpm build` static-exports cleanly with synced spec files vendored at build time.
- Full test suite stays green (no Phase 1/2/3 regressions).
