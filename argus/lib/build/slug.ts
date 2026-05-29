export function slugify(input: string): string {
  const leadingUnderscore = input.startsWith('_')
  const folded = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
  const replaced = folded.replace(/[^a-z0-9]+/g, '-')
  const trimmed = replaced.replace(/^-+|-+$/g, '')
  if (trimmed.length === 0) return 'untitled'
  return leadingUnderscore ? `_${trimmed}` : trimmed
}
