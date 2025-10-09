import { SalonDocPage } from '../SalonDocPage'

export default async function MultiBranchPage() {
  return (
    <SalonDocPage
      filename="multi-branch.md"
      title="Multi-Branch Operations"
      prevPage={{ href: '/docs/salon/pos', label: 'Point of Sale' }}
      nextPage={{ href: '/docs/salon/financial-integration', label: 'Financial Integration' }}
    />
  )
}
