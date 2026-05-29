import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadBlob } from '@/lib/codegen/download'

describe('downloadBlob', () => {
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL
  let createSpy: ReturnType<typeof vi.fn>
  let revokeSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createSpy = vi.fn(() => 'blob:mock-url')
    revokeSpy = vi.fn()
    URL.createObjectURL = createSpy as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeSpy as unknown as typeof URL.revokeObjectURL
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
    clickSpy.mockRestore()
  })

  it('creates an object URL, clicks anchor, then revokes', () => {
    const blob = new Blob(['hello'], { type: 'application/zip' })
    downloadBlob(blob, 'demo-server.zip')
    expect(createSpy).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('sets the download filename on the anchor', () => {
    let captured: HTMLAnchorElement | null = null
    clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
      captured = this
    })
    downloadBlob(new Blob(['x']), 'project.zip')
    expect(captured).not.toBeNull()
    expect(captured!.download).toBe('project.zip')
    expect(captured!.href).toContain('blob:mock-url')
  })

  it('removes the anchor from the document after click', () => {
    downloadBlob(new Blob(['x']), 'a.zip')
    const stray = document.querySelector('a[download="a.zip"]')
    expect(stray).toBeNull()
  })
})
