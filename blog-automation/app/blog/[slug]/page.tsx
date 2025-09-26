import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from "@/lib/posts";
import CTA from "@/components/CTA";
import RelatedPosts from "@/components/RelatedPosts";
import TableOfContents from "@/components/TableOfContents";
import FAQ from "@/components/FAQ";
import NewsletterSignup from "@/components/NewsletterSignup";

interface PageProps {
  params: { slug: string };
}

// Generate all post paths for static generation
export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map(slug => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found."
    };
  }

  const canonicalUrl = `https://heraerp.com/blog/${params.slug}`;
  
  return {
    title: post.meta.title,
    description: post.meta.description,
    keywords: post.meta.keywords.join(", "),
    authors: [{ name: "HERA ERP" }],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: "article",
      url: canonicalUrl,
      locale: post.meta.country === "UK" ? "en_GB" : "en_US",
      siteName: "HERA ERP",
      publishedTime: post.meta.date,
      modifiedTime: post.meta.generatedAt
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.excerpt,
      creator: "@heraerp",
      site: "@heraerp"
    }
  };
}

export default function BlogPost({ params }: PageProps) {
  const post = getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }
  
  const relatedPosts = getRelatedPosts(params.slug, 3);
  
  // Generate JSON-LD structured data
  const blogPostLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.meta.title,
    "description": post.meta.description,
    "datePublished": post.meta.date,
    "dateModified": post.meta.generatedAt,
    "author": {
      "@type": "Organization",
      "name": "HERA ERP",
      "url": "https://heraerp.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "HERA ERP",
      "url": "https://heraerp.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://heraerp.com/logo.png"
      }
    },
    "about": post.meta.keywords,
    "areaServed": {
      "@type": "Place",
      "name": `${post.meta.city}, ${post.meta.country}`
    }
  };
  
  const faqLd = post.meta.faq?.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.meta.faq.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  } : null;
  
  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "HERA ERP",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "299",
      "priceCurrency": "GBP",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "price": "299",
        "priceCurrency": "GBP",
        "unitText": "MONTH"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "500"
    }
  };

  return (
    <>
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostLd) }}
      />
      {faqLd && (
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-16 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <span>{post.meta.city}</span>
              <span>•</span>
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
            <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
              {post.meta.title}
            </h1>
            <p className="text-xl text-gray-600">
              {post.meta.hero_subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {post.meta.trust_signals.slice(0, 3).map((signal, idx) => (
                <span 
                  key={idx}
                  className="rounded-full bg-white/80 px-4 py-1 text-sm font-medium text-gray-700"
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
              <TableOfContents content={post.content} />
              <NewsletterSignup className="mt-8" />
            </div>
          </aside>

          {/* Article Content */}
          <article className="prose prose-lg mx-auto max-w-none lg:col-span-2">
            <MDXRemote source={post.content} />
            
            {/* FAQ Section */}
            {post.meta.faq?.length > 0 && (
              <FAQ items={post.meta.faq} />
            )}
          </article>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <RelatedPosts posts={relatedPosts} />
        )}

        {/* Sticky CTA */}
        <CTA 
          city={post.meta.city}
          variants={post.meta.cta_variants}
        />
      </main>
    </>
  );
}