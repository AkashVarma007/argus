import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

import { KeyboardNav } from '@/components/chrome/KeyboardNav'

beforeEach(() => {
  push.mockClear()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

function pressKey(key: string, target: EventTarget = window) {
  if (target === window) {
    fireEvent.keyDown(window, { key })
  } else {
    fireEvent.keyDown(target as Element, { key })
  }
}

describe('KeyboardNav', () => {
  it('g h navigates to /', () => {
    render(<KeyboardNav />)
    pressKey('g')
    expect(screen.getByText('g…')).toBeTruthy()
    pressKey('h')
    expect(push).toHaveBeenCalledWith('/')
  })

  it('g t / g b / g l routes', () => {
    const cases: Array<[string, string]> = [['t', '/test'], ['b', '/build'], ['l', '/learn']]
    for (const [key, path] of cases) {
      push.mockClear()
      render(<KeyboardNav />)
      pressKey('g')
      pressKey(key)
      expect(push).toHaveBeenCalledWith(path)
      cleanup()
    }
  })

  it('g <unknown> cancels prefix', () => {
    render(<KeyboardNav />)
    pressKey('g')
    pressKey('x')
    expect(push).not.toHaveBeenCalled()
    expect(screen.queryByText('g…')).toBeNull()
  })

  it('g timeout cancels prefix after 1500ms', () => {
    render(<KeyboardNav />)
    pressKey('g')
    act(() => {
      vi.advanceTimersByTime(1600)
    })
    pressKey('h')
    expect(push).not.toHaveBeenCalled()
  })

  it('ignores key events inside <input>', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    render(<KeyboardNav />)
    fireEvent.keyDown(input, { key: 'g' })
    fireEvent.keyDown(input, { key: 'h' })
    expect(push).not.toHaveBeenCalled()
    expect(screen.queryByText('g…')).toBeNull()
    document.body.removeChild(input)
  })

  it('ignores when a [role=dialog] is open', () => {
    const dlg = document.createElement('div')
    dlg.setAttribute('role', 'dialog')
    document.body.appendChild(dlg)
    render(<KeyboardNav />)
    pressKey('g')
    pressKey('h')
    expect(push).not.toHaveBeenCalled()
    document.body.removeChild(dlg)
  })

  it('ignores meta+g (lets Cmd+K work)', () => {
    render(<KeyboardNav />)
    fireEvent.keyDown(window, { key: 'g', metaKey: true })
    expect(screen.queryByText('g…')).toBeNull()
  })
})
