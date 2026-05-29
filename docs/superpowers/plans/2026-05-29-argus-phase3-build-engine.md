# Argus Phase 3 — Build Engine

Branch: `phase3-build-engine` (off `phase2-test-engine`)
Surface: `/build` — visual MCP server composer with TypeScript + Python code generation and zip download.

---

## 0. Hard constraints

- **Browser-only.** Codegen runs in the browser; no Node-side build step.
- **No commits.** Every task ends with `git add <files>` only. Controller commits at phase boundary.
- **No `git push`.** Push at human direction.
- TypeScript strict, ESLint clean.
- Vitest + jsdom + `@testing-library/react` for UI; pure functions for codegen.
- Next.js 15 App Router, `output: 'export'`, static export must build cleanly.
- Reuse Phase 1 design tokens (`--color-*`, `--space-*`, `--text-*`, `--font-mono`).
- Reuse Phase 1 store middleware (`persisted` from `argus/lib/store/persist.ts`).
- Reuse Phase 1 `Build` / `BuildNode` / `BuildEdge` / `ToolDef` / `PromptDef` / `ResourceDef` / `ServerMeta` / `CapabilityInfo` types in `argus/lib/store/types.ts`. Extend only when strictly required.
- Reuse Phase 2 `ajv` for JSON Schema validation in the schema editor.

---

## 1. Architecture

```
/build (index)                         /build/[buildId]
    │                                      │
    │ select / create                      │
    ▼                                      ▼
┌──────────────────────┐         ┌───────────────────────────────────────────┐
│ BuildList            │         │ BuildCanvasPage                           │
│ - useBuildsStore     │         │  ┌─────────┐ ┌──────────┐ ┌────────────┐ │
│ - row per Build      │         │  │ Palette │ │ Canvas   │ │ Inspector  │ │
│ - new / delete       │         │  │ (left)  │ │ (center) │ │ (right)    │ │
└──────────────────────┘         │  └─────────┘ └──────────┘ └────────────┘ │
                                 │  ┌───────────────────────────────────┐   │
                                 │  │ ValidationStrip (bottom)          │   │
                                 │  └───────────────────────────────────┘   │
                                 │  ┌───────────────────────────────────┐   │
                                 │  │ GenerateModal (overlay on demand) │   │
                                 │  └───────────────────────────────────┘   │
                                 └───────────────────────────────────────────┘

Canvas state = useBuildsStore (single source of truth).
Inspector edits node.data, persisted to localStorage on every change.

Codegen pipeline:
  Build  ──┬─►  validate(Build) ──► issues[]   (block if errors)
           │
           ▼
        plan(Build, language) ──► FileMap = Record<path, content>
           │
           ▼
        zipFileMap(FileMap)    ──► Blob
           │
           ▼
        downloadBlob(Blob, `${slug}.zip`)
```

Codegen rules:
- TypeScript output uses `@modelcontextprotocol/sdk` (the official TS SDK).
- Python output uses `mcp` (the official Python SDK).
- Both targets compile/import without modification on a freshly-installed system.
- All file paths in the FileMap are POSIX (`/`-separated, no leading slash).
- All file contents are UTF-8 strings; binary not supported in Phase 3.

---

## 2. Module layout (new files in this phase)

```
argus/
  components/
    build/
      Palette.tsx + Palette.module.css
      Canvas.tsx + Canvas.module.css
      NodeShape.tsx + NodeShape.module.css
      EdgePath.tsx + EdgePath.module.css
      Inspector.tsx + Inspector.module.css
      inspectors/
        ServerMetaInspector.tsx
        ToolDefInspector.tsx
        PromptDefInspector.tsx
        ResourceDefInspector.tsx
        CapabilityInfoInspector.tsx
        SchemaEditor.tsx + SchemaEditor.module.css
      ValidationStrip.tsx + ValidationStrip.module.css
      GenerateModal.tsx + GenerateModal.module.css
      BuildList.tsx + BuildList.module.css
  lib/
    build/
      factory.ts          // createBuild, addNode, removeNode, addEdge, ...
      validate.ts         // validateBuild → BuildIssue[]
      slug.ts             // slugify name for filenames
      schema.ts           // ajv compile cache + JSON Schema linter
    codegen/
      types.ts            // FileMap, CodegenLanguage, CodegenContext
      runner.ts           // generate(build, language) → FileMap
      typescript/
        index.ts          // language entry
        files/
          package.ts      // package.json
          tsconfig.ts     // tsconfig.json
          server.ts       // src/server.ts
          tool.ts         // src/tools/<slug>.ts
          prompt.ts       // src/prompts/<slug>.ts
          resource.ts     // src/resources/<slug>.ts
          readme.ts       // README.md
          gitignore.ts    // .gitignore
      python/
        index.ts
        files/
          pyproject.ts    // pyproject.toml
          server.ts       // server.py
          tool.ts         // tools/<slug>.py
          prompt.ts       // prompts/<slug>.py
          resource.ts     // resources/<slug>.py
          readme.ts       // README.md
          gitignore.ts    // .gitignore
      zip.ts              // JSZip wrapper
      download.ts         // Blob → <a download> click
    hooks/
      useViewport.ts      // pan + zoom
      useNodeDrag.ts      // drag node body
      useEdgeDrag.ts      // drag from anchor to anchor
  tests/unit/
    build/
      factory.test.ts
      validate.test.ts
      slug.test.ts
      schema.test.ts
    codegen/
      typescript.test.ts
      python.test.ts
      zip.test.ts
      runner.test.ts
    components/
      Palette.test.tsx
      Canvas.test.tsx
      Inspector.test.tsx
      BuildList.test.tsx
      ValidationStrip.test.tsx
      GenerateModal.test.tsx
      SchemaEditor.test.tsx
  app/build/page.tsx          // replace placeholder
  app/build/[buildId]/page.tsx// replace placeholder
  app/build/[buildId]/ClientCanvas.tsx
```

---

## 3. Phase task list

