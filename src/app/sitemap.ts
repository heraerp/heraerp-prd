// import { allPartners } from '../../.contentlayer/generated'
const allPartners: any[] = []
import type { MetadataRoute } from 'next'
import { canonical } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://heraerp.com'

  const staticEntries: MetadataRoute.Sitemap = [
    { url: canonical('/'), lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    {
      url: canonical('/partners'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: canonical('/partners/apply'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: canonical('/pricing'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: canonical('/solutions'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    },
    { url: canonical('/blog'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    {
      url: canonical('/about'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6
    },
    { url: canonical('/docs'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    {
      url: canonical('/contact'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6
    }
  ]

  const partnerEntries: MetadataRoute.Sitemap = allPartners
    .filter(p => p.published !== false)
    .map(p => ({
      url: `${base}/partners/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))

  return [...staticEntries, ...partnerEntries]
}
