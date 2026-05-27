interface Props { params: Promise<{ slug: string[] }> }

export default async function LearnPage({ params }: Props) {
  const { slug } = await params
  return (
    <section style={{ padding: 32, fontFamily: 'var(--font-mono)', color: 'var(--color-ink2)' }}>
      learn · {slug.join('/')} · placeholder
    </section>
  )
}

export function generateStaticParams() {
  return [{ slug: ['index'] }]
}
