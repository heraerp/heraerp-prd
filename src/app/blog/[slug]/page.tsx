import React, { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from '@/lib/posts'
import CTA from '@/components/CTA'
import RelatedPosts from '@/components/RelatedPosts'
import FAQ from '@/components/FAQ'
import NewsletterSignup from '@/components/NewsletterSignup'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate all post paths for static generation
export async function generateStaticParams() {
  const slugs = getAllPostSlugs()
  return slugs.map(slug => ({ slug }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const post = getPostBySlug(resolvedParams.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.'
    }
  }

  const canonicalUrl = `https://heraerp.com/blog/${resolvedParams.slug}`

  return {
    title: post.meta.title,
    description: post.meta.description,
    keywords: post.meta.keywords.join(', '),
    authors: [{ name: 'HERA ERP' }],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: 'article',
      url: canonicalUrl,
      locale: post.meta.country === 'UK' ? 'en_GB' : 'en_US',
      siteName: 'HERA ERP',
      publishedTime: post.meta.date,
      modifiedTime: post.meta.generatedAt
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta.title,
      description: post.meta.excerpt,
      creator: '@heraerp',
      site: '@heraerp'
    }
  }
}

export default async function BlogPost({ params }: PageProps) {
  const resolvedParams = await params
  const post = getPostBySlug(resolvedParams.slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = getRelatedPosts(resolvedParams.slug, 3)

  // Simple markdown to HTML conversion (basic, without MDX)
  const contentHtml = post.content
    .split('\n')
    .map(line => {
      // Convert headers
      if (line.startsWith('### '))
        return `<h3 class="text-xl font-semibold mt-4 mb-2">${line.substring(4)}</h3>`
      if (line.startsWith('## '))
        return `<h2 class="text-2xl font-bold mt-6 mb-3">${line.substring(3)}</h2>`
      if (line.startsWith('# '))
        return `<h1 class="text-3xl font-bold mt-8 mb-4">${line.substring(2)}</h1>`

      // Convert lists
      if (line.startsWith('- ')) return `<li class="ml-6 mb-1">• ${line.substring(2)}</li>`

      // Convert bold text
      line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

      // Convert quotes
      if (line.startsWith('> '))
        return `<blockquote class="border-l-4 border-blue-500 pl-4 italic my-4">${line.substring(2)}</blockquote>`

      // Regular paragraphs
      if (line.trim()) return `<p class="mb-4">${line}</p>`

      return ''
    })
    .join('\n')

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center gap-2 text-sm dark:ink-muted">
            <span>{post.meta.city}</span>
            <span>•</span>
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
          <h1 className="mb-4 text-4xl font-bold ink dark:text-white sm:text-5xl">
            {post.meta.title}
          </h1>
          <p className="text-xl ink-muted dark:text-gray-300">{post.meta.hero_subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {post.meta.trust_signals.slice(0, 3).map((signal, idx) => (
              <span
                key={idx}
                className="rounded-full bg-white/80 dark:bg-gray-700/80 px-4 py-1 text-sm font-medium ink dark:text-gray-300"
              >
                ✓ {signal}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-3">
        {/* Table of Contents - Desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <h3 className="font-semibold mb-4">In this article</h3>
              <nav className="space-y-2 text-sm">
                <a
                  href="#the-manual-reporting-crisis"
                  className="block dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400"
                >
                  The Manual Reporting Crisis
                </a>
                <a
                  href="#why-traditional-solutions-fall-short"
                  className="block dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Why Traditional Solutions Fall Short
                </a>
                <a
                  href="#how-modern-finance-automation-transforms-operations"
                  className="block dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400"
                >
                  How Modern Finance Automation Transforms Operations
                </a>
                <a
                  href="#real-results-bristol-business-case-study"
                  className="block dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Real Results: Bristol Business Case Study
                </a>
                <a
                  href="#implementation-your-30-day-roadmap"
                  className="block dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Implementation: Your 30-Day Roadmap
                </a>
                <a
                  href="#roi-calculator-for-bristol-businesses"
                  className="block dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400"
                >
                  ROI Calculator for Bristol Businesses
                </a>
                <a
                  href="#common-questions-from-bristol-business-owners"
                  className="block dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Common Questions from Bristol Business Owners
                </a>
                <a
                  href="#your-next-steps"
                  className="block dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Your Next Steps
                </a>
              </nav>
            </div>
            <NewsletterSignup className="mt-8" />
          </div>
        </aside>

        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert mx-auto max-w-none lg:col-span-2">
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />

          {/* FAQ Section */}
          {post.meta.faq?.length > 0 && <FAQ items={post.meta.faq} />}
        </article>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}

      {/* Sticky CTA */}
      <CTA city={post.meta.city} variants={post.meta.cta_variants} />
    </main>
  )
}
