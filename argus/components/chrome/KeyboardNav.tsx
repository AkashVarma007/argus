'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import styles from './KeyboardNav.module.css'

const PREFIX_TIMEOUT_MS = 1500

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

function isModalOpen(): boolean {
  if (typeof document === 'undefined') return false
  return document.querySelector('[role="dialog"]') !== null
}

const NAV_MAP: Record<string, string> = {
  h: '/',
  t: '/test',
  b: '/build',
  l: '/learn',
}

export function KeyboardNav() {
  const router = useRouter()
  const [prefix, setPrefix] = useState<'g' | null>(null)
  const prefixRef = useRef<'g' | null>(null)

  useEffect(() => {
    prefixRef.current = prefix
    if (prefix !== 'g') return
    const id = window.setTimeout(() => {
      prefixRef.current = null
      setPrefix(null)
    }, PREFIX_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [prefix])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (isModalOpen()) return
      const key = e.key.toLowerCase()
      if (prefixRef.current === 'g') {
        if (key in NAV_MAP) {
          e.preventDefault()
          prefixRef.current = null
          setPrefix(null)
          router.push(NAV_MAP[key] as Route)
        } else {
          prefixRef.current = null
          setPrefix(null)
        }
        return
      }
      if (key === 'g') {
        prefixRef.current = 'g'
        setPrefix('g')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  if (prefix !== 'g') return null
  return (
    <div className={styles.chip} role="status" aria-live="polite" data-argus="key-prefix">
      g…
    </div>
  )
}
