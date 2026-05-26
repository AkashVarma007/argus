type TokenShape = {
  color: Record<string, string>
  font: Record<string, string>
  size: Record<string, string>
  motion: Record<string, string>
  space: Record<number, string>
}

export const tokens = {
  color: {
    paper: '#070d15',
    surface1: '#0d141e',
    surface2: '#141d28',
    hairline: '#1f2531',
    ink0: '#e8eef7',
    ink1: '#c2cad6',
    ink2: '#828b97',
    ink3: '#525a66',
    ink4: '#3a414c',
    signal: '#2bf07f',
    signalDim: '#0e3a23',
    glow: 'rgba(43, 240, 127, 0.5)',
    warn: '#ffb4a8',
  },
  font: {
    sans: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  size: {
    titleBar: '30px',
    tabStrip: '32px',
    footer: '24px',
  },
  motion: {
    pulse: '1.6s',
    breathe: '6s',
    draw: '600ms',
    tick: '180ms',
    pop: '420ms',
  },
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
} as const satisfies TokenShape

export type Tokens = typeof tokens
