export interface Solution {
  slug: string
  name: string
  tagline: string
  bullets: string[]
  demoHref: string
  bookHref: string
  image?: string
  smart_code?: string
}

export const SOLUTIONS: Solution[] = [
  {
    slug: 'salon',
    name: 'Salon ERP',
    tagline: 'Appointments, stylists, inventory and memberships in one place.',
    bullets: ['Online booking', 'Chair & room scheduling', 'POS & packages'],
    demoHref: '/demo?solution=salon',
    bookHref: '/book-a-meeting?solution=salon',
    smart_code: 'HERA.ERP.SOLUTION.CARD.SALON.V1'
  },
  {
    slug: 'crm',
    name: 'CRM',
    tagline: "Pipeline, accounts and activities you'll actually keep up-to-date.",
    bullets: ['Deals & stages', 'Tasks & email sync', 'Simple reporting'],
    demoHref: '/demo?solution=crm',
    bookHref: '/book-a-meeting?solution=crm',
    smart_code: 'HERA.ERP.SOLUTION.CARD.CRM.V1'
  },
  {
    slug: 'civicflow',
    name: 'CivicFlow',
    tagline: 'From applications to outcomes—transparent, auditable delivery.',
    bullets: ['Grant workflows', 'Reviews & scoring', 'Impact tracking'],
    demoHref: '/demo?solution=civicflow',
    bookHref: '/book-a-meeting?solution=civicflow',
    smart_code: 'HERA.ERP.SOLUTION.CARD.CIVICFLOW.V1'
  },
  {
    slug: 'finance',
    name: 'Finance',
    tagline: 'Sales, purchases, journals and reporting—tied to every event.',
    bullets: ['AP/AR', 'Journals', 'Reliable P&L and cash view'],
    demoHref: '/demo?solution=finance',
    bookHref: '/book-a-meeting?solution=finance',
    smart_code: 'HERA.ERP.SOLUTION.CARD.FINANCE.V1'
  }
]
