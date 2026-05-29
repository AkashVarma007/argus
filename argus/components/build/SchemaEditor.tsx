'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  compileValidator,
  lintSchema,
  parseSchema,
  validateSample,
} from '@/lib/build/schema'
import styles from './SchemaEditor.module.css'

interface SchemaEditorProps {
  label?: string
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

function stringify(v: Record<string, unknown>): string {
  return JSON.stringify(v, null, 2)
}

export function SchemaEditor({ label = 'Schema', value, onChange }: SchemaEditorProps) {
  const initial = useMemo(() => stringify(value), [value])
  const [text, setText] = useState(initial)
  const [parseError, setParseError] = useState<string | null>(null)
  const [sample, setSample] = useState('')
  const [sampleResult, setSampleResult] = useState<string | null>(null)

  useEffect(() => {
    setText(stringify(value))
  }, [value])

  const lintIssues = useMemo(() => {
    const parsed = parseSchema(text)
    if (!parsed.ok) return []
    return lintSchema(parsed.value)
  }, [text])

  function commit(next: string) {
    setText(next)
    const parsed = parseSchema(next)
    if (!parsed.ok) {
      setParseError(parsed.error)
      return
    }
    setParseError(null)
    onChange(parsed.value)
  }

  function runSample() {
    const parsed = parseSchema(text)
    if (!parsed.ok) {
      setSampleResult(`schema parse error: ${parsed.error}`)
      return
    }
    let sampleValue: unknown
    try {
      sampleValue = JSON.parse(sample)
    } catch (err) {
      setSampleResult(`sample parse error: ${err instanceof Error ? err.message : String(err)}`)
      return
    }
    try {
      const validate = compileValidator(parsed.value)
      const r = validateSample(validate, sampleValue)
      if (r.ok) setSampleResult('sample OK')
      else setSampleResult(r.errors.join('\n'))
    } catch (err) {
      setSampleResult(`compile error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div data-argus="schema-editor" className={styles.root}>
      <div className={styles.label}>{label}</div>
      <textarea
        className={styles.editor}
        value={text}
        spellCheck={false}
        onChange={(e) => commit(e.target.value)}
      />
      {parseError && <div className={styles.error}>{parseError}</div>}
      {lintIssues.length > 0 && (
        <ul className={styles.issues}>
          {lintIssues.map((issue, i) => (
            <li key={i}>
              <span className={styles.path}>{issue.path}</span> {issue.message}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.sampleHead}>Sample input</div>
      <textarea
        className={styles.sample}
        placeholder='{"field": "value"}'
        spellCheck={false}
        value={sample}
        onChange={(e) => setSample(e.target.value)}
      />
      <button type="button" className={styles.runBtn} onClick={runSample}>
        Validate sample
      </button>
      {sampleResult && <pre className={styles.sampleResult}>{sampleResult}</pre>}
    </div>
  )
}
