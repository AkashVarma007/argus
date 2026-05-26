import type { CSSProperties } from 'react'

interface LiveDotProps {
  size?: number
  color?: string
  duration?: string
  style?: CSSProperties
}

export function LiveDot({
  size = 6,
  color = 'var(--color-signal)',
  duration = 'var(--motion-pulse)',
  style,
}: LiveDotProps) {
  return (
    <span
      data-argus="live-dot"
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${size}px`,
        background: color,
        boxShadow: `0 0 ${size * 1.5}px ${color}`,
        animationName: 'argus-pulse',
        animationDuration: duration,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        ...style,
      }}
    />
  )
}
