'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Build } from '@/lib/store/types'
import { validateBuild } from '@/lib/build/validate'
import { runCodegen } from '@/lib/codegen/runner'
import { packZip } from '@/lib/codegen/zip'
import { downloadBlob } from '@/lib/codegen/download'
import styles from './GenerateModal.module.css'

interface GenerateModalProps {
  build: Build
  open: boolean
  onClose(): void
  onLanguageChange(lang: Build['language']): void
}

export function GenerateModal({ build, open, onClose, onLanguageChange }: GenerateModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const issues = useMemo(() => validateBuild(build), [build])
  const errors = issues.filter((i) => i.severity === 'error')
  const warnings = issues.filter((i) => i.severity === 'warning')
  const hasError = errors.length > 0

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleGenerate() {
    setBusy(true)
    setError(null)
    try {
      const result = runCodegen(build)
      if (!result.ok) {
        setError('Build has validation errors. Fix them first.')
        return
      }
      const blob = await packZip(result.project)
      downloadBlob(blob, `${result.project.name}.zip`)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during generation.')
    } finally {
      setBusy(false)
    }
  }

  const state = hasError ? 'error' : warnings.length > 0 ? 'warning' : 'clean'
  const summaryText =
    state === 'clean'
      ? 'No issues — ready to generate.'
      : `${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`

  return (
    <div
      className={styles.backdrop}
      data-argus="generate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Generate server"
        className={styles.modal}
      >
        <div className={styles.head}>
          <span>Generate server</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
            <span className={styles.label}>Language</span>
            <select
              className={styles.select}
              value={build.language}
              onChange={(e) => onLanguageChange(e.target.value as Build['language'])}
            >
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div className={styles.summary} data-state={state}>
            <div>{summaryText}</div>
            {issues.slice(0, 5).map((iss, idx) => (
              <div key={idx} className={styles.issue} data-sev={iss.severity}>
                <span>[{iss.severity}]</span>
                <span>{iss.message}</span>
              </div>
            ))}
            {issues.length > 5 && <div>… {issues.length - 5} more</div>}
          </div>
          {error && <div className={styles.error}>{error}</div>}
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.button}
            disabled={hasError || busy}
            onClick={handleGenerate}
          >
            {busy ? 'Generating…' : 'Generate & download'}
          </button>
        </div>
      </div>
    </div>
  )
}
