import { Suspense } from 'react'
import ClientView from './ClientView'

export default function ScanDetailPage() {
  return (
    <Suspense fallback={null}>
      <ClientView />
    </Suspense>
  )
}
