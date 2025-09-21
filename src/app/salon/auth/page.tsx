import { SalonDemoAuth } from '@/components/salon/auth/SalonDemoAuth'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hair Talkz Salon - Login',
  description: 'Access the Hair Talkz salon management system with role-based permissions'
}

export default function SalonAuthPage() {
  return <SalonDemoAuth />
}