import { SalonDocPage } from '../SalonDocPage'

export default async function AppointmentsPage() {
  return (
    <SalonDocPage
      filename="appointments.md"
      title="Appointments"
      prevPage={{ href: '/docs/salon/getting-started', label: 'Getting Started' }}
      nextPage={{ href: '/docs/salon/clients', label: 'Client Management' }}
    />
  )
}
