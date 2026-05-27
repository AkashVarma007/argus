import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TitleBar } from '@/components/chrome/TitleBar'
import { TabStrip } from '@/components/chrome/TabStrip'
import { Footer } from '@/components/chrome/Footer'

describe('TitleBar', () => {
  it('shows the argus wordmark', () => {
    const { getByText } = render(<TitleBar version="0.1.0" />)
    expect(getByText('argus')).toBeInTheDocument()
  })

  it('shows the version', () => {
    const { getByText } = render(<TitleBar version="0.1.0" />)
    expect(getByText(/0\.1\.0/)).toBeInTheDocument()
  })

  it('shows the connected indicator', () => {
    const { getByText } = render(<TitleBar version="0.1.0" />)
    expect(getByText('connected')).toBeInTheDocument()
  })
})

describe('TabStrip', () => {
  it('renders one element per tab', () => {
    const tabs = [
      { id: 'home', label: 'home' },
      { id: 'scn-0142', label: 'scn-0142.report' },
    ]
    const { container } = render(<TabStrip tabs={tabs} activeId="home" />)
    expect(container.querySelectorAll('[data-argus="tab"]').length).toBe(2)
  })

  it('marks the active tab', () => {
    const tabs = [{ id: 'home', label: 'home' }, { id: 'b', label: 'b' }]
    const { container } = render(<TabStrip tabs={tabs} activeId="b" />)
    const active = container.querySelector('[data-argus="tab"][data-active="true"]') as HTMLElement
    expect(active).toBeInTheDocument()
    expect(active.textContent).toMatch(/b/)
  })
})

describe('Footer', () => {
  it('shows the ⌘K hint', () => {
    const { getByText } = render(<Footer scope="home" />)
    expect(getByText(/⌘K/)).toBeInTheDocument()
  })

  it('shows the current scope', () => {
    const { getByText } = render(<Footer scope="test/scn-0142" />)
    expect(getByText(/test\/scn-0142/)).toBeInTheDocument()
  })
})
