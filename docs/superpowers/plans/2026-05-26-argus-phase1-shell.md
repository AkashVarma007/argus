# Argus Phase 1 — Shell Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js static-export shell for Argus — design tokens, chrome (title bar / tab strip / footer), shared primitives (LiveDot, Panel, Button, Input), brand lattice marks, Zustand+localStorage stores, and routing scaffold for all eleven screens.

**Architecture:** Next.js 15 App Router with `output: 'export'` (static SPA, no server runtime). All chrome rendered in the root layout. Each route renders a placeholder page that will be filled in by later phases. Design tokens in TypeScript; CSS variables are derived from them in `globals.css`. State stored in three Zustand stores persisted via the `persist` middleware to `localStorage`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.6, Zustand 5, Vitest 2 + React Testing Library, pnpm 9. Inter + JetBrains Mono via `next/font/google`. No CSS framework — hand-rolled CSS Modules + a shared tokens file. (Playwright E2E deferred to Phase 6.)

---

## File Structure

Files this plan creates:

```
argus/
├── .gitignore
├── .npmrc
├── README.md
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── build/
│   │   ├── page.tsx
│   │   └── [buildId]/page.tsx
│   ├── learn/
│   │   └── [...slug]/page.tsx
│   └── test/
│       ├── page.tsx
│       └── [scanId]/page.tsx
├── components/
│   ├── chrome/
│   │   ├── Footer.tsx
│   │   ├── Footer.module.css
│   │   ├── TabStrip.tsx
│   │   ├── TabStrip.module.css
│   │   ├── TitleBar.tsx
│   │   └── TitleBar.module.css
│   ├── lattice/
│   │   ├── Mark.tsx
│   │   └── MiniStrip.tsx
│   └── primitives/
│       ├── Button.tsx
│       ├── Button.module.css
│       ├── Input.tsx
│       ├── Input.module.css
│       ├── LiveDot.tsx
│       ├── Panel.tsx
│       └── Panel.module.css
├── lib/
│   ├── fonts.ts
│   ├── tokens.ts
│   └── store/
│       ├── builds.ts
│       ├── persist.ts
│       ├── prefs.ts
│       ├── scans.ts
│       └── types.ts
└── tests/
    ├── setup.ts
    └── unit/
        ├── chrome.test.tsx
        ├── lattice.test.tsx
        ├── primitives.test.tsx
        ├── store.test.ts
        └── tokens.test.ts
```

Each file has one responsibility. Chrome components own their CSS modules locally. Stores are independent. Tokens centralize design constants.

---

## Task 1: Project bootstrap — package.json + tooling

**Files:**
- Create: `argus/package.json`
- Create: `argus/.gitignore`
- Create: `argus/.npmrc`
- Create: `argus/tsconfig.json`
- Create: `argus/next.config.ts`

- [ ] **Step 1: Create project directory**

```bash
mkdir -p "/home/nishanth/Desktop/Personal/Akash/MCP Builder/argus"
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder/argus"
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "argus",
  "private": true,
  "version": "0.1.0",
  "description": "Argus — MCP conformance, build, and learn platform",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next build",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.0.4",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "zustand": "5.0.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@types/node": "22.10.0",
    "@types/react": "19.0.1",
    "@types/react-dom": "19.0.1",
    "@vitejs/plugin-react": "4.3.4",
    "eslint": "9.16.0",
    "eslint-config-next": "15.0.4",
    "jsdom": "25.0.1",
    "typescript": "5.7.2",
    "vitest": "2.1.8"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules
.next
out
coverage
playwright-report
test-results
.DS_Store
*.tsbuildinfo
.env*.local
```

- [ ] **Step 4: Write `.npmrc`**

```
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

- [ ] **Step 6: Write `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  experimental: { typedRoutes: true },
}

export default config
```

- [ ] **Step 7: Install dependencies**

Run: `pnpm install`
Expected: lockfile created, `node_modules/` populated, no peer-dep errors. (Note: `next@15.0.4` warns about CVE-2025-66478 — accepted risk; we run static-export only with no Node runtime.)

- [ ] **Step 8: Verify Next.js boots**

Run: `pnpm next info`
Expected: prints Next.js version and platform info.

- [ ] **Step 9: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder"
git init 2>/dev/null || true
git add argus/package.json argus/.gitignore argus/.npmrc argus/tsconfig.json argus/next.config.ts argus/pnpm-lock.yaml
git commit -m "chore(argus): bootstrap Next.js 15 project with TypeScript and pnpm"
```

---

## Task 2: Vitest config (Playwright deferred to Phase 6)

**Files:**
- Modify: `argus/package.json` (remove `@playwright/test` devDep + `test:e2e` script)
- Create: `argus/vitest.config.ts`
- Create: `argus/tests/setup.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 2: Write `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
```

- [ ] **Step 3: Drop Playwright from `package.json`**

Remove `"@playwright/test": "1.49.0"` from `devDependencies`. Remove `"test:e2e": "playwright test"` from `scripts`. Run `pnpm install` to update `pnpm-lock.yaml`.

- [ ] **Step 4: Verify Vitest discovers no tests yet**

Run: `cd argus && pnpm test`
Expected: "No test files found" — exit code 0 once an empty include resolves to nothing. If exit is non-zero, that is acceptable for this step as we have not added tests; proceed.

- [ ] **Step 5: Commit**

```bash
git add argus/package.json argus/pnpm-lock.yaml argus/vitest.config.ts argus/tests/setup.ts
git commit -m "chore(argus): configure Vitest with jsdom (defer Playwright to Phase 6)"
```

---

## Task 3: Design tokens

**Files:**
- Create: `argus/lib/tokens.ts`
- Create: `argus/tests/unit/tokens.test.ts`

- [ ] **Step 1: Write failing test for tokens**

Path: `argus/tests/unit/tokens.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { tokens } from '@/lib/tokens'

describe('design tokens', () => {
  it('exposes the Lattice surface palette', () => {
    expect(tokens.color.paper).toBe('#070d15')
    expect(tokens.color.surface1).toBe('#0d141e')
    expect(tokens.color.surface2).toBe('#141d28')
    expect(tokens.color.hairline).toBe('#1f2531')
  })

  it('exposes ink ramp ink0..ink4', () => {
    expect(tokens.color.ink0).toBe('#e8eef7')
    expect(tokens.color.ink4).toBe('#3a414c')
  })

  it('exposes phosphor green signal and dim variant', () => {
    expect(tokens.color.signal).toBe('#2bf07f')
    expect(tokens.color.signalDim).toBe('#0e3a23')
    expect(tokens.color.glow).toBe('rgba(43, 240, 127, 0.5)')
  })

  it('exposes warn for failures', () => {
    expect(tokens.color.warn).toBe('#ffb4a8')
  })

  it('exposes typography stacks', () => {
    expect(tokens.font.sans).toMatch(/Inter/)
    expect(tokens.font.mono).toMatch(/JetBrains Mono/)
  })

  it('exposes motion durations', () => {
    expect(tokens.motion.pulse).toBe('1.6s')
    expect(tokens.motion.draw).toBe('600ms')
  })

  it('exposes a baseline 8px scale', () => {
    expect(tokens.space[1]).toBe('4px')
    expect(tokens.space[2]).toBe('8px')
    expect(tokens.space[4]).toBe('16px')
    expect(tokens.space[8]).toBe('32px')
  })
})
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `cd argus && pnpm test tokens`
Expected: failure — module `@/lib/tokens` not resolvable.

