'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import styles from './page.module.css'
import { ScanComposer, type ScanConfig } from '@/components/test/ScanComposer'
import { LiveProgress } from '@/components/test/LiveProgress'
import { useScansStore } from '@/lib/store/scans'
import { usePrefsStore } from '@/lib/store/prefs'
import { listChecks } from '@/lib/conformance/registry'
import { runScan } from '@/lib/conformance/runner'
import { toStoreResult } from '@/lib/conformance/adapter'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createBridgeTransport } from '@/lib/conformance/transport/bridge'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckStatus, ScanId } from '@/lib/store/types'

export default function TestIndexPage() {
  const router = useRouter()
  const addScan = useScansStore((s) => s.addScan)
  const addEndpoint = usePrefsStore((s) => s.addEndpoint)
  const [running, setRunning] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastConfig, setLastConfig] = useState<ScanConfig | null>(null)
  const [statuses, setStatuses] = useState<Record<string, CheckStatus | 'running'>>({})
  const checks = listChecks().filter((c) => c.appliesTo.includes('DRAFT-2026-v1'))
  const checkIds = checks.map((c) => c.id)

  const start = useCallback(async (cfg: ScanConfig) => {
    setRunning(true)
    setLastError(null)
    setLastConfig(cfg)
    setStatuses({})
    addEndpoint(cfg.endpoint)

    try {
      const transport =
        cfg.transport === 'stdio-ws'
          ? createBridgeTransport({
              kind: 'bridge',
              url: cfg.bridgeUrl!,
              bridgeCommand: cfg.bridgeCommand!,
              protocolVersion: cfg.spec,
            })
          : createHttpTransport({
              kind: 'http',
              url: cfg.endpoint,
              proxyUrl: cfg.proxyUrl,
              protocolVersion: cfg.spec,
            })

      const rawHttp = createRawHttpClient({ url: cfg.endpoint, proxyUrl: cfg.proxyUrl })
      const client = createMcpClient(transport, cfg.spec, cfg.endpoint)
      const init = await client.initialize()

      const ctx = {
        client,
        rawHttp,
        transport,
        spec: cfg.spec,
        serverInfo: init,
        capabilities: init.capabilities ?? {},
        log: () => {},
        authMode: cfg.authMode,
      } as any

      const startedAt = new Date().toISOString()
      const scanId: ScanId = `SCN-${Date.now()}` as ScanId

      const { results, grade, durationMs } = await runScan(checks, ctx, {
        onProgress: (checkId, status, result) => {
          if (status === 'start') {
            setStatuses((s) => ({ ...s, [checkId]: 'running' }))
          } else if (result) {
            setStatuses((s) => ({ ...s, [checkId]: result.status }))
          }
        },
      })

      const summary = results.reduce(
        (acc, r) => {
          const k = r.status as keyof typeof acc
          if (k in acc) acc[k]++
          return acc
        },
        { pass: 0, fail: 0, skip: 0, error: 0 },
      )

      addScan({
        id: scanId,
        startedAt,
        endpoint: cfg.endpoint,
        transport: cfg.transport,
        spec: 'draft-2026-v1',
        durationMs,
        grade,
        summary,
        results: results.map((r) => {
          const c = checks.find((ch) => ch.id === r.checkId)
          return c ? toStoreResult(r, c) : {
            checkId: r.checkId,
            category: 'transport',
            severity: 'info' as const,
            status: r.status,
            durationMs: r.durationMs,
            observed: '',
            expected: '',
          }
        }),
      })

      await client.close()
      router.push(`/test/scan?id=${encodeURIComponent(scanId)}` as Route)
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err))
      setRunning(false)
    }
  }, [addScan, addEndpoint, checks, router])

  const retryLast = useCallback(() => {
    if (lastConfig) void start(lastConfig)
  }, [lastConfig, start])

  return (
    <section className={styles.root}>
      {!running && lastError && (
        <div className={styles.errorStrip} data-argus="scan-error" role="alert">
          <span className={styles.errorLabel}>Scan failed:</span>
          <span className={styles.errorMsg}>{lastError}</span>
          <button type="button" className={styles.errorRetry} onClick={retryLast}>
            Retry
          </button>
        </div>
      )}
      {!running && <ScanComposer onStart={start} />}
      {running && <LiveProgress checkIds={checkIds} statuses={statuses} />}
    </section>
  )
}