> Each task: file list, public API or visual contract, test plan, staging step.
> Verbatim code only where shape is non-obvious.
> Implementer subagents may adapt to existing-code shape if a literal block conflicts; document deviation in their report.

---

### Task 1: Add dependencies

**Files modified:**
- `argus/package.json`
- `argus/pnpm-lock.yaml`

**Add:**
- `jszip` (^3.10.1) → runtime
- `@types/jszip` is bundled; no separate `@types` entry needed.

**Skip:** No additional dev deps; ajv already present.

**Step:**
1. `cd argus && pnpm add jszip`
2. `git add argus/package.json argus/pnpm-lock.yaml`

**Verify:** `pnpm typecheck` clean.

---

### Task 2: Build domain extensions

**Files modified:**
- `argus/lib/store/types.ts`

**Additions:**
- `export type BuildId = `BLD-${string}``
- `export interface BuildIssue { nodeId?: string; edgeId?: string; severity: 'error' | 'warning'; message: string }`
- Change `Build.id` to `BuildId`.

**No removal.** Existing fields (`name`, `language`, `packageMeta`, `nodes`, `edges`, `viewport`, `modifiedAt`) preserved.

**Tests:** none new (type-only).

**Stage:** `git add argus/lib/store/types.ts`

---

### Task 3: Slug helper

**File created:**
- `argus/lib/build/slug.ts`

**Public API:**
```ts
export function slugify(input: string): string
```

**Behavior:**
- lowercase, ASCII-fold, strip diacritics
- non-alphanumeric → `-`
- collapse repeated `-`, trim leading/trailing `-`
- empty input → `'untitled'`
- preserve a leading underscore if input started with `_`

**Tests:** `argus/tests/unit/build/slug.test.ts`
- `slugify('My Tool')` → `'my-tool'`
- `slugify('Café')` → `'cafe'`
- `slugify('---')` → `'untitled'`
- `slugify('foo bar  baz')` → `'foo-bar-baz'`
- `slugify('_internal')` → `'_internal'`

**Stage:** `git add argus/lib/build/slug.ts argus/tests/unit/build/slug.test.ts`

---

### Task 4: Build factory

**File created:**
- `argus/lib/build/factory.ts`

**Public API:**
```ts
import type {
  Build, BuildEdge, BuildId, BuildNode, NodeData, ServerMeta,
} from '@/lib/store/types'

export const DEFAULT_SERVER_META: ServerMeta
export function createBuild(name?: string): Build
export function addNode(b: Build, type: BuildNode['type'], data: NodeData, position?: { x: number; y: number }): Build
export function removeNode(b: Build, nodeId: string): Build      // also drops connected edges
export function updateNode(b: Build, nodeId: string, patch: Partial<BuildNode>): Build
export function addEdge(b: Build, edge: Omit<BuildEdge, 'id'>): Build
export function removeEdge(b: Build, edgeId: string): Build
export function touch(b: Build): Build                            // bumps modifiedAt
export function nextNodeId(b: Build): string                      // 'n-<n>'
export function nextEdgeId(b: Build): string                      // 'e-<n>'
```

**Defaults:**
- `DEFAULT_SERVER_META = { name: 'new-server', version: '0.1.0', description: '', license: 'MIT' }`
- New Build has exactly one `server` node positioned at `{ x: 0, y: 0 }` whose `data` is `DEFAULT_SERVER_META`.
- New Build viewport `{ x: 0, y: 0, zoom: 1 }`.
- New Build language default `'typescript'`.
- New Build id `BLD-${crypto.randomUUID().slice(0, 8)}`.

**Tests:** `argus/tests/unit/build/factory.test.ts`
- `createBuild()` returns a Build whose `nodes.length === 1` and that node is a server node.
- `addNode` returns a new Build (immutability).
- `removeNode` of a server-connected tool drops `BuildEdge` referencing it.
- `updateNode` patches data without mutating original.
- `nextNodeId` is monotonic per existing nodes.

**Stage:** `git add argus/lib/build/factory.ts argus/tests/unit/build/factory.test.ts`

---

### Task 5: Build validator

**File created:**
- `argus/lib/build/validate.ts`

**Public API:**
```ts
import type { Build, BuildIssue } from '@/lib/store/types'
export function validateBuild(b: Build): BuildIssue[]
```

**Rules:**
1. **Error** if no `server` node.
2. **Error** if more than one `server` node.
3. **Error** if any `BuildEdge` references a missing node id.
4. **Error** if two tools share a name post-slugify.
5. **Error** if two prompts share a name post-slugify.
6. **Error** if two resources share a uri.
7. **Error** if `ToolDef.inputSchema` is missing or not an object literal.
8. **Warning** if a tool node has no `description`.
9. **Warning** if a `prompt-uses-tool` edge points at a non-tool target.
10. **Warning** if a `membership` edge does not connect to the server node.
11. **Warning** if `packageMeta.version` is not semver (`/^\d+\.\d+\.\d+(?:-[\w.]+)?$/`).

**Tests:** `argus/tests/unit/build/validate.test.ts`
- Default `createBuild()` returns `[]` (no issues).
- Removing the server node yields one `error`.
- Duplicate tool name yields one `error` referencing the second node.
- Non-object `inputSchema` yields one `error`.
- Missing description yields one `warning`.

**Stage:** `git add argus/lib/build/validate.ts argus/tests/unit/build/validate.test.ts`

---

### Task 6: Schema editor helpers

**File created:**
- `argus/lib/build/schema.ts`

**Public API:**
```ts
import Ajv, { type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'

export interface SchemaLintIssue { path: string; message: string }
export function parseSchema(input: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string }
export function lintSchema(schema: Record<string, unknown>): SchemaLintIssue[]
export function compileValidator(schema: Record<string, unknown>): ValidateFunction
export function validateSample(validate: ValidateFunction, sample: unknown): { ok: true } | { ok: false; errors: string[] }
```

**Behavior:**
- `parseSchema` wraps `JSON.parse`; returns `{ ok: false, error }` on syntax errors.
- `lintSchema` checks:
  - top-level `type` is required and must be `'object'`
  - `properties` must be an object when present
  - every property in `required` must exist in `properties`
