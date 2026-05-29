// argus/tests/unit/test/ScanComposer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ScanComposer } from '@/components/test/ScanComposer'

describe('ScanComposer', () => {
  it('renders endpoint + transport + spec controls', () => {
    render(<ScanComposer onStart={() => {}} />)
    expect(screen.getByLabelText(/endpoint/i)).toBeTruthy()
    expect(screen.getByLabelText(/transport/i)).toBeTruthy()
    expect(screen.getByLabelText(/spec/i)).toBeTruthy()
  })

  it('start button passes config to onStart', () => {
    const onStart = vi.fn()
    render(<ScanComposer onStart={onStart} />)
    fireEvent.change(screen.getByLabelText(/endpoint/i), { target: { value: 'http://127.0.0.1:3845/mcp' } })
    fireEvent.click(screen.getByRole('button', { name: /run scan/i }))
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'http://127.0.0.1:3845/mcp',
      transport: 'http',
      spec: 'DRAFT-2026-v1',
    }))
  })

  it('reveals bridge URL field when transport=stdio-ws', () => {
    render(<ScanComposer onStart={() => {}} />)
    fireEvent.change(screen.getByLabelText(/transport/i), { target: { value: 'stdio-ws' } })
    expect(screen.getByLabelText(/bridge url/i)).toBeTruthy()
    expect(screen.getByLabelText(/exec command/i)).toBeTruthy()
  })
})
