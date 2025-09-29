import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PARTNERS } from '@/data/partners';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return PARTNERS.map(partner => ({
    slug: partner.slug
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const partner = PARTNERS.find(p => p.slug === params.slug);
  if (!partner) return { title: 'Partner Not Found' };

  return {
    title: `${partner.name} — HERA Partner`,
    description: partner.summary
  };
}

function PartnerProfileClient({ slug }: { slug: string }) {
  "use client";

  if (typeof window !== 'undefined' && (window as any).track) {
    (window as any).track('partners_profile_view', { slug });
  }

  return null;
}

export default function PartnerProfilePage({ params }: { params: { slug: string } }) {
  const partner = PARTNERS.find(p => p.slug === params.slug);

  if (!partner) {
    notFound();
  }

  return (
    <>
      <PartnerProfileClient slug={params.slug} />

      <main className="section py-10 space-y-8 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link href="/partners" className="ink-muted hover:ink text-sm transition-colors">
          ← Back to Partners
        </Link>

        {/* Hero Section */}
        <header className="space-y-4">
          <div className="flex items-start gap-6">
            {partner.logo ? (
              <img
                src={partner.logo}
                alt={`${partner.name} logo`}
                className="h-20 w-20 rounded-xl object-contain"
              />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 flex items-center justify-center">
                <span className="text-2xl font-semibold ink">
                  {partner.name.charAt(0)}
                </span>
              </div>
            )}

            <div className="flex-1">
              <h1 className="ink text-3xl font-semibold mb-3">{partner.name}</h1>
              <span className="pill">{partner.region}</span>
            </div>
          </div>

          <p className="ink-muted text-lg leading-relaxed">
            {partner.summary}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {partner.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Metrics */}
        {partner.metrics && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {partner.metrics.customers && (
              <div className="card-glass p-4 rounded-xl text-center">
                <div className="ink text-2xl font-semibold">{partner.metrics.customers}</div>
                <div className="ink-muted text-sm mt-1">Customers</div>
              </div>
            )}
            {partner.metrics.projects && (
              <div className="card-glass p-4 rounded-xl text-center">
                <div className="ink text-2xl font-semibold">{partner.metrics.projects}</div>
                <div className="ink-muted text-sm mt-1">Projects</div>
              </div>
            )}
            {partner.metrics.years && (
              <div className="card-glass p-4 rounded-xl text-center">
                <div className="ink text-2xl font-semibold">{partner.metrics.years}</div>
                <div className="ink-muted text-sm mt-1">Years Experience</div>
              </div>
            )}
          </section>
        )}

        {/* Solutions Focus */}
        <section className="space-y-4">
          <h2 className="ink text-xl font-semibold">Solutions Focus</h2>
          <div className="card-glass p-6 rounded-2xl">
            <ul className="space-y-3">
              {partner.tags.map(tag => (
                <li key={tag} className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <div className="ink font-medium">{tag}</div>
                    <div className="ink-muted text-sm">
                      Specialized expertise and proven implementations
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTAs */}
        <section className="flex flex-wrap gap-3">
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noreferrer"
              className="btn-gradient"
            >
              Visit website
            </a>
          )}
          {partner.contactEmail && (
            <a
              href={`mailto:${partner.contactEmail}`}
              className="btn-quiet"
            >
              Contact partner
            </a>
          )}
          <Link href="/partners/apply" className="btn-quiet">
            Apply to partner program
          </Link>
        </section>

        {/* Social Links */}
        {partner.socials && (
          <section className="flex gap-4 pt-4 border-t border-border">
            {partner.socials.linkedin && (
              <a
                href={partner.socials.linkedin}
                target="_blank"
                rel="noreferrer"
                className="ink-muted hover:ink transition-colors"
              >
                LinkedIn
              </a>
            )}
            {partner.socials.x && (
              <a
                href={partner.socials.x}
                target="_blank"
                rel="noreferrer"
                className="ink-muted hover:ink transition-colors"
              >
                X (Twitter)
              </a>
            )}
            {partner.socials.github && (
              <a
                href={partner.socials.github}
                target="_blank"
                rel="noreferrer"
                className="ink-muted hover:ink transition-colors"
              >
                GitHub
              </a>
            )}
          </section>
        )}
      </main>
    </>
  );
}