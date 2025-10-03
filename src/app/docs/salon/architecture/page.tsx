import { SalonDocPage } from '../SalonDocPage'

export default async function ArchitecturePage() {
  return (
    <SalonDocPage
      filename="architecture.md"
      title="Architecture"
      prevPage={{ href: "/docs/salon/financial-integration", label: "Financial Integration" }}
      nextPage={{ href: "/docs/salon", label: "Back to Overview" }}
    />
  )
}