- `compileValidator` uses a single shared Ajv instance with `strict: false`, `allErrors: true`, plus `ajv-formats`.
- `validateSample` runs `validate(sample)`; returns first 10 errors as readable strings (`path: message`).

**Tests:** `argus/tests/unit/build/schema.test.ts`
- Valid schema lints empty.
- Missing `type` → 1 lint issue.
- `required: ['x']` with no `properties.x` → 1 lint issue.
- Sample matching schema validates ok.
- Sample failing schema returns at least one error.

**Stage:** `git add argus/lib/build/schema.ts argus/tests/unit/build/schema.test.ts`

---

### Task 7: Viewport hook

**File created:**
- `argus/lib/hooks/useViewport.ts`

**Public API:**
```ts
export interface Viewport { x: number; y: number; zoom: number }
export interface UseViewportOpts {
  initial: Viewport
  minZoom?: number  // default 0.25
  maxZoom?: number  // default 4
  onChange?: (v: Viewport) => void
}
export interface UseViewportReturn {
  viewport: Viewport
  setViewport: (v: Viewport) => void
  bindPan: (target: HTMLElement | null) => void           // middle-click / space-drag
  bindZoom: (target: HTMLElement | null) => void          // ctrl+wheel
  screenToWorld: (sx: number, sy: number) => { x: number; y: number }
  worldToScreen: (wx: number, wy: number) => { x: number; y: number }
}
export function useViewport(opts: UseViewportOpts): UseViewportReturn
```

**Behavior:**
- Pan: pointer-down (middle button OR primary with `event.shiftKey` for accessibility) → track delta, update `viewport.x/y`.
- Zoom: `wheel` event with `event.ctrlKey` → multiplicative zoom around cursor anchor (`screen → world` then translate so the world point under cursor stays fixed).
- Clamp zoom to `[minZoom, maxZoom]`.
- `screenToWorld / worldToScreen` use `(screen - vp.xy) / vp.zoom` semantics.

**Tests:** `argus/tests/unit/build/viewport.test.ts`
- `screenToWorld` and `worldToScreen` round-trip.
- Zoom clamped at bounds.
- Pan updates persist via `onChange`.

**Stage:** `git add argus/lib/hooks/useViewport.ts argus/tests/unit/build/viewport.test.ts`

---

### Task 8: NodeShape primitive

**Files created:**
- `argus/components/build/NodeShape.tsx`
- `argus/components/build/NodeShape.module.css`

**Props:**
```ts
interface NodeShapeProps {
  node: BuildNode
  selected: boolean
  onPointerDownBody: (e: React.PointerEvent) => void
  onPointerDownAnchor: (e: React.PointerEvent, side: 'in' | 'out') => void
  onClick: () => void
}
```

**Visual rules:**
- Rectangle: width 200, height varies by content.
- Header strip shows node `type` in monospace, color-coded:
  - `server` → `--color-accent`
  - `tool` → `--color-ink1`
  - `prompt` → `--color-pass`
  - `resource` → `--color-warn`
  - `capability` → `--color-ink3`
- Body shows the most informative field of `node.data`:
  - `server` → `packageMeta.name vX.Y.Z`
  - `tool` → tool name + first-line of description (truncated)
  - `prompt` → prompt name + arg count
  - `resource` → uri (truncated) + mimeType
  - `capability` → comma-joined `exposes`
- Two anchors: left (`in`) and right (`out`), 8×8 squares, hit area 16×16.
- `selected` adds 2px border in `--color-accent`.

**Tests:** `argus/tests/unit/components/NodeShape.test.tsx`
- Renders type label.
- Shows server name for server node.
- Shows tool name for tool node.
- `onClick` fires when body pressed without drag.

**Stage:** `git add argus/components/build/NodeShape.tsx argus/components/build/NodeShape.module.css argus/tests/unit/components/NodeShape.test.tsx`

---

### Task 9: EdgePath primitive

**Files created:**
- `argus/components/build/EdgePath.tsx`
- `argus/components/build/EdgePath.module.css`

**Props:**
```ts
interface EdgePathProps {
  source: { x: number; y: number }
  target: { x: number; y: number }
  kind: BuildEdge['kind']
  selected?: boolean
  onClick?: () => void
}
```

**Behavior:**
- SVG `<path d="M ... C ..." />` cubic-bezier with horizontal control offset of `Math.abs(target.x - source.x) * 0.4`.
- Stroke 1.5px; color per kind:
  - `membership` → `--color-ink3`
  - `dependency` → `--color-accent`
  - `prompt-uses-tool` → `--color-pass`
- `selected` doubles stroke width.

**Tests:** `argus/tests/unit/components/EdgePath.test.tsx`
- Renders an SVG `path` with computed `d`.
- Click handler fires on path click.

**Stage:** `git add argus/components/build/EdgePath.tsx argus/components/build/EdgePath.module.css argus/tests/unit/components/EdgePath.test.tsx`

---

### Task 10: Node drag hook

**File created:**
- `argus/lib/hooks/useNodeDrag.ts`

**Public API:**
```ts
export interface UseNodeDragOpts {
  nodeId: string
  initial: { x: number; y: number }
  zoom: number
  snap?: number  // default 8 (px in world units)
  onMove: (pos: { x: number; y: number }) => void
  onCommit: (pos: { x: number; y: number }) => void
}
export function useNodeDrag(opts: UseNodeDragOpts): {
  bind: (e: React.PointerEvent) => void
  dragging: boolean
  position: { x: number; y: number }
}
```

**Behavior:**
- Pointer-down captures pointer.
- Pointer-move dispatches `onMove` with snapped position.
- Pointer-up dispatches `onCommit` and releases capture.
- Movement deltas are divided by `zoom` so 1 screen-px maps to `1 / zoom` world-px.

**Tests:** `argus/tests/unit/build/nodeDrag.test.ts`
- Pointer-down → move → up calls `onMove` then `onCommit`.
- Snap rounds to nearest multiple of `snap`.

