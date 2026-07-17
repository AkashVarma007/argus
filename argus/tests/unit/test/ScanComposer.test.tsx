// argus/tests/unit/test/ScanComposer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScanComposer } from '@/components/test/ScanComposer'
import * as bridgeMod from '@/lib/conformance/transport/bridge'

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

  it('shows bridge install hint when stdio-ws selected', () => {
    render(<ScanComposer onStart={() => {}} />)
    fireEvent.change(screen.getByLabelText(/transport/i), { target: { value: 'stdio-ws' } })
    expect(screen.getByText(/npm i -g argus-bridge/i)).toBeTruthy()
  })

  it('Check bridge button reports ok when probe resolves ok', async () => {
    const spy = vi.spyOn(bridgeMod, 'probeBridge').mockResolvedValue('ok')
    render(<ScanComposer onStart={() => {}} />)
    fireEvent.change(screen.getByLabelText(/transport/i), { target: { value: 'stdio-ws' } })
    fireEvent.click(screen.getByRole('button', { name: /check bridge/i }))
    await waitFor(() => expect(spy).toHaveBeenCalledWith('ws://127.0.0.1:7879/bridge'))
    await waitFor(() => expect(screen.getByText(/bridge ok/i)).toBeTruthy())
    spy.mockRestore()
  })

  it('Check bridge button reports error string when probe fails', async () => {
    const spy = vi.spyOn(bridgeMod, 'probeBridge').mockResolvedValue('connection refused')
    render(<ScanComposer onStart={() => {}} />)
    fireEvent.change(screen.getByLabelText(/transport/i), { target: { value: 'stdio-ws' } })
    fireEvent.click(screen.getByRole('button', { name: /check bridge/i }))
    await waitFor(() => expect(screen.getByText(/connection refused/i)).toBeTruthy())
    spy.mockRestore()
  })
})

beforeEach(() => {
  vi.restoreAllMocks()
})
