interface Props { params: Promise<{ scanId: string }> }

export default async function TestScanPage({ params }: Props) {
  const { scanId } = await params
  return (
    <section style={{ padding: 32, fontFamily: 'var(--font-mono)', color: 'var(--color-ink2)' }}>
      test · scan {scanId} · placeholder
    </section>
  )
}

export function generateStaticParams() {
  return [{ scanId: 'placeholder' }]
}
