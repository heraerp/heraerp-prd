export type PricingModule = 'Salon' | 'ISP' | 'CRM' | 'CivicFlow' | 'Finance'

export const PRICING_MODULES: { key: PricingModule; label: string; desc: string }[] = [
  { key: 'Salon', label: 'Salon', desc: 'Appointments, POS, inventory' },
  { key: 'ISP', label: 'ISP', desc: 'Provisioning, tickets, billing' },
  { key: 'CRM', label: 'CRM', desc: 'Pipeline, accounts, activities' },
  { key: 'CivicFlow', label: 'CivicFlow', desc: 'Grants, reviews, outcomes' },
  { key: 'Finance', label: 'Finance', desc: 'AP/AR, journals, reporting' }
]

export type RecommendedPackage = 'Essential' | 'Growth' | 'Enterprise'

export function computeRecommendation(input: {
  modules: PricingModule[]
  users: number // 1..1000
  locations: '1' | '2-5' | '6+'
  integrations: '0' | '1-2' | '3-5' | '6+'
  migration: 'none' | 'basic' | 'complex'
  support: 'standard' | 'premium'
}): { score: number; pkg: RecommendedPackage; timeline: string } {
  let score = 0
  score += input.modules.length * 2
  score += input.users <= 10 ? 0 : input.users <= 50 ? 2 : input.users <= 200 ? 4 : 6
  score += input.locations === '1' ? 0 : input.locations === '2-5' ? 2 : 4
  score +=
    input.integrations === '0'
      ? 0
      : input.integrations === '1-2'
        ? 2
        : input.integrations === '3-5'
          ? 4
          : 6
  score += input.migration === 'none' ? 0 : input.migration === 'basic' ? 2 : 4
  score += input.support === 'standard' ? 0 : 1

  let pkg: RecommendedPackage = 'Essential'
  if (score >= 6 && score < 12) pkg = 'Growth'
  if (score >= 12) pkg = 'Enterprise'

  const timeline = pkg === 'Essential' ? '1–2 weeks' : pkg === 'Growth' ? '2–4 weeks' : '4–8+ weeks'
  return { score, pkg, timeline }
}

export const PACKAGES: Array<{
  name: RecommendedPackage
  summary: string
  bullets: string[]
  ctaHint: string
}> = [
  {
    name: 'Essential',
    summary: 'Single team, single site, up to 2 integrations.',
    bullets: ['Core modules', 'Standard support', 'No/Basic migration'],
    ctaHint: 'Best for small teams and pilots'
  },
  {
    name: 'Growth',
    summary: 'Multi-team, multi-site, several integrations.',
    bullets: ['Core + advanced modules', 'Premium support', 'Light data migration'],
    ctaHint: 'Best for scaling teams'
  },
  {
    name: 'Enterprise',
    summary: 'Multi-site, SSO/compliance needs, complex migration.',
    bullets: ['Full module set', 'Custom integrations', 'Advanced onboarding'],
    ctaHint: 'Best for complex organisations'
  }
]

export function toQuery(params: Record<string, string | number | string[]>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(x => q.append(k, String(x)))
    else q.set(k, String(v))
  })
  return `?${q.toString()}`
}
