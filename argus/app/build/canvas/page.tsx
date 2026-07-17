import { Suspense } from 'react'
import ClientView from './ClientView'

export default function BuildCanvasPage() {
  return (
    <Suspense fallback={null}>
      <ClientView />
    </Suspense>
  )
}
