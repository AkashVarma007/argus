import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import AUTH01 from '@/lib/conformance/checks/authorization/AUTH-01.unauthenticated-401/check'
import AUTH02 from '@/lib/conformance/checks/authorization/AUTH-02.www-authenticate-resource/check'
import AUTH03 from '@/lib/conformance/checks/authorization/AUTH-03.protected-resource-metadata/check'
import AUTH10 from '@/lib/conformance/checks/authorization/AUTH-10.no-url-token/check'

async function start(
  violations: string[],
  opts: { authMode?: 'oauth-discovery' } = {},
): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({
    violations: new Set(violations) as unknown as Set<ViolationId>,
    authMode: opts.authMode,
  })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    close: () => new Promise<void>((r) => server.close(() => r())),
  }
}

function makeCtx(url: string, opts: { authMode?: 'oauth-discovery' } = {}): CheckContext {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, '2025-11-25', url)
  return {
    client,
    rawHttp,
    transport,
    spec: '2025-11-25',
    serverInfo: {} as never,
    capabilities: {} as never,
    log: () => undefined,
    authMode: opts.authMode,
  }
}

describe('authorization checks', () => {
  // ─── AUTH-01: unauthenticated-401 ────────────────────────────────────────────

  it('AUTH-01 passes when server returns 401 + Bearer challenge', async () => {
    const s = await start([], { authMode: 'oauth-discovery' })
    try {
      const r = await AUTH01.run(makeCtx(s.url, { authMode: 'oauth-discovery' }))
      expect(r.status).toBe('pass')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: unknown })?.actual).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('AUTH-01 skips when authMode is not oauth-discovery', async () => {
    const s = await start([])
    try {
      const r = await AUTH01.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('AUTH-01 fails when server fails to challenge (AUTH-01 violation)', async () => {
    const s = await start(['AUTH-01'], { authMode: 'oauth-discovery' })
    try {
      const r = await AUTH01.run(makeCtx(s.url, { authMode: 'oauth-discovery' }))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })

  // ─── AUTH-02: www-authenticate-resource ──────────────────────────────────────

  it('AUTH-02 passes when WWW-Authenticate includes resource_metadata URL', async () => {
    const s = await start([], { authMode: 'oauth-discovery' })
    try {
      const r = await AUTH02.run(makeCtx(s.url, { authMode: 'oauth-discovery' }))
      expect(r.status).toBe('pass')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: unknown })?.actual).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('AUTH-02 skips when authMode is not oauth-discovery', async () => {
    const s = await start([])
    try {
      const r = await AUTH02.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('AUTH-02 fails when WWW-Authenticate lacks resource_metadata (AUTH-02 violation)', async () => {
    const s = await start(['AUTH-02'], { authMode: 'oauth-discovery' })
    try {
      const r = await AUTH02.run(makeCtx(s.url, { authMode: 'oauth-discovery' }))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })

  // ─── AUTH-03: protected-resource-metadata ────────────────────────────────────

  it('AUTH-03 passes when metadata doc has resource, authorization_servers, scopes_supported', async () => {
    const s = await start([], { authMode: 'oauth-discovery' })
    try {
      const r = await AUTH03.run(makeCtx(s.url, { authMode: 'oauth-discovery' }))
      expect(r.status).toBe('pass')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('AUTH-03 skips when authMode is not oauth-discovery', async () => {
    const s = await start([])
    try {
      const r = await AUTH03.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('AUTH-03 fails when metadata doc is missing authorization_servers (AUTH-03 violation)', async () => {
    const s = await start(['AUTH-03'], { authMode: 'oauth-discovery' })
    try {
      const r = await AUTH03.run(makeCtx(s.url, { authMode: 'oauth-discovery' }))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })

  // ─── AUTH-10: no-url-token ────────────────────────────────────────────────────

  it('AUTH-10 passes when server rejects URL token with 4xx', async () => {
    const s = await start([], { authMode: 'oauth-discovery' })
    try {
      const r = await AUTH10.run(makeCtx(s.url, { authMode: 'oauth-discovery' }))
      expect(r.status).toBe('pass')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: unknown })?.actual).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('AUTH-10 skips when authMode is not oauth-discovery', async () => {
    const s = await start([])
    try {
      const r = await AUTH10.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('AUTH-10 fails when server accepts URL token (AUTH-10 violation)', async () => {
    const s = await start(['AUTH-10'], { authMode: 'oauth-discovery' })
    try {
      const r = await AUTH10.run(makeCtx(s.url, { authMode: 'oauth-discovery' }))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })
})
