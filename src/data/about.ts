export type Leader = {
  id: string
  name: string
  title: string
  bio: string
  photo?: string
  linkedin?: string
}

export const LEADERS: Leader[] = [
  {
    id: 'ceo',
    name: 'Alex Chen',
    title: 'Founder & CEO',
    bio: 'Leads product vision and customer outcomes across industries.',
    linkedin: '#'
  },
  {
    id: 'cto',
    name: 'Sarah Johnson',
    title: 'CTO',
    bio: 'Owns reliability, security and platform quality.',
    linkedin: '#'
  },
  {
    id: 'coo',
    name: 'Michael Rodriguez',
    title: 'COO',
    bio: 'Drives delivery, customer success and scale.',
    linkedin: '#'
  }
]

// Non-confidential approach principles (no architecture specifics)
export const APPROACH: { title: string; desc: string }[] = [
  {
    title: 'Customer Outcomes',
    desc: 'We start from measurable business results and work backwards.'
  },
  {
    title: 'Security & Privacy',
    desc: 'We treat data protection as a first-class responsibility.'
  },
  {
    title: 'Configurability',
    desc: 'Products adapt to unique workflows without custom code sprawl.'
  },
  {
    title: 'Interoperability',
    desc: 'Open integration points to connect the tools you already use.'
  },
  { title: 'Reliability', desc: 'Predictable uptime and support you can count on.' },
  { title: 'Continuous Improvement', desc: 'Frequent, safe updates with clear change notes.' }
]

export const VALUES: { title: string; desc: string }[] = [
  { title: 'Earn Trust', desc: 'Operate with transparency and integrity.' },
  { title: 'Ship Quality Fast', desc: 'Small batches, high confidence, clear ownership.' },
  { title: 'Focus', desc: 'Do less, better—prioritise what moves the needle.' },
  { title: 'Kind Candour', desc: 'Direct feedback, respectfully delivered.' }
]

export const MILESTONES: { year: string; title: string; desc: string }[] = [
  {
    year: '2025',
    title: 'Public preview',
    desc: 'First customers onboarded across multiple industries.'
  },
  {
    year: '2025 Q4',
    title: 'Partner network',
    desc: 'Approved accounting partners in EMEA, APAC and GCC.'
  },
  { year: '2026', title: 'Global scale', desc: 'Expanded modules and multi-region operations.' }
]

export const FOOTPRINT: { region: string; items: string[] }[] = [
  { region: 'EMEA', items: ['London', 'Dubai'] },
  { region: 'APAC', items: ['Kerala'] },
  { region: 'Americas', items: ['— adding soon —'] }
]
