import { redirect } from 'next/navigation'

export default function SalonPage() {
  // Redirect to dashboard as the main page
  redirect('/salon/dashboard')
}