import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getAllCities, getAllPillars } from '@/lib/posts'

export const metadata: Metadata = {
  title: 'Business Growth Blog | HERA ERP',
  description:
    'Practical guides for UK businesses to streamline operations, improve cash flow, and scale efficiently. Get our free SMB growth guide.',
  openGraph: {
    title: 'Business Growth Blog - Transform Your Operations',
    description: 'Join 3,000+ UK business owners getting actionable insights every week.',
    type: 'website'
  }
}

export default function BlogListingPage() {
  const posts = getAllPosts()
  const cities = getAllCities()
  const pillars = getAllPillars()

  return (
    <main className="min-h-screen">
      {/* Hero Section - Enterprise Grade */}
      <section className="relative overflow-hidden py-20 px-6">
        {/* Background gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-6">
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                📚 Knowledge Hub
              </span>
            </div>

            <h1 className="ink text-5xl md:text-6xl font-bold mb-6">
              Business Growth
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Insights
              </span>
            </h1>

            <p className="ink-muted text-xl md:text-2xl max-w-3xl mx-auto mb-8">
              Practical guides to transform your operations and boost profitability
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/free-guide"
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 border border-indigo-500/20 shadow-lg hover:shadow-xl transition-all"
              >
                Get Free SMB Guide
              </Link>
              <Link
                href="/book-a-meeting"
                className="px-5 py-2.5 text-sm font-medium card-glass ink border border-border rounded-xl hover:border-indigo-500/30 transition-all"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Stats Bar - Glassmorphism */}
        <div className="mb-12 grid gap-4 sm:grid-cols-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
            <div className="relative card-glass p-6 rounded-2xl border border-border text-center">
              <div className="ink text-3xl font-bold mb-1">{posts.length}</div>
              <div className="ink-muted text-xs uppercase tracking-wider">Articles</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-all" />
            <div className="relative card-glass p-6 rounded-2xl border border-border text-center">
              <div className="ink text-3xl font-bold mb-1">{cities.length}</div>
              <div className="ink-muted text-xs uppercase tracking-wider">UK Cities</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all" />
            <div className="relative card-glass p-6 rounded-2xl border border-border text-center">
              <div className="ink text-3xl font-bold mb-1">{pillars.length}</div>
              <div className="ink-muted text-xs uppercase tracking-wider">Topics</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all" />
            <div className="relative card-glass p-6 rounded-2xl border border-border text-center">
              <div className="ink text-3xl font-bold mb-1">50+</div>
              <div className="ink-muted text-xs uppercase tracking-wider">Readers</div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="mb-6 text-2xl font-bold ink">Latest Insights</h2>

            {posts.length === 0 ? (
              <div className="card-glass rounded-2xl p-8 text-center border border-border">
                <p className="ink-muted">No blog posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <article key={`${post.slug}-${index}`} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 rounded-2xl blur-xl transition-all" />
                    <div className="relative card-glass p-6 rounded-2xl border border-border hover:border-indigo-500/30 transition-all">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm ink-muted">
                        <span className="rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 px-3 py-1 text-indigo-600 dark:text-indigo-400">
                          {post.meta.city}
                        </span>
                        <span>{post.meta.pillar}</span>
                        <span>•</span>
                        <time dateTime={post.meta.date}>
                          {new Date(post.meta.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </time>
                      </div>

                      <h3 className="mb-2 text-xl font-bold ink group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                        <Link href={`/blog/${post.slug}`}>{post.meta.title}</Link>
                      </h3>

                      <p className="mb-4 ink-muted line-clamp-2">{post.meta.excerpt}</p>

                      <div className="flex items-center justify-between">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          Read more
                          <svg
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>

                        <div className="flex gap-2">
                          {post.meta.trust_signals.slice(0, 1).map((signal, idx) => (
                            <span key={idx} className="text-xs ink-muted">
                              ✓ {signal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Newsletter Signup - Glassmorphism */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
              <div className="relative card-glass p-6 rounded-2xl border border-blue-500/20">
                <h3 className="mb-2 text-lg font-semibold ink">Free Growth Guide</h3>
                <p className="mb-4 text-sm ink-muted">
                  30 proven tactics to streamline operations and boost profitability.
                </p>
                <Link
                  href="/free-guide"
                  className="block rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-center text-sm font-medium text-white hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  Download Free Guide
                </Link>
              </div>
            </div>

            {/* Cities - Glassmorphism */}
            {cities.length > 0 && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl" />
                <div className="relative card-glass p-6 rounded-2xl border border-border">
                  <h3 className="mb-4 font-semibold ink">Browse by City</h3>
                  <div className="space-y-2">
                    {cities.slice(0, 10).map(({ city, count }) => (
                      <Link
                        key={city}
                        href={`/blog?city=${encodeURIComponent(city)}`}
                        className="flex items-center justify-between text-sm ink-muted hover:text-indigo-400 transition-colors"
                      >
                        <span>{city}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                          {count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Topics - Glassmorphism */}
            {pillars.length > 0 && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl" />
                <div className="relative card-glass p-6 rounded-2xl border border-border">
                  <h3 className="mb-4 font-semibold ink">Popular Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {pillars.map(({ pillar, count }) => (
                      <Link
                        key={pillar}
                        href={`/blog?topic=${encodeURIComponent(pillar)}`}
                        className="rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 px-3 py-1 text-sm ink hover:border-indigo-400 hover:text-indigo-400 transition-all"
                      >
                        {pillar} ({count})
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CTA - Glassmorphism */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
              <div className="relative card-glass p-6 rounded-2xl border border-purple-500/20">
                <h3 className="mb-2 text-lg font-semibold ink">
                  Ready to Transform Your Business?
                </h3>
                <p className="mb-4 text-sm ink-muted">
                  See how HERA can streamline your operations.
                </p>
                <Link
                  href="/book-a-meeting"
                  className="block rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 py-2.5 text-center text-sm font-medium text-white hover:from-purple-600 hover:to-pink-700 transition-all"
                >
                  Book Your Free Demo
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
