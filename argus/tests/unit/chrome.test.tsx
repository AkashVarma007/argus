import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TitleBar } from '@/components/chrome/TitleBar'

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