**Stage:** `git add argus/lib/hooks/useNodeDrag.ts argus/tests/unit/build/nodeDrag.test.ts`

---

### Task 11: Edge drag hook

**File created:**
- `argus/lib/hooks/useEdgeDrag.ts`

**Public API:**
```ts
export interface UseEdgeDragOpts {
  sourceNodeId: string
  onPreviewEnd: (world: { x: number; y: number }) => void
  onDrop: (target: { nodeId: string; side: 'in' } | null) => void
  resolveTarget: (e: PointerEvent) => { nodeId: string; side: 'in' } | null
}
export function useEdgeDrag(opts: UseEdgeDragOpts): {
  start: (e: React.PointerEvent) => void
  active: boolean
  endPos: { x: number; y: number } | null
}
```

**Behavior:**
- `start` captures the pointer, sets `active = true`, tracks the cursor in world coords via supplied `screenToWorld`. (The hook caller provides resolved world coords through `onPreviewEnd` after running through the canvas viewport.)
- On pointer-up, calls `resolveTarget(e)`; passes that to `onDrop`.

**Tests:** `argus/tests/unit/build/edgeDrag.test.ts`
- Active flag toggles correctly.
- `onDrop` called with `null` when no target.
- `onDrop` called with target on landing on a registered anchor.

**Stage:** `git add argus/lib/hooks/useEdgeDrag.ts argus/tests/unit/build/edgeDrag.test.ts`

---

### Task 12: Canvas container

**Files created:**
- `argus/components/build/Canvas.tsx`
- `argus/components/build/Canvas.module.css`

**Props:**
```ts
interface CanvasProps {
  build: Build
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onChangeBuild: (next: Build) => void
}
```

**Layout:**
- Full-width, full-height `<div>` with grid background (CSS `background-image: linear-gradient(...)`) sized to viewport.
- One `<svg>` overlay rendering edges underneath nodes.
- Nodes rendered as positioned `<div>` wrappers around `<NodeShape>` at `worldToScreen(node.position)`.
- Uses `useViewport`, `useNodeDrag`, `useEdgeDrag`.
- Empty-area click clears selection.
- Edge creation: pointer-down on an `out` anchor → preview line follows cursor → pointer-up on an `in` anchor adds edge via `factory.addEdge`.

**Tests:** `argus/tests/unit/components/Canvas.test.tsx`
- Renders one node-shape per `build.nodes` entry.
- Renders one edge-path per `build.edges` entry.
- Clicking a node calls `onSelectNode` with that id.

**Stage:** `git add argus/components/build/Canvas.tsx argus/components/build/Canvas.module.css argus/tests/unit/components/Canvas.test.tsx`

---

### Task 13: Palette

**Files created:**
- `argus/components/build/Palette.tsx`
- `argus/components/build/Palette.module.css`

**Props:**
```ts
interface PaletteProps {
  onCreate: (type: BuildNode['type'], position: { x: number; y: number }) => void
}
```

**Visual:**
- Left rail, 220px wide, monospace headers.
- Sections: `server`, `tool`, `prompt`, `resource`, `capability`.
- Each item is a button with a brief description.
- Clicking a button calls `onCreate(type, { x: 200, y: 100 })` (canvas-relative default).
- HTML5 drag is **not** required; click-to-create is sufficient in Phase 3.

**Tests:** `argus/tests/unit/components/Palette.test.tsx`
- Lists all five node types.
- Clicking a tool button calls `onCreate('tool', ...)`.

**Stage:** `git add argus/components/build/Palette.tsx argus/components/build/Palette.module.css argus/tests/unit/components/Palette.test.tsx`

---

### Task 14: Inspector shell

**Files created:**
- `argus/components/build/Inspector.tsx`
- `argus/components/build/Inspector.module.css`

**Props:**
```ts
interface InspectorProps {
  build: Build
  selectedNodeId: string | null
  onChangeBuild: (next: Build) => void
}
```

**Behavior:**
- Right rail, 360px wide.
- If `selectedNodeId == null`, shows the `ServerMetaInspector` for the server node.
- Otherwise resolves the node and delegates to the appropriate per-type inspector by `node.type`:
  - `server` → ServerMetaInspector
  - `tool` → ToolDefInspector
  - `prompt` → PromptDefInspector
  - `resource` → ResourceDefInspector
  - `capability` → CapabilityInfoInspector
- Each inspector receives `(node, onChange: (next: BuildNode) => void)`.

**Tests:** `argus/tests/unit/components/Inspector.test.tsx`
- With no selection, renders server meta inspector.
- With tool selected, renders tool inspector.

**Stage:** `git add argus/components/build/Inspector.tsx argus/components/build/Inspector.module.css argus/tests/unit/components/Inspector.test.tsx`

---

### Task 15: ServerMetaInspector

**File created:**
- `argus/components/build/inspectors/ServerMetaInspector.tsx`

**Fields:**
- `name` (text)
- `version` (text, monospace)
- `description` (textarea)
- `license` (text, default `MIT`)

**Behavior:**
- Form binds to `node.data` (ServerMeta).
- Any change immediately calls `onChange(node)` with updated data.

**Tests covered later in Task 23 (combined inspector test file).**

**Stage:** `git add argus/components/build/inspectors/ServerMetaInspector.tsx`

---

### Task 16: SchemaEditor

**Files created:**
- `argus/components/build/inspectors/SchemaEditor.tsx`
- `argus/components/build/inspectors/SchemaEditor.module.css`

**Props:**
```ts
interface SchemaEditorProps {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  label?: string
}
```

**Behavior:**
- Renders a `<textarea>` containing `JSON.stringify(value, null, 2)`.
- On change, attempts to parse and lint via `lib/build/schema.ts`.
- Shows parse errors and lint issues underneath the textarea (one per line, monospace, `--color-error` / `--color-warn`).
- Only commits via `onChange` when the buffer parses successfully.
- A "Try sample" affordance: textarea below lets user paste a sample object; runs `validateSample` against the compiled validator and shows results.

