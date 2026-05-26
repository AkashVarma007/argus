import { describe, it, expect } from 'vitest'
import { tokens } from '@/lib/tokens'

describe('design tokens', () => {
  it('exposes the Lattice surface palette', () => {
    expect(tokens.color.paper).toBe('#070d15')
    expect(tokens.color.surface1).toBe('#0d141e')
    expect(tokens.color.surface2).toBe('#141d28')
    expect(tokens.color.hairline).toBe('#1f2531')
  })

  it('exposes ink ramp ink0..ink4', () => {
    expect(tokens.color.ink0).toBe('#e8eef7')
    expect(tokens.color.ink4).toBe('#3a414c')
  })

  it('exposes phosphor green signal and dim variant', () => {
    expect(tokens.color.signal).toBe('#2bf07f')
    expect(tokens.color.signalDim).toBe('#0e3a23')
    expect(tokens.color.glow).toBe('rgba(43, 240, 127, 0.5)')
  })

  it('exposes warn for failures', () => {
    expect(tokens.color.warn).toBe('#ffb4a8')
  })

  it('exposes typography stacks', () => {
    expect(tokens.font.sans).toMatch(/Inter/)
    expect(tokens.font.mono).toMatch(/JetBrains Mono/)
  })

  it('exposes motion durations', () => {
    expect(tokens.motion.pulse).toBe('1.6s')
    expect(tokens.motion.draw).toBe('600ms')
  })

  it('exposes a baseline 8px scale', () => {
    expect(tokens.space[1]).toBe('4px')
    expect(tokens.space[2]).toBe('8px')
    expect(tokens.space[4]).toBe('16px')
    expect(tokens.space[8]).toBe('32px')
  })
})
