// argus/tests/unit/test/RawProtocolLog.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RawProtocolLog, type LogEntry } from '@/components/test/RawProtocolLog'

const entries: LogEntry[] = [
  { ts: 1, direction: 'out', payload: { jsonrpc: '2.0', id: 1, method: 'initialize' } },
  { ts: 2, direction: 'in', payload: { jsonrpc: '2.0', id: 1, result: {} } },
]

describe('RawProtocolLog', () => {
  it('renders summary line per entry', () => {
    render(<RawProtocolLog entries={entries} />)
    expect(screen.getByText(/initialize/)).toBeTruthy()
  })

  it('expands to show full JSON on row click', () => {
    render(<RawProtocolLog entries={entries} />)
    fireEvent.click(screen.getByText(/initialize/))
    expect(screen.getByText(/"jsonrpc": "2.0"/)).toBeTruthy()
  })

  it('windows the last pageSize entries and hides older ones', () => {
    const many: LogEntry[] = Array.from({ length: 500 }, (_, i) => ({
      ts: i,
      direction: i % 2 ? 'in' : 'out',
      payload: { jsonrpc: '2.0', id: i, method: 'ping' },
    }))
    const { container } = render(<RawProtocolLog entries={many} pageSize={200} />)
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(200)
    expect(screen.getByText(/load 200 earlier frames/i)).toBeTruthy()
  })

  it('Load earlier grows visible window by pageSize', () => {
    const many: LogEntry[] = Array.from({ length: 500 }, (_, i) => ({
      ts: i,
      direction: 'in',
      payload: { jsonrpc: '2.0', id: i, method: 'ping' },
    }))
    const { container } = render(<RawProtocolLog entries={many} pageSize={200} />)
    fireEvent.click(screen.getByRole('button', { name: /load.*earlier/i }))
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(400)
  })
})