**Tests:** `argus/tests/unit/components/SchemaEditor.test.tsx`
- Invalid JSON shows parse error; no `onChange` call.
- Valid schema commits.
- Sample passing schema reports ok.
- Sample failing schema reports errors.

**Stage:** `git add argus/components/build/inspectors/SchemaEditor.tsx argus/components/build/inspectors/SchemaEditor.module.css argus/tests/unit/components/SchemaEditor.test.tsx`

---

### Task 17: ToolDefInspector

**File created:**
- `argus/components/build/inspectors/ToolDefInspector.tsx`

**Fields:**
- `name` (text)
- `description` (textarea)
- `inputSchema` (SchemaEditor)
- `outputSchema` (SchemaEditor, optional toggle)

**Behavior:**
- Outputs `node.data` as `ToolDef`.
- Toggling "Add output schema" sets `data.outputSchema` to `{ type: 'object' }` if missing or removes the key otherwise.

**Stage:** `git add argus/components/build/inspectors/ToolDefInspector.tsx`

---

### Task 18: PromptDefInspector

**File created:**
- `argus/components/build/inspectors/PromptDefInspector.tsx`

**Fields:**
- `name` (text)
- `description` (textarea)
- `arguments` (list editor: each row name + description + required checkbox + remove button; "+ Add" appends)

**Stage:** `git add argus/components/build/inspectors/PromptDefInspector.tsx`

---

### Task 19: ResourceDefInspector

**File created:**
- `argus/components/build/inspectors/ResourceDefInspector.tsx`

**Fields:**
- `uri` (text, monospace)
- `mimeType` (text, default `application/json`)
- `description` (textarea)

**Stage:** `git add argus/components/build/inspectors/ResourceDefInspector.tsx`

---

### Task 20: CapabilityInfoInspector

**File created:**
- `argus/components/build/inspectors/CapabilityInfoInspector.tsx`

**Fields:**
- `exposes` (multi-select chips out of a fixed list: `tools`, `prompts`, `resources`, `sampling`, `elicitation`, `logging`, `completion`).

**Stage:** `git add argus/components/build/inspectors/CapabilityInfoInspector.tsx`

---

### Task 21: Inspector smoke tests

**File created:**
- `argus/tests/unit/components/Inspectors.test.tsx`

**Tests:**
- ServerMetaInspector: changing `name` propagates via `onChange`.
- ToolDefInspector: switching outputSchema toggle updates `data.outputSchema`.
- PromptDefInspector: adding an argument updates `data.arguments`.
- ResourceDefInspector: changing `mimeType` propagates.
- CapabilityInfoInspector: toggling `tools` chip updates `data.exposes`.

**Stage:** `git add argus/tests/unit/components/Inspectors.test.tsx`

---

### Task 22: ValidationStrip

**Files created:**
- `argus/components/build/ValidationStrip.tsx`
- `argus/components/build/ValidationStrip.module.css`

**Props:**
```ts
interface ValidationStripProps {
  issues: BuildIssue[]
  onSelectNode: (id: string) => void
}
```

**Behavior:**
- Fixed bottom bar in the canvas page (40px tall when empty, expandable when issues present).
- Shows summary: `N errors, M warnings` and a list of clickable rows.
- Clicking a row calls `onSelectNode(issue.nodeId)` if present.

**Tests:** `argus/tests/unit/components/ValidationStrip.test.tsx`
- Renders summary counts.
- Clicking a row calls `onSelectNode` with the right id.

**Stage:** `git add argus/components/build/ValidationStrip.tsx argus/components/build/ValidationStrip.module.css argus/tests/unit/components/ValidationStrip.test.tsx`

---

### Task 23: Codegen types

**File created:**
- `argus/lib/codegen/types.ts`

**Public API:**
```ts
export type CodegenLanguage = 'typescript' | 'python'
export type FileMap = Record<string, string>

export interface CodegenContext {
  build: Build
  serverSlug: string                // slugify(packageMeta.name)
  tools: { node: BuildNode; data: ToolDef; slug: string }[]
  prompts: { node: BuildNode; data: PromptDef; slug: string }[]
  resources: { node: BuildNode; data: ResourceDef; slug: string }[]
  capability: CapabilityInfo | null
}

export interface LanguageGenerator {
  language: CodegenLanguage
  generate(ctx: CodegenContext): FileMap
}
```

**Tests:** none (types only).

**Stage:** `git add argus/lib/codegen/types.ts`

---

### Task 24: TypeScript codegen — package.json

**File created:**
- `argus/lib/codegen/typescript/files/package.ts`

**Public API:**
```ts
export function packageJson(ctx: CodegenContext): string
```

**Output:** JSON string with:
- `name`: `ctx.serverSlug`
- `version`: `ctx.build.packageMeta.version`
- `description`: `ctx.build.packageMeta.description`
- `license`: `ctx.build.packageMeta.license`
- `type`: `'module'`
- `main`: `'dist/server.js'`
- `scripts`: `{ build: 'tsc', start: 'node dist/server.js', dev: 'tsx src/server.ts' }`
- `dependencies`: `{ '@modelcontextprotocol/sdk': '^1.0.0', zod: '^3.23.0' }`
- `devDependencies`: `{ typescript: '^5.6.0', tsx: '^4.19.0' }`

Indent 2 spaces, trailing newline.

**Stage:** `git add argus/lib/codegen/typescript/files/package.ts`

---

### Task 25: TypeScript codegen — tsconfig.json

**File created:**
- `argus/lib/codegen/typescript/files/tsconfig.ts`

**Public API:**
```ts
export function tsconfigJson(): string
```

**Output:** JSON string for a strict ESM Node20 target with `outDir: 'dist'`, `rootDir: 'src'`, `module: 'NodeNext'`, `moduleResolution: 'NodeNext'`, `target: 'ES2022'`, `strict: true`, `noUncheckedIndexedAccess: true`, `skipLibCheck: true`. Indent 2 spaces, trailing newline.

**Stage:** `git add argus/lib/codegen/typescript/files/tsconfig.ts`

---

