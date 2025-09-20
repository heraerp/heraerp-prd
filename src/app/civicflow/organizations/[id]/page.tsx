import { Suspense } from 'react'
import Client from './page.client'

export default function OrgDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <Client id={params.id} />
    </Suspense>
  )
}
