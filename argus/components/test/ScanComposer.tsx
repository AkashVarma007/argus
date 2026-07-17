// argus/components/test/ScanComposer.tsx
'use client'

import { useState } from 'react'
import styles from './ScanComposer.module.css'
import { usePrefsStore } from '@/lib/store/prefs'
import type { SpecVersion } from '@/lib/conformance/types'
import * as bridgeMod from '@/lib/conformance/transport/bridge'

export type Transport = 'http' | 'sse' | 'stdio-ws'

export interface ScanConfig {
  endpoint: string
  transport: Transport
  spec: SpecVersion
  proxyUrl?: string
  bridgeUrl?: string
  bridgeCommand?: string
  bearerToken?: string
  authMode: 'none' | 'oauth-discovery'
}

interface Props {
  onStart: (cfg: ScanConfig) => void
}

export function ScanComposer({ onStart }: Props) {
  const recent = usePrefsStore((s) => s.recentEndpoints)
  const [endpoint, setEndpoint] = useState(recent[0] ?? '')
  const [transport, setTransport] = useState<Transport>('http')
  const [spec, setSpec] = useState<SpecVersion>('DRAFT-2026-v1')
  const [proxyUrl, setProxyUrl] = useState('')
  const [bridgeUrl, setBridgeUrl] = useState('ws://127.0.0.1:7879/bridge')
  const [bridgeCommand, setBridgeCommand] = useState('')
  const [bearer, setBearer] = useState('')
  const [authMode, setAuthMode] = useState<ScanConfig['authMode']>('none')
  const [probeState, setProbeState] = useState<'idle' | 'checking' | 'ok' | string>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function checkBridge() {
    setProbeState('checking')
    try {
      const res = await bridgeMod.probeBridge(bridgeUrl)
      setProbeState(res)
    } catch (err) {
      setProbeState((err as Error).message || 'probe error')
    }
  }

  function deriveStdioLabel(cmd: string): string {
    const first = cmd.trim().split(/\s+/).find((tok) => !tok.startsWith('-')) ?? ''
    const tail = first.split(/[\\/]/).pop() ?? first
    return tail ? `stdio://${tail}` : 'stdio://server'
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (transport === 'stdio-ws') {
      if (!bridgeUrl) {
        setSubmitError('Bridge URL is required for stdio.')
        return
      }
      if (!bridgeCommand) {
        setSubmitError('Exec command is required for stdio.')
        return
      }
    } else if (!endpoint) {
      setSubmitError('Endpoint URL is required.')
      return
    }
    const effectiveEndpoint =
      endpoint || (transport === 'stdio-ws' ? deriveStdioLabel(bridgeCommand) : '')
    onStart({
      endpoint: effectiveEndpoint, transport, spec,
      proxyUrl: proxyUrl || undefined,
      bridgeUrl: transport === 'stdio-ws' ? bridgeUrl : undefined,
      bridgeCommand: transport === 'stdio-ws' ? bridgeCommand : undefined,
      bearerToken: bearer || undefined,
      authMode,
    })
  }

  return (
    <form className={styles.root} onSubmit={submit} data-argus="scan-composer">
      <label className={styles.field}>
        <span>Endpoint</span>
        <input
          aria-label="endpoint"
          list="recent-endpoints"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="http://127.0.0.1:3845/mcp"
        />
        <datalist id="recent-endpoints">
          {recent.map((u) => <option key={u} value={u} />)}
        </datalist>
      </label>

      <label className={styles.field}>
        <span>Transport</span>
        <select
          aria-label="transport"
          value={transport}
          onChange={(e) => setTransport(e.target.value as Transport)}
        >
          <option value="http">streamable-http</option>
          <option value="sse">sse (legacy)</option>
          <option value="stdio-ws">stdio (via bridge)</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Spec</span>
        <select
          aria-label="spec"
          value={spec}
          onChange={(e) => setSpec(e.target.value as SpecVersion)}
        >
          <option value="DRAFT-2026-v1">DRAFT-2026-v1</option>
          <option value="2025-11-25">2025-11-25</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Proxy URL (optional, for cross-origin)</span>
        <input
          aria-label="proxy url"
          value={proxyUrl}
          onChange={(e) => setProxyUrl(e.target.value)}
          placeholder="http://127.0.0.1:7878/proxy"
        />
      </label>

      {transport === 'stdio-ws' && (
        <>
          <label className={styles.field}>
            <span>Bridge URL</span>
            <input
              aria-label="bridge url"
              value={bridgeUrl}
              onChange={(e) => setBridgeUrl(e.target.value)}
            />
          </label>
          <p className={styles.hint}>
            Install: <code>npm i -g argus-bridge</code> then run <code>argus-bridge</code> (or
            pin a fixed command with <code>argus-bridge --cmd &quot;node server.js&quot;</code>).
          </p>
          <div className={styles.bridgeRow}>
            <button
              type="button"
              className={styles.secondary}
              onClick={checkBridge}
              disabled={probeState === 'checking'}
            >
              Check bridge
            </button>
            {probeState === 'checking' && (
              <span className={styles.probeMuted}>checking…</span>
            )}
            {probeState === 'ok' && (
              <span className={styles.probeOk}>bridge ok</span>
            )}
            {probeState !== 'idle' && probeState !== 'checking' && probeState !== 'ok' && (
              <span className={styles.probeErr}>{probeState}</span>
            )}
          </div>
          <label className={styles.field}>
            <span>Exec command</span>
            <input
              aria-label="exec command"
              value={bridgeCommand}
              onChange={(e) => setBridgeCommand(e.target.value)}
              placeholder="npx -y @modelcontextprotocol/server-everything"
            />
          </label>
        </>
      )}

      <label className={styles.field}>
        <span>Bearer token (optional)</span>
        <input
          aria-label="bearer"
          type="password"
          value={bearer}
          onChange={(e) => setBearer(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Auth mode</span>
        <select
          aria-label="auth mode"
          value={authMode}
          onChange={(e) => setAuthMode(e.target.value as ScanConfig['authMode'])}
        >
          <option value="none">none</option>
          <option value="oauth-discovery">oauth-discovery</option>
        </select>
      </label>

      {submitError && (
        <p className={styles.submitError} role="alert" data-argus="composer-error">
          {submitError}
        </p>
      )}
      <button type="submit" className={styles.run}>Run scan</button>
    </form>
  )
}
