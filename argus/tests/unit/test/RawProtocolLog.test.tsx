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
})
