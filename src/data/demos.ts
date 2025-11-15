export type Demo = {
  slug: string
  name: string
  tagline: string
  bullets: string[]
  actives: string
  revenue: string
  setup: string
  demoHref: string
  buildHref: string
}

export const DEMOS: Demo[] = [
  {
    slug: 'salon',
    name: 'Salon & Spa',
    tagline: 'Full salon operations platform.',
    bullets: [
      'Smart Appointment Booking',
      'Staff & Commission Management',
      'Product Inventory & Sales'
    ],
    actives: 'Live Demo',
    revenue: 'All Features',
    setup: 'Instant Setup',
    demoHref: '/demo?solution=salon',
    buildHref: '/pricing-request?solution=salon'
  },
  {
    slug: 'isp',
    name: 'ISP & Telecom',
    tagline: 'Complete ISP business suite.',
    bullets: ['Subscriber Management', 'Billing & Invoicing', 'Network Monitoring'],
    actives: 'Live Demo',
    revenue: 'Enterprise Ready',
    setup: 'Fast Launch',
    demoHref: '/demo?solution=isp',
    buildHref: '/pricing-request?solution=isp'
  },
  {
    slug: 'crm',
    name: 'Universal CRM',
    tagline: 'Intelligent customer management.',
    bullets: ['Lead & Pipeline Tracking', 'Email Integration', 'Analytics & Forecasting'],
    actives: 'Live Demo',
    revenue: 'All Industries',
    setup: 'Ready Now',
    demoHref: '/demo?solution=crm',
    buildHref: '/pricing-request?solution=crm'
  }
]
