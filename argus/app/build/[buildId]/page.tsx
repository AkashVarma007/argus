interface Props { params: Promise<{ buildId: string }> }

export default async function BuildCanvasPage({ params }: Props) {
  const { buildId } = await params
  return (
    <section style={{ padding: 32, fontFamily: 'var(--font-mono)', color: 'var(--color-ink2)' }}>
      build · canvas {buildId} · placeholder
    </section>
  )
}

export function generateStaticParams() {
  return [{ buildId: 'placeholder' }]
}
