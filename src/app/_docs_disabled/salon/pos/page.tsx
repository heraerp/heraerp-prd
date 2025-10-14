import { SalonDocPage } from '../SalonDocPage'

export default async function POSPage() {
  return (
    <SalonDocPage
      filename="pos.md"
      title="Point of Sale"
      prevPage={{ href: '/docs/salon/services', label: 'Service Catalog' }}
      nextPage={{ href: '/docs/salon/multi-branch', label: 'Multi-Branch Operations' }}
    />
  )
}
