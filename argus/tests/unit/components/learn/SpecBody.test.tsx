import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { SpecBody } from '@/components/learn/SpecBody'

const sample = `# Title

Intro paragraph.

## Section A

Some text with \`code\`.

\`\`\`ts
const x = 1
\`\`\`

## Section B

Another paragraph.

### Nested

deeper.
`

describe('SpecBody', () => {
  it('renders headings and paragraphs', () => {
    const { container } = render(<SpecBody markdown={sample} />)
    expect(container.querySelector('h1')?.textContent).toBe('Title')
    const h2s = Array.from(container.querySelectorAll('h2')).map((el) => el.textContent)
    expect(h2s).toEqual(['Section A', 'Section B'])
    expect(container.querySelector('h3')?.textContent).toBe('Nested')
  })

  it('assigns id attributes via rehype-slug', () => {
    const { container } = render(<SpecBody markdown={sample} />)
    expect(container.querySelector('h2#section-a')).not.toBeNull()
    expect(container.querySelector('h2#section-b')).not.toBeNull()
    expect(container.querySelector('h3#nested')).not.toBeNull()
  })

  it('renders code blocks', () => {
    const { container } = render(<SpecBody markdown={sample} />)
    expect(container.querySelector('pre code')).not.toBeNull()
  })

  it('fires onAnchorMount with extracted anchors', async () => {
    const onAnchorMount = vi.fn()
    render(<SpecBody markdown={sample} onAnchorMount={onAnchorMount} />)
    await waitFor(() => expect(onAnchorMount).toHaveBeenCalled())
    const anchors = onAnchorMount.mock.calls[onAnchorMount.mock.calls.length - 1][0]
    expect(anchors.find((a: { id: string }) => a.id === 'section-a')).toBeTruthy()
    expect(anchors.find((a: { id: string }) => a.id === 'nested')?.level).toBe(3)
  })
})
