import ClientView from './ClientView'

interface Props { params: Promise<{ buildId: string }> }

export default async function BuildCanvasPage({ params }: Props) {
  const { buildId } = await params
  return <ClientView buildId={buildId} />
}

export function generateStaticParams() {
  return [{ buildId: 'placeholder' }]
}