- [ ] **Step 3: Implement `lib/tokens.ts`**

Path: `argus/lib/tokens.ts`

```ts
type TokenShape = {
  color: Record<string, string>
  font: Record<string, string>
  size: Record<string, string>
  motion: Record<string, string>
  space: Record<number, string>
}

export const tokens = {
  color: {
    paper: '#070d15',
    surface1: '#0d141e',
    surface2: '#141d28',
    hairline: '#1f2531',
    ink0: '#e8eef7',
    ink1: '#c2cad6',
    ink2: '#828b97',
    ink3: '#525a66',
    ink4: '#3a414c',
    signal: '#2bf07f',
    signalDim: '#0e3a23',
    glow: 'rgba(43, 240, 127, 0.5)',
    warn: '#ffb4a8',
  },
  font: {
    sans: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  size: {
    titleBar: '30px',
    tabStrip: '32px',
    footer: '24px',
  },
  motion: {
    pulse: '1.6s',
    breathe: '6s',
    draw: '600ms',
    tick: '180ms',
    pop: '420ms',
  },
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
} as const satisfies TokenShape

export type Tokens = typeof tokens
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `cd argus && pnpm test tokens`
Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add argus/lib/tokens.ts argus/tests/unit/tokens.test.ts
git commit -m "feat(argus): add design tokens for Lattice-on-Workbench palette"
```

---

## Task 4: Fonts setup

**Files:**
- Create: `argus/lib/fonts.ts`

- [ ] **Step 1: Write `lib/fonts.ts`**

```ts
import { Inter, JetBrains_Mono } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})
```

- [ ] **Step 2: Commit**

```bash
git add argus/lib/fonts.ts
git commit -m "feat(argus): load Inter and JetBrains Mono via next/font"
```

---

## Task 5: Global styles + motion keyframes

**Files:**
- Create: `argus/app/globals.css`

- [ ] **Step 1: Write `app/globals.css`**

```css
:root {
  --color-paper:     #070d15;
  --color-surface1:  #0d141e;
  --color-surface2:  #141d28;
  --color-hairline:  #1f2531;
  --color-ink0:      #e8eef7;
  --color-ink1:      #c2cad6;
  --color-ink2:      #828b97;
  --color-ink3:      #525a66;
  --color-ink4:      #3a414c;
  --color-signal:    #2bf07f;
  --color-signal-dim:#0e3a23;
  --color-glow:      rgba(43, 240, 127, 0.5);
  --color-warn:      #ffb4a8;

  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --size-titlebar:  30px;
  --size-tabstrip:  32px;
  --size-footer:    24px;

  --motion-pulse:   1.6s;
  --motion-breathe: 6s;
  --motion-draw:    600ms;

  color-scheme: dark;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--color-paper);
  color: var(--color-ink1);
  font-family: var(--font-sans);
  font-feature-settings: "ss01", "cv11";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

::selection {
  background: var(--color-signal-dim);
  color: var(--color-ink0);
}

button, input, textarea, select { font: inherit; color: inherit; }

a { color: inherit; text-decoration: none; }

/* ---- Motion vocabulary ---- */
@keyframes argus-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}

@keyframes argus-breathe {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}

@keyframes argus-blink {
  0%, 49%   { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes argus-tick {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes argus-pop {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes argus-draw {
  from { stroke-dashoffset: var(--len, 600); }
  to   { stroke-dashoffset: 0; }
}

@keyframes argus-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

- [ ] **Step 2: Commit**

```bash
git add argus/app/globals.css
git commit -m "feat(argus): add global CSS variables and motion keyframes"
```

---

## Task 6: Root layout + chrome wiring (placeholder chrome)

**Files:**
- Create: `argus/app/layout.tsx`
- Create: `argus/app/page.tsx`

- [ ] **Step 1: Write `app/layout.tsx`**

```tsx
import './globals.css'
import type { Metadata } from 'next'
import { inter, jetbrainsMono } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Argus',
  description: 'MCP conformance, build, and learn platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Write placeholder `app/page.tsx`**

```tsx
export default function HomePage() {
  return (
    <main style={{ padding: 32, fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--color-ink2)' }}>
      argus · home · placeholder
    </main>
  )
}
```

- [ ] **Step 3: Boot dev server and verify**

Run: `cd argus && pnpm dev`
Expected: server starts on `:3000`, opening `http://localhost:3000` shows the placeholder text on a near-black background.

Then kill the dev server (`Ctrl-C`).

- [ ] **Step 4: Commit**

```bash
git add argus/app/layout.tsx argus/app/page.tsx
git commit -m "feat(argus): add root layout with fonts and placeholder home"
```

---

## Task 7: Primitive — LiveDot

**Files:**
- Create: `argus/components/primitives/LiveDot.tsx`
- Create: `argus/tests/unit/primitives.test.tsx`

- [ ] **Step 1: Write failing test for LiveDot**

Path: `argus/tests/unit/primitives.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LiveDot } from '@/components/primitives/LiveDot'

describe('LiveDot', () => {
  it('renders a circle with default size 6', () => {
    const { container } = render(<LiveDot />)
    const dot = container.querySelector('[data-argus="live-dot"]') as HTMLElement
    expect(dot).toBeInTheDocument()
    expect(dot.style.width).toBe('6px')
    expect(dot.style.height).toBe('6px')
  })

  it('honors the size prop', () => {
    const { container } = render(<LiveDot size={10} />)
    const dot = container.querySelector('[data-argus="live-dot"]') as HTMLElement
    expect(dot.style.width).toBe('10px')
  })

  it('applies pulse animation by default', () => {
    const { container } = render(<LiveDot />)
    const dot = container.querySelector('[data-argus="live-dot"]') as HTMLElement
    expect(dot.style.animationName).toBe('argus-pulse')
  })
})
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `cd argus && pnpm test primitives`
Expected: failure — module not found.

- [ ] **Step 3: Implement `LiveDot.tsx`**

Path: `argus/components/primitives/LiveDot.tsx`

```tsx
import type { CSSProperties } from 'react'

interface LiveDotProps {
  size?: number
  color?: string
  duration?: string
  style?: CSSProperties
}

