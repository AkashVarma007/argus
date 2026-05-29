import { describe, it, expect } from 'vitest'
import { slugify } from '@/lib/build/slug'

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('My Tool')).toBe('my-tool')
  })

  it('ASCII-folds diacritics', () => {
    expect(slugify('Café')).toBe('cafe')
  })

  it('returns untitled for input that becomes empty', () => {
    expect(slugify('---')).toBe('untitled')
    expect(slugify('  ')).toBe('untitled')
    expect(slugify('')).toBe('untitled')
  })

  it('collapses runs of non-alphanumerics', () => {
    expect(slugify('foo bar  baz')).toBe('foo-bar-baz')
  })

  it('preserves a leading underscore', () => {
    expect(slugify('_internal')).toBe('_internal')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello')
  })

  it('handles mixed punctuation', () => {
    expect(slugify('GitHub: Readonly API')).toBe('github-readonly-api')
  })
})
