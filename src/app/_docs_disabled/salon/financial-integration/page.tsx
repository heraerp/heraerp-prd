import { SalonDocPage } from '../SalonDocPage'

export default async function FinancialIntegrationPage() {
  return (
    <SalonDocPage
      filename="financial-integration.md"
      title="Financial Integration"
      prevPage={{ href: '/docs/salon/multi-branch', label: 'Multi-Branch Operations' }}
      nextPage={{ href: '/docs/salon/architecture', label: 'Architecture' }}
    />
  )
}
