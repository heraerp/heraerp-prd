import { getAllPartners } from '@/lib/partners'
import { jsonLdScript, canonical } from '@/lib/seo'
import PartnersClient from '@/components/partners/PartnersClient'

export const revalidate = 300

export const metadata = {
  title: 'HERA Partners | Implementation & Integration Partners',
  description: 'Implementation and integration partners for HERA ERP across regions and industries. Find certified consultants and system integrators.',
  alternates: { canonical: canonical('/partners') }
}

export default async function PartnersPage() {
  const partners = await getAllPartners() // already sorted by helper

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: partners.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: canonical(p.url),
      name: p.name
    }))
  }

  return (
    <>
      {jsonLdScript(itemListJsonLd)}
      <PartnersClient partners={partners} />
    </>
  )
}