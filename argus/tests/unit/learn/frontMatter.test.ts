import { describe, it, expect } from 'vitest'
import { stripFrontMatter } from '../../../scripts/sync-spec/frontMatter'

describe('stripFrontMatter', () => {
  it('extracts title from front-matter when present', () => {
    const raw = `---\ntitle: Foo\n---\nBody here.\n`
    const out = stripFrontMatter(raw)
    expect(out.title).toBe('Foo')
    expect(out.body.trim()).toBe('Body here.')
  })

  it('falls back to first h1 when title missing', () => {
    const raw = `---\nmode: wide\n---\n# Lifecycle\n\nText.`
    const out = stripFrontMatter(raw)
    expect(out.title).toBe('Lifecycle')
  })

  it('falls back to Untitled when no title nor heading', () => {
    const raw = `Just body text without heading.`
    const out = stripFrontMatter(raw)
    expect(out.title).toBe('Untitled')
  })

  it('skips headings inside fenced code blocks', () => {
    const raw = '```\n# Not a heading\n```\n# Real Heading\n'
    const out = stripFrontMatter(raw)
    expect(out.title).toBe('Real Heading')
  })

  it('strips Mintlify keys but leaves body untouched', () => {
    const raw = `---\ntitle: Auth\nmode: wide\nicon: lock\n---\nLine one.\nLine two.\n`
    const out = stripFrontMatter(raw)
    expect(out.title).toBe('Auth')
    expect(out.body).toContain('Line one.')
    expect(out.body).toContain('Line two.')
  })
})
