import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/conformance/transport/http', () => ({
  createHttpTransport: () => ({
    kind: 'http',
    send: vi.fn(),
    notify: vi.fn(),
    close: vi.fn(),
  }),
}))
vi.mock('@/lib/conformance/transport/bridge', async (orig) => {
  const real = await orig<typeof import('@/lib/conformance/transport/bridge')>()
  return {
    ...real,
    createBridgeTransport: () => ({
      kind: 'bridge',
      send: vi.fn(),
      notify: vi.fn(),
      close: vi.fn(),
    }),
  }
})
vi.mock('@/lib/conformance/transport/raw', () => ({
  createRawHttpClient: () => ({}),
}))
vi.mock('@/lib/conformance/client', () => ({
  createMcpClient: () => ({
    initialize: vi.fn().mockRejectedValue(new Error('transport refused')),
    close: vi.fn(),
  }),
}))

import TestIndexPage from '@/app/test/page'

beforeEach(() => vi.clearAllMocks())
afterEach(() => cleanup())

describe('Test page — scan error', () => {
  it('renders error strip with retry when initialize fails', async () => {
    render(<TestIndexPage />)
    const endpoint = screen.getByLabelText(/endpoint/i)
    fireEvent.change(endpoint, { target: { value: 'http://127.0.0.1:9999/mcp' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /run scan/i }))
    })
    await waitFor(() => expect(screen.getByText(/scan failed/i)).toBeTruthy())
    expect(screen.getByText(/transport refused/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })
})
