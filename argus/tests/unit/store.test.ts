import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { persisted } from '@/lib/store/persist'
import { useScansStore } from '@/lib/store/scans'
import { useBuildsStore } from '@/lib/store/builds'
import { usePrefsStore } from '@/lib/store/prefs'
import type { Scan, Build } from '@/lib/store/types'

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

describe('persisted middleware', () => {
  beforeEach(() => { localStorage.clear() })

  it('writes state to localStorage under the namespaced key', () => {
    const useStore = create<{ n: number; bump: () => void }>()(
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

const fixtureBuild: Build = {
  id: 'BLD-github-readonly',
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
    expect(useBuildsStore.getState().builds['BLD-github-readonly']).toEqual(fixtureBuild)
  })

  it('lists builds by modifiedAt desc', () => {
    const older: Build = { ...fixtureBuild, id: 'BLD-older', name: 'older', modifiedAt: '2026-05-20T00:00:00Z' }
    useBuildsStore.getState().upsertBuild(older)
    useBuildsStore.getState().upsertBuild(fixtureBuild)
    const list = useBuildsStore.getState().list()
    expect(list[0].id).toBe('BLD-github-readonly')
    expect(list[1].id).toBe('BLD-older')
  })
})

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
