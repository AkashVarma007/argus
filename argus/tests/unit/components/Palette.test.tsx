import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Palette } from '@/components/build/Palette'

describe('Palette', () => {
  it('renders a button for every node type', () => {
    const { container } = render(<Palette onAdd={() => {}} />)
    const buttons = container.querySelectorAll('button[data-node-type]')
    expect(buttons.length).toBe(5)
  })

  it('emits the chosen type via onAdd', () => {
    const onAdd = vi.fn()
    const { container } = render(<Palette onAdd={onAdd} />)
    const toolBtn = container.querySelector(
      'button[data-node-type="tool"]',
    ) as HTMLButtonElement
    fireEvent.click(toolBtn)
    expect(onAdd).toHaveBeenCalledWith('tool')
  })

  it('disables buttons listed in disabledTypes', () => {
    const { container } = render(<Palette onAdd={() => {}} disabledTypes={['server']} />)
    const serverBtn = container.querySelector(
      'button[data-node-type="server"]',
    ) as HTMLButtonElement
    expect(serverBtn.disabled).toBe(true)
  })
})
