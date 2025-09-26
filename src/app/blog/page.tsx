import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getAllCities, getAllPillars } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Business Growth Blog | HERA ERP",
  description: "Practical guides for UK businesses to streamline operations, improve cash flow, and scale efficiently. Get our free SMB growth guide.",
  openGraph: {
    title: "Business Growth Blog - Transform Your Operations",
    description: "Join 3,000+ UK business owners getting actionable insights every week.",
    type: "website"
  }
};

export default function BlogListingPage() {
  const posts = getAllPosts();
  const cities = getAllCities();
  const pillars = getAllPillars();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 px-4 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
            Business Growth Insights
          </h1>
          <p className="mb-8 text-xl text-blue-100">
            Practical guides to transform your operations and boost profitability
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/free-guide"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-600 transition-transform hover:scale-105"
            >
              Get Free SMB Guide
            </Link>
            <Link
              href="/book-a-meeting"
              className="rounded-xl border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-blue-600"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Stats Bar */}
        <div className="mb-12 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{posts.length}</div>
            <div className="text-sm text-gray-600">Articles</div>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{cities.length}</div>
            <div className="text-sm text-gray-600">UK Cities</div>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{pillars.length}</div>
            <div className="text-sm text-gray-600">Topics</div>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600">3K+</div>
            <div className="text-sm text-gray-600">Readers</div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Latest Insights
            </h2>
            
            {posts.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center">
                <p className="text-gray-600">No blog posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <article
                    key={post.slug}
                    className="group rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                        {post.meta.city}
                      </span>
                      <span>{post.meta.pillar}</span>
                      <span>•</span>
                      <time dateTime={post.meta.date}>
                        {new Date(post.meta.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </time>
                    </div>
                    
                    <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-blue-600">
                      <Link href={`/blog/${post.slug}`}>
                        {post.meta.title}
                      </Link>
                    </h3>
                    
                    <p className="mb-4 text-gray-600 line-clamp-2">
                      {post.meta.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
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
                          <span 
                            key={idx}
                            className="text-xs text-gray-500"
                          >
                            ✓ {signal}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Newsletter Signup */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Free Growth Guide
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                30 proven tactics to streamline operations and boost profitability.
              </p>
              <Link
                href="/free-guide"
                className="block rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Download Free Guide
              </Link>
            </div>

            {/* Cities */}
            {cities.length > 0 && (
              <div className="rounded-xl bg-white p-6">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Browse by City
                </h3>
                <div className="space-y-2">
                  {cities.slice(0, 10).map(({ city, count }) => (
                    <Link
                      key={city}
                      href={`/blog?city=${encodeURIComponent(city)}`}
                      className="flex items-center justify-between text-sm text-gray-600 hover:text-blue-600"
                    >
                      <span>{city}</span>
                      <span className="text-gray-400">{count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {pillars.length > 0 && (
              <div className="rounded-xl bg-white p-6">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Popular Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pillars.map(({ pillar, count }) => (
                    <Link
                      key={pillar}
                      href={`/blog?topic=${encodeURIComponent(pillar)}`}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                    >
                      {pillar} ({count})
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="rounded-xl bg-gray-900 p-6 text-white">
              <h3 className="mb-2 text-lg font-semibold">
                Ready to Transform Your Business?
              </h3>
              <p className="mb-4 text-sm text-gray-300">
                See how HERA can streamline your operations.
              </p>
              <Link
                href="/book-a-meeting"
                className="block rounded-lg bg-white py-2 text-center text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
              >
                Book Your Free Demo
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}