### Task 26: TypeScript codegen — server.ts

**File created:**
- `argus/lib/codegen/typescript/files/server.ts`

**Public API:**
```ts
export function serverTs(ctx: CodegenContext): string
```

**Output sketch:**

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

<tool imports>
<prompt imports>
<resource imports>

const server = new McpServer({
  name: '<name>',
  version: '<version>',
})

<for each tool: server.tool(...)>
<for each prompt: server.prompt(...)>
<for each resource: server.resource(...)>

const transport = new StdioServerTransport()
await server.connect(transport)
```

Imports use `./tools/<slug>.js`, `./prompts/<slug>.js`, `./resources/<slug>.js` (ESM `.js` extensions).

**Stage:** `git add argus/lib/codegen/typescript/files/server.ts`

---

### Task 27: TypeScript codegen — tools/<slug>.ts

**File created:**
- `argus/lib/codegen/typescript/files/tool.ts`

**Public API:**
```ts
export function toolTs(tool: { node: BuildNode; data: ToolDef; slug: string }): string
```

**Output sketch:**
```ts
import { z } from 'zod'

export const name = '<tool.data.name>'
export const description = '<tool.data.description>'
export const inputSchema = <JSON.stringify schema, exported as raw JSON for SDK to consume>
export async function handler(input: unknown) {
  // TODO: implement <tool.data.name>
  return { content: [{ type: 'text', text: 'unimplemented' }] }
}
```

If `outputSchema` present, also export `outputSchema`.

**Stage:** `git add argus/lib/codegen/typescript/files/tool.ts`

---

### Task 28: TypeScript codegen — prompts/<slug>.ts

**File created:**
- `argus/lib/codegen/typescript/files/prompt.ts`

**Public API:**
```ts
export function promptTs(prompt: { node: BuildNode; data: PromptDef; slug: string }): string
```

**Output sketch:**
```ts
export const name = '<name>'
export const description = '<description>'
export const argsSchema = [
  { name: 'argA', description: '...', required: true },
  ...
]
export async function handler(args: Record<string, string>) {
  return {
    messages: [
      { role: 'user', content: { type: 'text', text: `<TODO render prompt: ${JSON.stringify(args)}>` } }
    ],
  }
}
```

**Stage:** `git add argus/lib/codegen/typescript/files/prompt.ts`

---

### Task 29: TypeScript codegen — resources/<slug>.ts

**File created:**
- `argus/lib/codegen/typescript/files/resource.ts`

**Public API:**
```ts
export function resourceTs(resource: { node: BuildNode; data: ResourceDef; slug: string }): string
```

**Output sketch:**
```ts
export const uri = '<uri>'
export const mimeType = '<mimeType>'
export const description = '<description>'
export async function read() {
  // TODO: return contents at <uri>
  return { contents: [{ uri, mimeType, text: '' }] }
}
```

**Stage:** `git add argus/lib/codegen/typescript/files/resource.ts`

---

### Task 30: TypeScript codegen — README + .gitignore

**Files created:**
- `argus/lib/codegen/typescript/files/readme.ts`
- `argus/lib/codegen/typescript/files/gitignore.ts`

**APIs:**
```ts
export function readmeMd(ctx: CodegenContext): string
export function gitignore(): string
```

**README content:** project name, description, `pnpm install`, `pnpm dev`, list of tools/prompts/resources, `Generated by Argus` footer.

**.gitignore:** `node_modules/`, `dist/`, `.env`, `.DS_Store`.

**Stage:** `git add argus/lib/codegen/typescript/files/readme.ts argus/lib/codegen/typescript/files/gitignore.ts`

---

### Task 31: TypeScript language entry

**File created:**
- `argus/lib/codegen/typescript/index.ts`

**Public API:**
```ts
import type { LanguageGenerator } from '../types'
export const typescriptGenerator: LanguageGenerator
```

**Behavior:** assembles `FileMap`:
- `package.json`
- `tsconfig.json`
- `src/server.ts`
- `src/tools/<slug>.ts` per tool
- `src/prompts/<slug>.ts` per prompt
- `src/resources/<slug>.ts` per resource
- `README.md`
- `.gitignore`

**Stage:** `git add argus/lib/codegen/typescript/index.ts`

---

### Task 32: TypeScript codegen tests

**File created:**
- `argus/tests/unit/codegen/typescript.test.ts`

**Tests:**
- Default Build (server only) emits 4 files (`package.json`, `tsconfig.json`, `src/server.ts`, `README.md`, `.gitignore`).
- Build with one tool emits an additional `src/tools/<slug>.ts` and registers it in `src/server.ts`.
- `package.json` contains the server name as slug.
- `src/server.ts` contains `new McpServer`.
- `src/tools/<slug>.ts` contains `export const name`.

**Stage:** `git add argus/tests/unit/codegen/typescript.test.ts`

---

### Task 33: Python codegen — pyproject.toml

**File created:**
- `argus/lib/codegen/python/files/pyproject.ts`

**Public API:**
```ts
export function pyprojectToml(ctx: CodegenContext): string
```

**Output:** PEP-621 `pyproject.toml` string with:
- `name` = `serverSlug`
- `version`, `description`, `license`
- `requires-python = ">=3.11"`
- `dependencies = ["mcp>=1.0.0", "pydantic>=2.0"]`
- Build system: `hatchling`

Use TOML literal strings; emit indented dicts where appropriate.

**Stage:** `git add argus/lib/codegen/python/files/pyproject.ts`

---

### Task 34: Python codegen — server.py

**File created:**
- `argus/lib/codegen/python/files/server.ts`

**Public API:**
```ts
export function serverPy(ctx: CodegenContext): string
```

**Output sketch:**

```python
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server

<tool imports>
<prompt imports>
<resource imports>

server = Server('<name>')

<for each tool: register via @server.list_tools / @server.call_tool dispatch>
<for each prompt: register>
<for each resource: register>

async def main():
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())

if __name__ == '__main__':
    asyncio.run(main())
