import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
// import { allPartners } from '../../../../.contentlayer/generated'
const allPartners: any[] = []
import { jsonLdScript, canonical } from '@/lib/seo'

export const revalidate = 300

export async function generateStaticParams() {
  return allPartners.filter(p => p.published !== false).map(p => ({ slug: p.slug }))
}

function getBySlug(slug: string) {
  return allPartners.find(p => p.slug === slug && p.published !== false) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getBySlug(slug)
  if (!p) return {}
  return {
    title: p.seo_title ?? `${p.name} | HERA Partner`,
    description: p.seo_description ?? p.summary,
    alternates: { canonical: canonical(`/partners/${p.slug}`) },
    openGraph: {
      title: p.seo_title ?? p.name,
      description: p.seo_description ?? p.summary,
      url: canonical(`/partners/${p.slug}`),
      images: p.logo ? [{ url: p.logo }] : undefined,
      type: 'profile'
    }
  }
}

export default async function PartnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getBySlug(slug)
  if (!p) return notFound()

  const orgJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': p?.locations?.hq ? 'LocalBusiness' : 'Organization',
    name: p.name,
    url: canonical(`/partners/${p.slug}`),
    ...(p.logo ? { logo: p.logo } : {}),
    ...(p.website ? { sameAs: [p.website] } : {}),
    ...(p.locations?.hq
      ? { address: { '@type': 'PostalAddress', addressLocality: p.locations.hq } }
      : {})
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {jsonLdScript(orgJsonLd)}

        {/* Back link */}
        <Link
          href="/partners"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Partners
        </Link>

        {/* Partner Header */}
        <div className="mb-12">
          {p.logo && (
            <div className="h-20 mb-8 relative">
              <Image
                src={p.logo}
                alt={`${p.name} logo`}
                fill
                className="object-contain object-left"
              />
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{p.name}</h1>
          {p.summary && <p className="text-lg text-gray-600 dark:text-gray-400">{p.summary}</p>}
        </div>

        {/* Partner Details */}
        <div className="space-y-6 mb-12">
          {p.website && (
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-muted-foreground mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Website</span>
                <a
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {p.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          )}

          {p.locations &&
            (p.locations.hq || (p.locations.regions && p.locations.regions.length > 0)) && (
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-muted-foreground mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Locations</span>
                  <div className="text-gray-900 dark:text-gray-100">
                    {p.locations.hq && <div>Headquarters: {p.locations.hq}</div>}
                    {p.locations.regions && p.locations.regions.length > 0 && (
                      <div>Regions: {p.locations.regions.join(', ')}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {p.specialties && p.specialties.length > 0 && (
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-muted-foreground mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Specialties</span>
                <div className="flex flex-wrap gap-2">
                  {p.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {p.tags && p.tags.length > 0 && (
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-muted-foreground mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Tags</span>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {p.contacts && Array.isArray(p.contacts) && p.contacts.length > 0 && (
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-muted-foreground mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Contacts</span>
                <div className="space-y-2">
                  {p.contacts.map((contact: any, idx: number) => (
                    <div key={idx}>
                      <span className="font-medium">{contact.name}</span>
                      {contact.role && (
                        <span className="text-muted-foreground"> • {contact.role}</span>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="block text-sm text-primary hover:underline"
                        >
                          {contact.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4">Interested in partnering with {p.name}?</h2>
          <p className="text-muted-foreground mb-6">
            Contact us to learn more about how {p.name} can help with your HERA implementation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl text-center"
            >
              Contact Us
            </Link>
            <Link
              href="/partners"
              className="inline-block px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 text-center"
            >
              View All Partners
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
