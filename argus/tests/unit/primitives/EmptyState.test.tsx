import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EmptyState } from '@/components/primitives/EmptyState'

describe('EmptyState', () => {
  it('renders heading and description', () => {
    render(<EmptyState heading="No scans yet" description="Run your first scan." />)
    expect(screen.getByText('No scans yet')).toBeTruthy()
    expect(screen.getByText('Run your first scan.')).toBeTruthy()
  })

  it('renders CTA link when label + href provided', () => {
    render(
      <EmptyState
        heading="No scans"
        description="-"
        ctaLabel="Start a scan"
        ctaHref="/test"
      />,
    )
    const link = screen.getByRole('link', { name: /start a scan/i })
    expect(link.getAttribute('href')).toBe('/test')
  })

  it('omits CTA when not provided', () => {
    render(<EmptyState heading="x" description="y" />)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