```

Tool/prompt/resource imports are `from tools.<slug> import name, description, ...`.

**Stage:** `git add argus/lib/codegen/python/files/server.ts`

---

### Task 35: Python codegen — tools/<slug>.py

**File created:**
- `argus/lib/codegen/python/files/tool.ts`

**Public API:**
```ts
export function toolPy(tool: { node: BuildNode; data: ToolDef; slug: string }): string
```

**Output sketch:**
```python
name = '<tool.data.name>'
description = '<tool.data.description>'
input_schema = {<JSON-serialised schema as a Python dict>}

async def handler(arguments: dict) -> dict:
    # TODO: implement <name>
    return { 'content': [{ 'type': 'text', 'text': 'unimplemented' }] }
```

JSON→Python dict conversion uses `JSON.stringify` then string-replace `true→True`, `false→False`, `null→None` at literal token boundaries (not inside string literals — implement carefully). Helper `jsonToPyLiteral(value)` lives at module scope, exported for reuse.

**Stage:** `git add argus/lib/codegen/python/files/tool.ts`

---

### Task 36: Python codegen — prompts + resources

**Files created:**
- `argus/lib/codegen/python/files/prompt.ts`
- `argus/lib/codegen/python/files/resource.ts`

Mirror Tasks 28 + 29 in Python.

**Stage:** `git add argus/lib/codegen/python/files/prompt.ts argus/lib/codegen/python/files/resource.ts`

---

### Task 37: Python codegen — README + .gitignore + index

**Files created:**
- `argus/lib/codegen/python/files/readme.ts`
- `argus/lib/codegen/python/files/gitignore.ts`
- `argus/lib/codegen/python/index.ts`

**README:** project name, description, `pip install -e .`, `python server.py`, lists.

**.gitignore:** `__pycache__/`, `*.pyc`, `.venv/`, `dist/`, `build/`, `.env`.

**Language entry:** assembles `FileMap`:
- `pyproject.toml`
- `server.py`
- `tools/__init__.py` (empty)
- `tools/<slug>.py` per tool
- `prompts/__init__.py` (empty)
- `prompts/<slug>.py` per prompt
- `resources/__init__.py` (empty)
- `resources/<slug>.py` per resource
- `README.md`
- `.gitignore`

**Stage:** `git add argus/lib/codegen/python/files/readme.ts argus/lib/codegen/python/files/gitignore.ts argus/lib/codegen/python/index.ts`

---

### Task 38: Python codegen tests

**File created:**
- `argus/tests/unit/codegen/python.test.ts`

**Tests:**
- Default Build emits 4 base files (`pyproject.toml`, `server.py`, `README.md`, `.gitignore`).
- Build with one tool emits `tools/__init__.py` + `tools/<slug>.py`.
- `server.py` contains `Server('<name>')`.
- `tools/<slug>.py` contains the tool name string.
- `jsonToPyLiteral` round-trips: `{"type":"object"}` → `{'type': 'object'}` (or strict dict literal); `true` → `True`.

**Stage:** `git add argus/tests/unit/codegen/python.test.ts`

---

### Task 39: Codegen runner

**File created:**
- `argus/lib/codegen/runner.ts`

**Public API:**
```ts
import type { Build } from '@/lib/store/types'
import type { CodegenLanguage, FileMap } from './types'

export function generate(build: Build, language: CodegenLanguage): FileMap
```

**Behavior:**
- Builds a `CodegenContext` from `build`.
- Validates via `validateBuild(build)`; if any `severity === 'error'`, throws `new Error('build has errors; resolve before generating')`.
- Delegates to `typescriptGenerator` or `pythonGenerator`.

**Tests:** `argus/tests/unit/codegen/runner.test.ts`
- Default Build generates files for both languages without throwing.
- Build with a missing-server-node `error` throws.
- Generated FileMap key set matches expectation per language.

**Stage:** `git add argus/lib/codegen/runner.ts argus/tests/unit/codegen/runner.test.ts`

---

### Task 40: Zip wrapper

**File created:**
- `argus/lib/codegen/zip.ts`

**Public API:**
```ts
import JSZip from 'jszip'
import type { FileMap } from './types'