export function LiveDot({
  size = 6,
  color = 'var(--color-signal)',
  duration = 'var(--motion-pulse)',
  style,
}: LiveDotProps) {
  return (
    <span
      data-argus="live-dot"
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${size}px`,
        background: color,
        boxShadow: `0 0 ${size * 1.5}px ${color}`,
        animation: `argus-pulse ${duration} ease-in-out infinite`,
        ...style,
      }}
    />
  )
}
```

- [ ] **Step 4: Run test, confirm passes**

Run: `cd argus && pnpm test primitives`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add argus/components/primitives/LiveDot.tsx argus/tests/unit/primitives.test.tsx
git commit -m "feat(argus): add LiveDot primitive with phosphor pulse"
```

---

## Task 8: Primitive — Panel

**Files:**
- Create: `argus/components/primitives/Panel.tsx`
- Create: `argus/components/primitives/Panel.module.css`
- Modify: `argus/tests/unit/primitives.test.tsx`

- [ ] **Step 1: Append failing test for Panel**

Add to `argus/tests/unit/primitives.test.tsx`:

```tsx
import { Panel } from '@/components/primitives/Panel'

describe('Panel', () => {
  it('renders children inside a panel element', () => {
    const { getByText } = render(<Panel><span>inside</span></Panel>)
    expect(getByText('inside')).toBeInTheDocument()
  })

  it('exposes elevated variant via data attribute', () => {
    const { container } = render(<Panel elevated>x</Panel>)
    const el = container.querySelector('[data-argus="panel"]') as HTMLElement
    expect(el.dataset.elevated).toBe('true')
  })

  it('exposes label via aria-label when title provided', () => {
    const { container } = render(<Panel title="results">x</Panel>)
    const el = container.querySelector('[data-argus="panel"]') as HTMLElement
    expect(el.getAttribute('aria-label')).toBe('results')
  })
})
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `cd argus && pnpm test primitives`
Expected: failure — `@/components/primitives/Panel` not found.

- [ ] **Step 3: Write `Panel.module.css`**

```css
.root {
  background: var(--color-surface1);
  border: 1px solid var(--color-hairline);
  border-radius: 4px;
  padding: 12px 14px;
  font-family: var(--font-sans);
  color: var(--color-ink1);
}

.root[data-elevated='true'] {
  background: var(--color-surface2);
}

.title {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-ink3);
  margin-bottom: 8px;
}
```

- [ ] **Step 4: Write `Panel.tsx`**

```tsx
import type { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  children: ReactNode
  title?: string
  elevated?: boolean
  className?: string
}

export function Panel({ children, title, elevated, className }: PanelProps) {
  return (
    <div
      data-argus="panel"
      data-elevated={elevated ? 'true' : undefined}
      aria-label={title}
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      {title && <div className={styles.title}>{title}</div>}
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Run test, confirm passes**

Run: `cd argus && pnpm test primitives`
Expected: 6 passing total.

- [ ] **Step 6: Commit**

```bash
git add argus/components/primitives/Panel.tsx argus/components/primitives/Panel.module.css argus/tests/unit/primitives.test.tsx
git commit -m "feat(argus): add Panel primitive with elevated variant"
```

---

## Task 9: Primitive — Button

**Files:**
- Create: `argus/components/primitives/Button.tsx`
- Create: `argus/components/primitives/Button.module.css`
- Modify: `argus/tests/unit/primitives.test.tsx`

- [ ] **Step 1: Append failing test for Button**

Add to `argus/tests/unit/primitives.test.tsx`:

```tsx
import { Button } from '@/components/primitives/Button'

describe('Button', () => {
  it('renders its children as label', () => {
    const { getByText } = render(<Button>Run scan</Button>)
    expect(getByText('Run scan')).toBeInTheDocument()
  })

  it('applies primary variant data attr by default', () => {
    const { container } = render(<Button>x</Button>)
    const el = container.querySelector('button') as HTMLElement
    expect(el.dataset.variant).toBe('primary')
  })

  it('honors variant=ghost', () => {
    const { container } = render(<Button variant="ghost">x</Button>)
    const el = container.querySelector('button') as HTMLElement
    expect(el.dataset.variant).toBe('ghost')
  })

  it('is disabled when prop disabled', () => {
    const { container } = render(<Button disabled>x</Button>)
    const el = container.querySelector('button') as HTMLButtonElement
    expect(el.disabled).toBe(true)
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test primitives`
Expected: failure — module not found.

- [ ] **Step 3: Write `Button.module.css`**

```css
.root {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 8px 14px;
  border-radius: 2px;
  cursor: pointer;
  transition: background 120ms ease;
  border: 1px solid var(--color-hairline);
}

.root[data-variant='primary'] {
  background: var(--color-signal);
  color: var(--color-paper);
  border-color: var(--color-signal);
}

.root[data-variant='primary']:hover:not(:disabled) {
  box-shadow: 0 0 14px var(--color-glow);
}

.root[data-variant='ghost'] {
  background: transparent;
  color: var(--color-ink1);
}

.root[data-variant='ghost']:hover:not(:disabled) {
  background: var(--color-surface2);
  color: var(--color-ink0);
}

.root:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

- [ ] **Step 4: Write `Button.tsx`**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'ghost'
}

export function Button({ children, variant = 'primary', className, ...rest }: ButtonProps) {
  return (
    <button
      data-variant={variant}
      className={[styles.root, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 5: Run test, confirm passes**

Run: `cd argus && pnpm test primitives`
Expected: 10 passing total.

- [ ] **Step 6: Commit**

```bash
git add argus/components/primitives/Button.tsx argus/components/primitives/Button.module.css argus/tests/unit/primitives.test.tsx
git commit -m "feat(argus): add Button primitive with primary/ghost variants"
```

---

## Task 10: Primitive — Input

**Files:**
- Create: `argus/components/primitives/Input.tsx`
- Create: `argus/components/primitives/Input.module.css`
- Modify: `argus/tests/unit/primitives.test.tsx`

- [ ] **Step 1: Append failing test**

Add to `argus/tests/unit/primitives.test.tsx`:

```tsx
import { Input } from '@/components/primitives/Input'

describe('Input', () => {
  it('renders with provided placeholder', () => {
    const { getByPlaceholderText } = render(<Input placeholder="endpoint" />)
    expect(getByPlaceholderText('endpoint')).toBeInTheDocument()
  })

  it('renders prefix slot', () => {
    const { getByText } = render(<Input prefix="https://" />)
    expect(getByText('https://')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test primitives`
Expected: failure — module not found.

- [ ] **Step 3: Write `Input.module.css`**

```css
.wrap {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-hairline);
  background: var(--color-surface1);
  border-radius: 2px;
  padding: 0 10px;
  height: 32px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-ink1);
}

.wrap:focus-within {
  border-color: var(--color-signal);
  box-shadow: 0 0 0 1px var(--color-signal);
}

.prefix {
  color: var(--color-ink3);
  margin-right: 8px;
}

.input {
  background: transparent;
  border: none;
  outline: none;
  flex: 1;
  color: inherit;
  font: inherit;
}

.input::placeholder { color: var(--color-ink3); }
```

- [ ] **Step 4: Write `Input.tsx`**

```tsx
import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: ReactNode
}

export function Input({ prefix, className, ...rest }: InputProps) {
  return (
    <label className={[styles.wrap, className].filter(Boolean).join(' ')}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <input className={styles.input} {...rest} />
    </label>
  )
}
```

- [ ] **Step 5: Run test, confirm passes**

Run: `cd argus && pnpm test primitives`
Expected: 12 passing total.

- [ ] **Step 6: Commit**

```bash
git add argus/components/primitives/Input.tsx argus/components/primitives/Input.module.css argus/tests/unit/primitives.test.tsx
git commit -m "feat(argus): add Input primitive with prefix slot"
```

---

## Task 11: Lattice — Mark (brand)

**Files:**
- Create: `argus/components/lattice/Mark.tsx`
- Create: `argus/tests/unit/lattice.test.tsx`

- [ ] **Step 1: Write failing test**

Path: `argus/tests/unit/lattice.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Mark } from '@/components/lattice/Mark'

describe('Mark', () => {
  it('renders a 4x4 grid (16 rects)', () => {
    const { container } = render(<Mark />)
    expect(container.querySelectorAll('rect').length).toBe(16)
  })

  it('honors size prop', () => {
    const { container } = render(<Mark size={32} />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('width')).toBe('32')
    expect(svg.getAttribute('height')).toBe('32')
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test lattice`
Expected: failure — module not found.

- [ ] **Step 3: Implement `Mark.tsx`**

```tsx
interface MarkProps {
  size?: number
  ink?: string
  dim?: string
}

export function Mark({ size = 22, ink = 'var(--color-ink0)', dim = 'var(--color-hairline)' }: MarkProps) {
  const cells: number[][] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) cells.push([r, c])
  }
  const cell = (size - 2) / 4
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Argus">
      {cells.map(([r, c]) => (
        <rect
          key={`${r}-${c}`}
          x={r * cell + 1}
          y={c * cell + 1}
          width={cell - 1}
          height={cell - 1}
          fill={(r + c) % 2 === 0 ? ink : dim}
        />
      ))}
    </svg>
  )
}
```

- [ ] **Step 4: Run test, confirm passes**

Run: `cd argus && pnpm test lattice`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add argus/components/lattice/Mark.tsx argus/tests/unit/lattice.test.tsx
git commit -m "feat(argus): add Lattice brand mark (4x4 grid)"
```

---

## Task 12: Lattice — MiniStrip (19-column status mini)

**Files:**
- Create: `argus/components/lattice/MiniStrip.tsx`
- Modify: `argus/tests/unit/lattice.test.tsx`

- [ ] **Step 1: Append failing test**

Add to `argus/tests/unit/lattice.test.tsx`:

```tsx
import { MiniStrip } from '@/components/lattice/MiniStrip'

describe('MiniStrip', () => {
  it('renders one column per category (default 19)', () => {
    const { container } = render(<MiniStrip />)
    expect(container.querySelectorAll('[data-argus="mini-cell"]').length).toBe(19)
  })

  it('marks failing columns with data-state="fail"', () => {
    const states: Array<'pass' | 'fail' | 'skip'> = Array(19).fill('pass')
    states[3] = 'fail'
    const { container } = render(<MiniStrip states={states} />)
    const cells = container.querySelectorAll('[data-argus="mini-cell"]')
    expect((cells[3] as HTMLElement).dataset.state).toBe('fail')
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test lattice`
Expected: failure — module not found.

- [ ] **Step 3: Implement `MiniStrip.tsx`**

```tsx
type CellState = 'pass' | 'fail' | 'skip' | 'pending'

interface MiniStripProps {
  states?: CellState[]
}

const COLOR: Record<CellState, string> = {
  pass: 'var(--color-signal)',
  fail: 'var(--color-warn)',
  skip: 'var(--color-ink4)',
  pending: 'var(--color-hairline)',
}

export function MiniStrip({ states = Array(19).fill('pending') as CellState[] }: MiniStripProps) {
  return (
    <div
      data-argus="mini-strip"
      style={{ display: 'inline-flex', gap: 1, height: 10, alignItems: 'stretch' }}
    >
      {states.map((s, i) => (
        <span
          key={i}
          data-argus="mini-cell"
          data-state={s}
          style={{
            width: 3,
            background: COLOR[s],
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test, confirm passes**

Run: `cd argus && pnpm test lattice`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add argus/components/lattice/MiniStrip.tsx argus/tests/unit/lattice.test.tsx
git commit -m "feat(argus): add Lattice MiniStrip status indicator"
```

---

## Task 13: Chrome — TitleBar

**Files:**
- Create: `argus/components/chrome/TitleBar.tsx`
- Create: `argus/components/chrome/TitleBar.module.css`
- Create: `argus/tests/unit/chrome.test.tsx`

- [ ] **Step 1: Write failing test**

Path: `argus/tests/unit/chrome.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TitleBar } from '@/components/chrome/TitleBar'

describe('TitleBar', () => {
  it('shows the argus wordmark', () => {
    const { getByText } = render(<TitleBar version="0.1.0" />)
    expect(getByText('argus')).toBeInTheDocument()
  })

  it('shows the version', () => {
    const { getByText } = render(<TitleBar version="0.1.0" />)
    expect(getByText(/0\.1\.0/)).toBeInTheDocument()
  })

  it('shows the connected indicator', () => {
    const { getByText } = render(<TitleBar version="0.1.0" />)
    expect(getByText('connected')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test chrome`
Expected: failure — module not found.

- [ ] **Step 3: Write `TitleBar.module.css`**

```css
.root {
  height: var(--size-titlebar);
  background: var(--color-surface1);
  border-bottom: 1px solid var(--color-hairline);
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 14px;
  font-family: var(--font-sans);
  flex-shrink: 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.word {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-ink0);
  letter-spacing: -0.005em;
}

.caption {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-ink3);
}

.spacer { flex: 1; }

.right {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-ink2);
}
```

- [ ] **Step 4: Write `TitleBar.tsx`**

```tsx
import { LiveDot } from '@/components/primitives/LiveDot'
import { Mark } from '@/components/lattice/Mark'
import styles from './TitleBar.module.css'

interface TitleBarProps {
  version: string
  storageUsed?: string
}

export function TitleBar({ version, storageUsed = 'localStorage · 0 KB' }: TitleBarProps) {
  return (
    <header className={styles.root}>
      <div className={styles.brand}>
        <Mark size={14} />
        <span className={styles.word}>argus</span>
        <span className={styles.caption}>workbench · v{version}</span>
      </div>
      <div className={styles.spacer} />
      <div className={styles.right}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <LiveDot size={5} />
          connected
        </span>
        <span style={{ color: 'var(--color-ink3)' }}>{storageUsed}</span>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Run test, confirm passes**

Run: `cd argus && pnpm test chrome`
Expected: 3 passing.

- [ ] **Step 6: Commit**

```bash
git add argus/components/chrome/TitleBar.tsx argus/components/chrome/TitleBar.module.css argus/tests/unit/chrome.test.tsx
git commit -m "feat(argus): add TitleBar chrome with brand mark and live dot"
```

---

## Task 14: Chrome — TabStrip

**Files:**
- Create: `argus/components/chrome/TabStrip.tsx`
- Create: `argus/components/chrome/TabStrip.module.css`
- Modify: `argus/tests/unit/chrome.test.tsx`

- [ ] **Step 1: Append failing test**

Add to `argus/tests/unit/chrome.test.tsx`:

```tsx
import { TabStrip } from '@/components/chrome/TabStrip'

describe('TabStrip', () => {
  it('renders one element per tab', () => {
    const tabs = [
      { id: 'home', label: 'home' },
      { id: 'scn-0142', label: 'scn-0142.report' },
    ]
    const { container } = render(<TabStrip tabs={tabs} activeId="home" />)
    expect(container.querySelectorAll('[data-argus="tab"]').length).toBe(2)
  })

  it('marks the active tab', () => {
    const tabs = [{ id: 'home', label: 'home' }, { id: 'b', label: 'b' }]
    const { container } = render(<TabStrip tabs={tabs} activeId="b" />)
    const active = container.querySelector('[data-argus="tab"][data-active="true"]') as HTMLElement
    expect(active).toBeInTheDocument()
    expect(active.textContent).toMatch(/b/)
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test chrome`
Expected: failure — module not found.

- [ ] **Step 3: Write `TabStrip.module.css`**

```css
.root {
  height: var(--size-tabstrip);
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-hairline);
  display: flex;
  align-items: stretch;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.tab {
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--color-ink3);
  border-right: 1px solid var(--color-hairline);
  border-top: 2px solid transparent;
  cursor: pointer;
}

.tab[data-active='true'] {
  color: var(--color-ink0);
  background: var(--color-surface1);
  border-top-color: var(--color-signal);
  font-weight: 600;
}

.close {
  color: var(--color-ink4);
  font-size: 12px;
}

.spacer { flex: 1; }
```

- [ ] **Step 4: Write `TabStrip.tsx`**

```tsx
import styles from './TabStrip.module.css'

export interface Tab {
  id: string
  label: string
}

interface TabStripProps {
  tabs: Tab[]
  activeId: string
  onClose?: (id: string) => void
  onSelect?: (id: string) => void
}

export function TabStrip({ tabs, activeId, onClose, onSelect }: TabStripProps) {
  return (
    <nav className={styles.root}>
      {tabs.map((t) => (
        <div
          key={t.id}
          data-argus="tab"
          data-active={t.id === activeId ? 'true' : undefined}
          className={styles.tab}
          onClick={() => onSelect?.(t.id)}
        >
          {t.label}
          {onClose && (
            <span
              className={styles.close}
              onClick={(e) => {
                e.stopPropagation()
                onClose(t.id)
              }}
            >
              ×
            </span>
          )}
        </div>
      ))}
      <div className={styles.spacer} />
    </nav>
  )
}
```

- [ ] **Step 5: Run test, confirm passes**

Run: `cd argus && pnpm test chrome`
Expected: 5 passing.

- [ ] **Step 6: Commit**

```bash
git add argus/components/chrome/TabStrip.tsx argus/components/chrome/TabStrip.module.css argus/tests/unit/chrome.test.tsx
git commit -m "feat(argus): add TabStrip chrome with URI-style tabs"
```

---

## Task 15: Chrome — Footer

**Files:**
- Create: `argus/components/chrome/Footer.tsx`
- Create: `argus/components/chrome/Footer.module.css`
- Modify: `argus/tests/unit/chrome.test.tsx`

- [ ] **Step 1: Append failing test**

Add to `argus/tests/unit/chrome.test.tsx`:

```tsx
import { Footer } from '@/components/chrome/Footer'

describe('Footer', () => {
  it('shows the ⌘K hint', () => {
    const { getByText } = render(<Footer scope="home" />)
    expect(getByText(/⌘K/)).toBeInTheDocument()
  })

  it('shows the current scope', () => {
    const { getByText } = render(<Footer scope="test/scn-0142" />)
    expect(getByText(/test\/scn-0142/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test chrome`
Expected: failure — module not found.

- [ ] **Step 3: Write `Footer.module.css`**

```css
.root {
  height: var(--size-footer);
  background: var(--color-surface1);
  border-top: 1px solid var(--color-hairline);
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 18px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-ink2);
  flex-shrink: 0;
}

.scope {
  color: var(--color-ink1);
}

.spacer { flex: 1; }

.hint {
  color: var(--color-ink3);
}
```

- [ ] **Step 4: Write `Footer.tsx`**

```tsx
import styles from './Footer.module.css'

interface FooterProps {
  scope: string
}

export function Footer({ scope }: FooterProps) {
  return (
    <footer className={styles.root}>
      <span className={styles.scope}>{scope}</span>
      <span className={styles.spacer} />
      <span className={styles.hint}>⌘K search</span>
    </footer>
  )
}
```

- [ ] **Step 5: Run test, confirm passes**

Run: `cd argus && pnpm test chrome`
Expected: 7 passing.

- [ ] **Step 6: Commit**

```bash
git add argus/components/chrome/Footer.tsx argus/components/chrome/Footer.module.css argus/tests/unit/chrome.test.tsx
git commit -m "feat(argus): add Footer chrome with scope + ⌘K hint"
```

---

## Task 16: Wire chrome in root layout

**Files:**
- Modify: `argus/app/layout.tsx`
- Create: `argus/app/layout.module.css`

- [ ] **Step 1: Write `app/layout.module.css`**

```css
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-paper);
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 2: Update `app/layout.tsx`**

```tsx
import './globals.css'
import type { Metadata } from 'next'
import { inter, jetbrainsMono } from '@/lib/fonts'
import { TitleBar } from '@/components/chrome/TitleBar'
import { TabStrip } from '@/components/chrome/TabStrip'
import { Footer } from '@/components/chrome/Footer'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: 'Argus',
  description: 'MCP conformance, build, and learn platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { id: 'home', label: 'home' },
    { id: 'test', label: 'test' },
    { id: 'build', label: 'build' },
    { id: 'learn', label: 'learn' },
  ]
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className={styles.shell}>
          <TitleBar version="0.1.0" />
          <TabStrip tabs={tabs} activeId="home" />
          <main className={styles.content}>{children}</main>
          <Footer scope="home" />
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Boot dev server and verify**

Run: `cd argus && pnpm dev`
Expected: visiting `http://localhost:3000` shows title bar (mark + "argus" + version + green pulsing dot + "connected"), tab strip (home/test/build/learn), placeholder home content, footer with "home" + "⌘K search".

Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add argus/app/layout.tsx argus/app/layout.module.css
git commit -m "feat(argus): wire chrome (titlebar/tabs/footer) in root layout"
```

---

## Task 17: Store — types and persist helper

**Files:**
- Create: `argus/lib/store/types.ts`
- Create: `argus/lib/store/persist.ts`
- Create: `argus/tests/unit/store.test.ts`

- [ ] **Step 1: Write `lib/store/types.ts`**

```ts
export type Grade =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D'
  | 'F'

export type Transport = 'http' | 'sse' | 'stdio-ws'

export type Severity = 'critical' | 'major' | 'minor' | 'info'

export type CheckStatus = 'pass' | 'fail' | 'skip' | 'error' | 'pending'

export type ScanId = `SCN-${string}`

export interface CheckResult {
  checkId: string
  category: string
  severity: Severity
  status: CheckStatus
  durationMs: number
  observed?: string
  expected?: string
  specRef?: string
  fixHint?: string
}

export interface Scan {
  id: ScanId
  startedAt: string
  endpoint: string
  transport: Transport
  spec: 'draft-2026-v1'
  durationMs: number
  grade: Grade
  summary: { pass: number; fail: number; skip: number; error: number }
  results: CheckResult[]
}

export interface ServerMeta {
  name: string
  version: string
  description: string
  license: string
}

export interface ToolDef {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  outputSchema?: Record<string, unknown>
}

export interface PromptDef {
  name: string
  description: string
  arguments: { name: string; description?: string; required?: boolean }[]
}

export interface ResourceDef {
  uri: string
  mimeType: string
  description: string
}

export interface CapabilityInfo {
  exposes: string[]
}

export type NodeData = ToolDef | PromptDef | ResourceDef | ServerMeta | CapabilityInfo

export interface BuildNode {
  id: string
  type: 'server' | 'tool' | 'prompt' | 'resource' | 'capability'
  position: { x: number; y: number }
  data: NodeData
}

export interface BuildEdge {
  id: string
  source: string
  target: string
  kind: 'membership' | 'dependency' | 'prompt-uses-tool'
}

export interface Build {
  id: string
  name: string
  language: 'typescript' | 'python'
  packageMeta: ServerMeta
  nodes: BuildNode[]
  edges: BuildEdge[]
  viewport: { x: number; y: number; zoom: number }
  modifiedAt: string
}
```

- [ ] **Step 2: Write `lib/store/persist.ts`**

```ts
import { persist as zPersist, createJSONStorage } from 'zustand/middleware'
import type { StateCreator } from 'zustand'

export function persisted<T>(
  name: string,
  initializer: StateCreator<T, [], [], T>,
) {
  return zPersist<T>(initializer, {
    name: `argus.${name}`,
    storage: createJSONStorage(() => localStorage),
    version: 1,
  })
}
```

- [ ] **Step 3: Write failing test for persist**

Path: `argus/tests/unit/store.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { persisted } from '@/lib/store/persist'

describe('persisted middleware', () => {
  beforeEach(() => { localStorage.clear() })

  it('writes state to localStorage under the namespaced key', () => {
    const useStore = create<{ n: number; bump: () => void }>(
      persisted('counter', (set) => ({
        n: 0,
        bump: () => set((s) => ({ n: s.n + 1 })),
      })),
    )

    useStore.getState().bump()
    expect(useStore.getState().n).toBe(1)

    const raw = localStorage.getItem('argus.counter')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.n).toBe(1)
  })
})
```

- [ ] **Step 4: Run test, confirm passes**

Run: `cd argus && pnpm test store`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add argus/lib/store/types.ts argus/lib/store/persist.ts argus/tests/unit/store.test.ts
git commit -m "feat(argus): add shared store types and persist middleware"
```

---

## Task 18: Store — scans

**Files:**
- Create: `argus/lib/store/scans.ts`
- Modify: `argus/tests/unit/store.test.ts`

- [ ] **Step 1: Append failing test**

Add to `argus/tests/unit/store.test.ts`:

```ts
import { useScansStore } from '@/lib/store/scans'
import type { Scan } from '@/lib/store/types'

const fixtureScan: Scan = {
  id: 'SCN-0001',
  startedAt: '2026-05-26T14:08:00Z',
  endpoint: 'localhost:3845/mcp',
  transport: 'http',
  spec: 'draft-2026-v1',
  durationMs: 28400,
  grade: 'B+',
  summary: { pass: 229, fail: 14, skip: 0, error: 0 },
  results: [],
}

describe('scans store', () => {
  beforeEach(() => {
    localStorage.clear()
    useScansStore.setState({ scans: {} })
  })

  it('adds a scan keyed by id', () => {
    useScansStore.getState().addScan(fixtureScan)
    expect(useScansStore.getState().scans['SCN-0001']).toEqual(fixtureScan)
  })

  it('lists scans newest first', () => {
    const older = { ...fixtureScan, id: 'SCN-0000' as const, startedAt: '2026-05-25T14:08:00Z' }
    useScansStore.getState().addScan(older)
    useScansStore.getState().addScan(fixtureScan)
    const list = useScansStore.getState().list()
    expect(list[0].id).toBe('SCN-0001')
    expect(list[1].id).toBe('SCN-0000')
  })

  it('removes a scan', () => {
    useScansStore.getState().addScan(fixtureScan)
    useScansStore.getState().removeScan('SCN-0001')
    expect(useScansStore.getState().scans['SCN-0001']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test store`
Expected: failure — module not found.

- [ ] **Step 3: Implement `lib/store/scans.ts`**

```ts
import { create } from 'zustand'
import { persisted } from './persist'
import type { Scan, ScanId } from './types'

interface ScansState {
  scans: Record<ScanId, Scan>
  addScan: (scan: Scan) => void
  removeScan: (id: ScanId) => void
  list: () => Scan[]
}

export const useScansStore = create<ScansState>()(
  persisted('scans', (set, get) => ({
    scans: {},
    addScan: (scan) =>
      set((s) => ({ scans: { ...s.scans, [scan.id]: scan } })),
    removeScan: (id) =>
      set((s) => {
        const next = { ...s.scans }
        delete next[id]
        return { scans: next }
      }),
    list: () =>
      Object.values(get().scans).sort(
        (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
      ),
  })),
)
```

- [ ] **Step 4: Run test, confirm passes**

Run: `cd argus && pnpm test store`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add argus/lib/store/scans.ts argus/tests/unit/store.test.ts
git commit -m "feat(argus): add scans store with localStorage persistence"
```

---

## Task 19: Store — builds

**Files:**
- Create: `argus/lib/store/builds.ts`
- Modify: `argus/tests/unit/store.test.ts`

- [ ] **Step 1: Append failing test**

Add to `argus/tests/unit/store.test.ts`:

```ts
import { useBuildsStore } from '@/lib/store/builds'
import type { Build } from '@/lib/store/types'

const fixtureBuild: Build = {
  id: 'github-readonly',
  name: 'github-readonly',
  language: 'typescript',
  packageMeta: { name: 'github-readonly', version: '0.1.0', description: '', license: 'MIT' },
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  modifiedAt: '2026-05-26T14:00:00Z',
}

describe('builds store', () => {
  beforeEach(() => {
    localStorage.clear()
    useBuildsStore.setState({ builds: {} })
  })

  it('upserts a build keyed by id', () => {
    useBuildsStore.getState().upsertBuild(fixtureBuild)
    expect(useBuildsStore.getState().builds['github-readonly']).toEqual(fixtureBuild)
  })

  it('lists builds by modifiedAt desc', () => {
    const older = { ...fixtureBuild, id: 'older', name: 'older', modifiedAt: '2026-05-20T00:00:00Z' }
    useBuildsStore.getState().upsertBuild(older)
    useBuildsStore.getState().upsertBuild(fixtureBuild)
    const list = useBuildsStore.getState().list()
    expect(list[0].id).toBe('github-readonly')
    expect(list[1].id).toBe('older')
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test store`
Expected: failure — module not found.

- [ ] **Step 3: Implement `lib/store/builds.ts`**

```ts
import { create } from 'zustand'
import { persisted } from './persist'
import type { Build } from './types'

interface BuildsState {
  builds: Record<string, Build>
  upsertBuild: (build: Build) => void
  removeBuild: (id: string) => void
  list: () => Build[]
}

export const useBuildsStore = create<BuildsState>()(
  persisted('builds', (set, get) => ({
    builds: {},
    upsertBuild: (build) =>
      set((s) => ({ builds: { ...s.builds, [build.id]: build } })),
    removeBuild: (id) =>
      set((s) => {
        const next = { ...s.builds }
        delete next[id]
        return { builds: next }
      }),
    list: () =>
      Object.values(get().builds).sort(
        (a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt),
      ),
  })),
)
```

- [ ] **Step 4: Run test, confirm passes**

Run: `cd argus && pnpm test store`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add argus/lib/store/builds.ts argus/tests/unit/store.test.ts
git commit -m "feat(argus): add builds store with localStorage persistence"
```

---

## Task 20: Store — prefs

**Files:**
- Create: `argus/lib/store/prefs.ts`
- Modify: `argus/tests/unit/store.test.ts`

- [ ] **Step 1: Append failing test**

Add to `argus/tests/unit/store.test.ts`:

```ts
import { usePrefsStore } from '@/lib/store/prefs'

describe('prefs store', () => {
  beforeEach(() => {
    localStorage.clear()
    usePrefsStore.setState({
      lastTab: 'home',
      openTabIds: ['home'],
      recentEndpoints: [],
    })
  })

  it('tracks recent endpoints with newest first, no duplicates', () => {
    const s = usePrefsStore.getState()
    s.addEndpoint('a')
    s.addEndpoint('b')
    s.addEndpoint('a')
    expect(usePrefsStore.getState().recentEndpoints).toEqual(['a', 'b'])
  })

  it('caps recent endpoints at 8 entries', () => {
    const s = usePrefsStore.getState()
    for (let i = 0; i < 10; i++) s.addEndpoint(`e${i}`)
    expect(usePrefsStore.getState().recentEndpoints.length).toBe(8)
    expect(usePrefsStore.getState().recentEndpoints[0]).toBe('e9')
  })
})
```

- [ ] **Step 2: Run test, confirm fails**

Run: `cd argus && pnpm test store`
Expected: failure — module not found.

- [ ] **Step 3: Implement `lib/store/prefs.ts`**

```ts
import { create } from 'zustand'
import { persisted } from './persist'

interface PrefsState {
  lastTab: string
  openTabIds: string[]
  recentEndpoints: string[]
  setLastTab: (id: string) => void
  setOpenTabs: (ids: string[]) => void
  addEndpoint: (endpoint: string) => void
}

const MAX_RECENT = 8

export const usePrefsStore = create<PrefsState>()(
  persisted('prefs', (set) => ({
    lastTab: 'home',
    openTabIds: ['home'],
    recentEndpoints: [],
    setLastTab: (lastTab) => set({ lastTab }),
    setOpenTabs: (openTabIds) => set({ openTabIds }),
    addEndpoint: (endpoint) =>
      set((s) => {
        const filtered = s.recentEndpoints.filter((e) => e !== endpoint)
        return { recentEndpoints: [endpoint, ...filtered].slice(0, MAX_RECENT) }
      }),
  })),
)
```

- [ ] **Step 4: Run test, confirm passes**

Run: `cd argus && pnpm test store`
Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add argus/lib/store/prefs.ts argus/tests/unit/store.test.ts
git commit -m "feat(argus): add prefs store with recent-endpoint history"
```

---

## Task 21: Routing scaffold — home, test, build, learn placeholders

**Files:**
- Modify: `argus/app/page.tsx`
- Create: `argus/app/test/page.tsx`
- Create: `argus/app/test/[scanId]/page.tsx`
- Create: `argus/app/build/page.tsx`
- Create: `argus/app/build/[buildId]/page.tsx`
- Create: `argus/app/learn/[...slug]/page.tsx`

- [ ] **Step 1: Update `app/page.tsx`**

```tsx
import { Panel } from '@/components/primitives/Panel'

export default function HomePage() {
  return (
    <section style={{ padding: 32, display: 'grid', gap: 18 }}>
      <Panel title="recent scans">
        <p style={{ color: 'var(--color-ink2)', fontFamily: 'var(--font-mono)', fontSize: 12, margin: 0 }}>
          No scans yet. Argus is watching.
        </p>
      </Panel>
      <Panel title="recent builds">
        <p style={{ color: 'var(--color-ink2)', fontFamily: 'var(--font-mono)', fontSize: 12, margin: 0 }}>
          No builds yet.
        </p>
      </Panel>
    </section>
  )
}
```

- [ ] **Step 2: Write `app/test/page.tsx`**

```tsx
export default function TestIndexPage() {
  return (
    <section style={{ padding: 32, fontFamily: 'var(--font-mono)', color: 'var(--color-ink2)' }}>
      test · new scan · placeholder
    </section>
  )
}
```

- [ ] **Step 3: Write `app/test/[scanId]/page.tsx`**

```tsx
interface Props { params: Promise<{ scanId: string }> }

export default async function TestScanPage({ params }: Props) {
  const { scanId } = await params
  return (
    <section style={{ padding: 32, fontFamily: 'var(--font-mono)', color: 'var(--color-ink2)' }}>
      test · scan {scanId} · placeholder
    </section>
  )
}

export function generateStaticParams() {
  return [{ scanId: 'placeholder' }]
}
```

- [ ] **Step 4: Write `app/build/page.tsx`**

```tsx
export default function BuildIndexPage() {
  return (
    <section style={{ padding: 32, fontFamily: 'var(--font-mono)', color: 'var(--color-ink2)' }}>
      build · list · placeholder
    </section>
  )
}
```

- [ ] **Step 5: Write `app/build/[buildId]/page.tsx`**

```tsx
interface Props { params: Promise<{ buildId: string }> }

export default async function BuildCanvasPage({ params }: Props) {
  const { buildId } = await params
  return (
    <section style={{ padding: 32, fontFamily: 'var(--font-mono)', color: 'var(--color-ink2)' }}>
      build · canvas {buildId} · placeholder
    </section>
  )
}

export function generateStaticParams() {
  return [{ buildId: 'placeholder' }]
}
```

- [ ] **Step 6: Write `app/learn/[...slug]/page.tsx`**

```tsx
interface Props { params: Promise<{ slug: string[] }> }

export default async function LearnPage({ params }: Props) {
  const { slug } = await params
  return (
    <section style={{ padding: 32, fontFamily: 'var(--font-mono)', color: 'var(--color-ink2)' }}>
      learn · {slug.join('/')} · placeholder
    </section>
  )
}

export function generateStaticParams() {
  return [{ slug: ['index'] }]
}
```

- [ ] **Step 7: Boot dev server and verify**

Run: `cd argus && pnpm dev`
Expected: each route renders its placeholder content under the chrome:
- `/` — two empty Panels
- `/test/` — "test · new scan · placeholder"
- `/test/placeholder/` — "test · scan placeholder · placeholder"
- `/build/` — "build · list · placeholder"
- `/build/placeholder/` — "build · canvas placeholder · placeholder"
- `/learn/index/` — "learn · index · placeholder"

Kill dev server.

- [ ] **Step 8: Commit**

```bash
git add argus/app/page.tsx argus/app/test argus/app/build argus/app/learn
git commit -m "feat(argus): scaffold routes for home, test, build, learn"
```

---

## Task 22: Static export verification

**Files:** (no file changes — verifies build)

- [ ] **Step 1: Run static export**

Run: `cd argus && pnpm build`
Expected: build succeeds, `out/` directory created containing `index.html`, `test/index.html`, `test/placeholder/index.html`, `build/index.html`, `build/placeholder/index.html`, `learn/index/index.html`.

- [ ] **Step 2: Smoke-test the export by serving it**

Run: `cd argus && pnpm exec serve out -p 3001`
(If `serve` not installed, use `pnpm dlx serve out -p 3001`.)
Expected: `http://localhost:3001` renders the shell exactly like dev mode.

Kill server.

- [ ] **Step 3: Commit** (only if any incidental changes occurred)

```bash
git status
# if nothing to commit, skip this step
```

---

## Task 23: E2E smoke test

**Files:**
- Create: `argus/tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('home renders chrome + empty panels', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('argus')).toBeVisible()
  await expect(page.getByText('connected')).toBeVisible()
  await expect(page.getByText('recent scans')).toBeVisible()
  await expect(page.getByText('recent builds')).toBeVisible()
  await expect(page.getByText('⌘K search')).toBeVisible()
})

test('routes reachable: test, build, learn', async ({ page }) => {
  await page.goto('/test/')
  await expect(page.getByText('test · new scan · placeholder')).toBeVisible()

  await page.goto('/build/')
  await expect(page.getByText('build · list · placeholder')).toBeVisible()

  await page.goto('/learn/index/')
  await expect(page.getByText('learn · index · placeholder')).toBeVisible()
})
```

- [ ] **Step 2: Install Playwright browsers**

Run: `cd argus && pnpm exec playwright install chromium`
Expected: Chromium downloaded.

- [ ] **Step 3: Run E2E**

Run: `cd argus && pnpm test:e2e`
Expected: 2 tests passing.

- [ ] **Step 4: Commit**

```bash
git add argus/tests/e2e/smoke.spec.ts
git commit -m "test(argus): add E2E smoke test for chrome and routes"
```

---

## Task 24: README

**Files:**
- Create: `argus/README.md`

- [ ] **Step 1: Write `argus/README.md`**

```markdown
# Argus

MCP conformance, build, and learn platform. Browser-only. No backend. State in `localStorage`.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # unit + integration (Vitest)
pnpm test:e2e     # end-to-end (Playwright)
pnpm typecheck
pnpm build        # static export to ./out
```

## Layout

- `app/`        — Next.js App Router routes
- `components/` — UI components (chrome, lattice, primitives)
- `lib/`        — design tokens, stores, conformance engine, generators
- `tests/`      — unit + e2e tests

## Status

Phase 1 — shell scaffolding (this directory).
```

- [ ] **Step 2: Commit**

```bash
git add argus/README.md
git commit -m "docs(argus): add README with dev workflow"
```

---

## Self-Review Checklist

Run through this after the last task:

- All 23 task commits applied
- `pnpm typecheck` → 0 errors
- `pnpm test` → all unit tests passing (24 tests across 5 files)
- `pnpm test:e2e` → 2 E2E tests passing
- `pnpm build` → static export succeeds, `out/` contains 6 routes
- Dev shell renders title bar (Mark + word + version + live dot + connected), tab strip (home/test/build/learn), placeholder content per route, footer (scope + ⌘K hint)
- All commits authored in argus/ with `feat(argus):` / `test(argus):` / `chore(argus):` / `docs(argus):` prefixes

## Spec Coverage Check

| Spec section                  | Phase 1 deliverable                                                  |
|-------------------------------|----------------------------------------------------------------------|
| §3 Visual direction           | tokens, fonts, motion keyframes, globals                             |
| §3 Chrome                     | TitleBar, TabStrip, Footer                                           |
| §3 Persistent motif           | Mark, MiniStrip                                                      |
| §4 Stack                      | Next.js 15, TS, Zustand, Vitest, Playwright                          |
| §4 Top-level structure        | Project tree exactly as specified                                    |
| §4 State model                | scansStore, buildsStore, prefsStore                                  |
| §4 Data shapes                | All TS interfaces declared in `lib/store/types.ts`                   |
| §8 Screens (routes only)      | All 6 route placeholders scaffolded                                  |
| §10 Phase 1 scope             | Fully covered                                                        |

Out of Phase 1 scope (handled by Phases 2–6):
- §5 conformance engine, §6 build tool generators, §7 learn content, §9 motion implementations, §10 bridge

---

End plan.
