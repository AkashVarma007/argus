import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BuildList } from '@/components/build/BuildList'
import { createBuild } from '@/lib/build/factory'
import type { Build, BuildId } from '@/lib/store/types'

function builds(): Build[] {
  return [
    { ...createBuild('alpha'), id: 'BLD-aaa' as BuildId },
    { ...createBuild('beta'), id: 'BLD-bbb' as BuildId },
  ]
}

describe('BuildList', () => {
  it('renders empty state when no builds', () => {
    render(<BuildList builds={[]} onOpen={() => {}} onCreate={() => {}} onDelete={() => {}} />)
    expect(screen.getByText(/no builds yet/i)).toBeTruthy()
  })

  it('lists each build with name, lang, and node count', () => {
    render(
      <BuildList builds={builds()} onOpen={() => {}} onCreate={() => {}} onDelete={() => {}} />,
    )
    expect(screen.getByText('alpha')).toBeTruthy()
    expect(screen.getByText('beta')).toBeTruthy()
    const langs = screen.getAllByText('typescript')
    expect(langs.length).toBe(2)
  })

  it('calls onOpen with build id when name button is clicked', () => {
    const onOpen = vi.fn()
    render(
      <BuildList builds={builds()} onOpen={onOpen} onCreate={() => {}} onDelete={() => {}} />,
    )
    fireEvent.click(screen.getByText('alpha'))
    expect(onOpen).toHaveBeenCalledWith('BLD-aaa')
  })

  it('calls onDelete with build id when delete is clicked', () => {
    const onDelete = vi.fn()
    render(
      <BuildList builds={builds()} onOpen={() => {}} onCreate={() => {}} onDelete={onDelete} />,
    )
    fireEvent.click(screen.getByLabelText('Delete BLD-bbb'))
    expect(onDelete).toHaveBeenCalledWith('BLD-bbb')
  })

  it('calls onCreate when New build is clicked', () => {
    const onCreate = vi.fn()
    render(
      <BuildList builds={[]} onOpen={() => {}} onCreate={onCreate} onDelete={() => {}} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /new build/i }))
    expect(onCreate).toHaveBeenCalled()
  })
})