export async function zipFileMap(files: FileMap): Promise<Blob>
```

**Behavior:**
- Constructs a JSZip; calls `zip.file(path, content)` for each entry.
- Returns `await zip.generateAsync({ type: 'blob' })`.
- Deterministic ordering (paths sorted lexicographically).

**Tests:** `argus/tests/unit/codegen/zip.test.ts`
- Zipping a 3-file map and unzipping (`JSZip.loadAsync`) returns the same contents and keys.

**Stage:** `git add argus/lib/codegen/zip.ts argus/tests/unit/codegen/zip.test.ts`

---

### Task 41: Download helper

**File created:**
- `argus/lib/codegen/download.ts`

**Public API:**
```ts
export function downloadBlob(blob: Blob, filename: string): void
```

**Behavior:** standard browser pattern — `URL.createObjectURL`, anchor click, revoke after a tick. No tests required (DOM-only).

**Stage:** `git add argus/lib/codegen/download.ts`

---

### Task 42: GenerateModal

**Files created:**
- `argus/components/build/GenerateModal.tsx`
- `argus/components/build/GenerateModal.module.css`

**Props:**
```ts
interface GenerateModalProps {
  build: Build
  open: boolean
  onClose: () => void
}
```

**Behavior:**
- Overlay (fixed, full-viewport, dim background).
- Header: build name + `×` close.
- Body: language radio (`typescript` / `python`).
- Body: file list preview — calls `generate(build, language)` on each language change, shows `Object.keys(fileMap).sort()` with per-file byte size.
- Body: live error if `generate` throws (because validation has errors); link "see validation strip".
- Footer: cancel + "Download zip" button.
- Download button calls `zipFileMap(generate(build, language))` then `downloadBlob(blob, `${slugify(build.name)}-${language}.zip`)`.

**Tests:** `argus/tests/unit/components/GenerateModal.test.tsx`
- Shows file list for default Build (TS).
- Switching to Python updates file list.
- Build with validation errors shows error banner instead of file list.

**Stage:** `git add argus/components/build/GenerateModal.tsx argus/components/build/GenerateModal.module.css argus/tests/unit/components/GenerateModal.test.tsx`

---

### Task 43: BuildList

**Files created:**
- `argus/components/build/BuildList.tsx`
- `argus/components/build/BuildList.module.css`

**Props:**
```ts
interface BuildListProps {
  builds: Build[]
  onOpen: (id: BuildId) => void
  onNew: () => void
  onDelete: (id: BuildId) => void
}
```

**Visual:**
- Header row with "New build" button + search input (filters by name).
- Table-style rows: name · language · node count · modified relative time · "Open" · "Delete".

**Tests:** `argus/tests/unit/components/BuildList.test.tsx`
- Renders all builds.
- Search filters by name.
- New button calls `onNew`.
- Delete row calls `onDelete` with the right id.

**Stage:** `git add argus/components/build/BuildList.tsx argus/components/build/BuildList.module.css argus/tests/unit/components/BuildList.test.tsx`

---

### Task 44: Wire /build index page

**File replaced:**
- `argus/app/build/page.tsx`

**Files created:**
- `argus/app/build/page.module.css`

**Content (replaces Phase 1 placeholder):**
- `'use client'`
- Reads `useBuildsStore().list()`.
- Renders `<BuildList ... />`.
- `onNew`: calls `createBuild()`; `upsertBuild`; `router.push('/build/' + newBuild.id)`.
- `onOpen`: `router.push('/build/' + id)`.
- `onDelete`: `removeBuild(id)`.

**Tests:** `argus/tests/unit/app/BuildIndexPage.test.tsx`
- Initially shows BuildList with zero rows.
- Clicking new triggers router.push to `/build/<id>`.

**Stage:** `git add argus/app/build/page.tsx argus/app/build/page.module.css argus/tests/unit/app/BuildIndexPage.test.tsx`

---

### Task 45: Wire /build/[buildId] page

**File replaced:**
- `argus/app/build/[buildId]/page.tsx`

**Files created:**
- `argus/app/build/[buildId]/ClientCanvas.tsx`
- `argus/app/build/[buildId]/page.module.css`

**page.tsx (server component):**
```tsx
interface Props { params: Promise<{ buildId: string }> }
export default async function BuildCanvasPage({ params }: Props) {
  const { buildId } = await params
  return <ClientCanvas buildId={buildId} />
}
export function generateStaticParams() {
  return [{ buildId: 'placeholder' }]
}
```

**ClientCanvas.tsx:**
- `'use client'`
- Selects build by id from `useBuildsStore`.
- If unknown id, shows "Unknown build" placeholder.
- State: `selectedNodeId`, `generateOpen`.
- Layout: top-left `Palette`, top-right `Inspector`, center `Canvas`, bottom `ValidationStrip`, overlay `GenerateModal`.
- Header bar: build name (editable inline), language pill, "Generate" button.
- Inspector / canvas changes call `upsertBuild(touch(next))`.

**Tests:** `argus/tests/unit/app/BuildCanvasPage.test.tsx`
- With a known build, renders canvas + palette + inspector.
- With an unknown id, renders "Unknown build" placeholder.
- Clicking Generate sets `generateOpen=true` → modal visible.

**Stage:** `git add argus/app/build/[buildId]/page.tsx argus/app/build/[buildId]/ClientCanvas.tsx argus/app/build/[buildId]/page.module.css argus/tests/unit/app/BuildCanvasPage.test.tsx`

---

### Task 46: Round-trip codegen e2e

**File created:**
- `argus/tests/unit/codegen/roundtrip.test.ts`

**Test:**
- Build with one server + two tools (one with output schema) + one prompt + one resource + capability node.
- Run `generate(build, 'typescript')`. Assert file count, presence of all tool/prompt/resource files, references in `src/server.ts`.
- Same for `'python'`.
- Pipe through `zipFileMap` → `JSZip.loadAsync` → read each file back. Assert content matches the FileMap exactly.

**Stage:** `git add argus/tests/unit/codegen/roundtrip.test.ts`

---

### Task 47: Static-export verification

**Files modified:**
- `argus/README.md`

**Step 1:** `cd argus && pnpm build`. Expect PASS.

**Step 2 (manual, optional):** boot static export, visit `/build`, create build, drop tools, generate TS, download zip.

**Step 3:** update README Status to:

```markdown
## Status

Phase 3 — build engine. Compose MCP servers visually in the browser, validate, generate TypeScript or Python source, and download as a zip. /test (Phase 2) and /build (Phase 3) interoperate: scan a generated server end-to-end.
```

**Stage:** `git add argus/README.md`

---

## 4. Self-review checklist

Before declaring Phase 3 done:

- [ ] All 11 component contracts (Palette, Canvas, NodeShape, EdgePath, Inspector + 5 per-type, SchemaEditor, ValidationStrip, GenerateModal, BuildList) implemented and tested.
- [ ] Both language generators emit valid (non-empty, dependency-pinned) source that imports the official SDK by package name.
- [ ] `validateBuild` blocks codegen on `severity === 'error'` and surfaces messages in `ValidationStrip` and `GenerateModal`.
- [ ] FileMap → zip → file readback is byte-identical for UTF-8 content.
- [ ] No new runtime deps beyond `jszip`.
- [ ] Static export builds cleanly; total test count from baseline (289) → 289 + N new tests; no regressions.
- [ ] Stage-only workflow respected: no `git commit`, no `git push` in any task step.
- [ ] No literal eye imagery, terminal-skeuomorphism, pastel colors, or rounded-full chrome introduced (per design brief §8).

---

## 5. Execution handoff

Plan saved to `docs/superpowers/plans/2026-05-29-argus-phase3-build-engine.md`.

Execute via **Subagent-Driven Development** (same as Phase 2):
- fresh implementer subagent per task
- two-stage review per task (spec compliance → code quality)
- mark TodoWrite complete after both reviews pass
- final code-review pass after Task 47

Begin with Task 1.
