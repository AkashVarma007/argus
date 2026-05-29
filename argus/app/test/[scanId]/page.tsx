// argus/app/test/[scanId]/page.tsx
import ClientView from './ClientView'

interface Props { params: Promise<{ scanId: string }> }

export default async function ScanDetailPage({ params }: Props) {
  const { scanId } = await params
  return <ClientView scanId={scanId} />
}

export function generateStaticParams() {
  return [{ scanId: 'placeholder' }]
}
