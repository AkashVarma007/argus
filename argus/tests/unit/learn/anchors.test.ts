import { describe, it, expect } from 'vitest'
import { extractAnchors } from '../../../scripts/sync-spec/anchors'

describe('extractAnchors', () => {
  it('extracts h1/h2/h3 with slug ids', () => {
    const md = `# Top\n## Sub One\n### Deep One\nbody\n`
    const out = extractAnchors(md)
    expect(out).toEqual([
      { id: 'top', text: 'Top', level: 1 },
      { id: 'sub-one', text: 'Sub One', level: 2 },
      { id: 'deep-one', text: 'Deep One', level: 3 },
    ])
  })

  it('skips headings inside fenced code blocks', () => {
    const md = '```\n# Not Heading\n```\n## Real\n'
    const out = extractAnchors(md)
    expect(out).toEqual([{ id: 'real', text: 'Real', level: 2 }])
  })

  it('deduplicates ids with numeric suffixes', () => {
    const md = `## Notes\n## Notes\n## Notes\n`
    const out = extractAnchors(md)
    expect(out.map((a) => a.id)).toEqual(['notes', 'notes-2', 'notes-3'])
  })

  it('ignores h4+', () => {
    const md = `#### Too Deep\n## Just Right\n`
    const out = extractAnchors(md)
    expect(out).toEqual([{ id: 'just-right', text: 'Just Right', level: 2 }])
  })
})
