import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GenerateModal } from '@/components/build/GenerateModal'
import { createBuild, addNode } from '@/lib/build/factory'
import type { Build, ToolDef } from '@/lib/store/types'

vi.mock('@/lib/codegen/zip', () => ({
  packZip: vi.fn(async () => new Blob(['zip-bytes'], { type: 'application/zip' })),
}))
vi.mock('@/lib/codegen/download', () => ({
  downloadBlob: vi.fn(),
}))

import { packZip } from '@/lib/codegen/zip'
import { downloadBlob } from '@/lib/codegen/download'

function validBuild(): Build {
  return addNode(createBuild('demo-server'), 'tool', {
    name: 'echo',
    description: 'echoes',
    inputSchema: { type: 'object', properties: {} },
  } as ToolDef)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GenerateModal', () => {
  it('does not render when open is false', () => {
    const { container } = render(
      <GenerateModal
        build={validBuild()}
        open={false}
        onClose={() => {}}
        onLanguageChange={() => {}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders clean summary when build has no errors', () => {
    render(
      <GenerateModal
        build={validBuild()}
        open
        onClose={() => {}}
        onLanguageChange={() => {}}
      />,
    )
    expect(screen.getByText(/no issues/i)).toBeTruthy()
    const btn = screen.getByRole('button', { name: /generate & download/i })
    expect((btn as HTMLButtonElement).disabled).toBe(false)
  })

  it('disables Generate when build has errors', () => {
    const broken: Build = { ...createBuild('x'), nodes: [], edges: [] }
    render(
      <GenerateModal build={broken} open onClose={() => {}} onLanguageChange={() => {}} />,
    )
    const btn = screen.getByRole('button', { name: /generate & download/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <GenerateModal
        build={validBuild()}
        open
        onClose={onClose}
        onLanguageChange={() => {}}
      />,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onLanguageChange when language select changes', () => {
    const onLang = vi.fn()
    render(
      <GenerateModal
        build={validBuild()}
        open
        onClose={() => {}}
        onLanguageChange={onLang}
      />,
    )
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'python' } })
    expect(onLang).toHaveBeenCalledWith('python')
  })

  it('generates, packs zip, downloads, then closes', async () => {
    const onClose = vi.fn()
    render(
      <GenerateModal
        build={validBuild()}
        open
        onClose={onClose}
        onLanguageChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /generate & download/i }))
    await waitFor(() => expect(packZip).toHaveBeenCalled())
    expect(downloadBlob).toHaveBeenCalled()
    const args = (downloadBlob as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(args[1]).toBe('demo-server.zip')
    expect(onClose).toHaveBeenCalled()
  })
})
