'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, ClockIcon, UserIcon, ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'

const blogPosts = [
  {
    id: 1,
    title: 'HERA ERP Transforms Business Operations Globally',
    description: 'Discover how enterprises worldwide are achieving unprecedented efficiency and cost savings with our revolutionary platform.',
    author: 'HERA Team',
    date: '2024-01-15',
    readTime: '5 min read',
    category: 'Product Launch',
    featured: true,
    image: '/blog/global-transformation.jpg',
    seoKeywords: ['ERP software', 'business transformation', 'enterprise resource planning']
  },
  {
    id: 2,
    title: 'Automation Excellence: The Future of Financial Management',
    description: 'Learn how intelligent automation is revolutionising accounting processes and reducing manual workload by up to 92%.',
    author: 'Innovation Team',
    date: '2024-01-10',
    readTime: '7 min read',
    category: 'Technology',
    featured: true,
    image: '/blog/automation-excellence.jpg',
    seoKeywords: ['financial automation', 'accounting software', 'business automation']
  },
  {
    id: 3,
    title: 'Success Story: Restaurant Chain Saves £350,000 Annually',
    description: 'A compelling case study of how a restaurant group transformed their operations and achieved remarkable cost savings.',
    author: 'Customer Success',
    date: '2024-01-05',
    readTime: '10 min read',
    category: 'Case Study',
    featured: false,
    image: '/blog/restaurant-success.jpg',
    seoKeywords: ['restaurant management', 'hospitality software', 'cost reduction']
  },
  {
    id: 4,
    title: 'Real-Time Financial Insights for Modern Businesses',
    description: 'Explore how instant financial visibility helps organisations make data-driven decisions and optimise cash flow.',
    author: 'Product Team',
    date: '2023-12-28',
    readTime: '6 min read',
    category: 'Best Practices',
    featured: false,
    image: '/blog/financial-insights.jpg',
    seoKeywords: ['financial reporting', 'business intelligence', 'cash flow management']
  },
  {
    id: 5,
    title: 'Why Modern ERPs Outperform Legacy Systems',
    description: 'An in-depth analysis of how cloud-native platforms deliver 200x faster implementation and 90% cost reduction.',
    author: 'Research Team',
    date: '2023-12-20',
    readTime: '8 min read',
    category: 'Industry Insights',
    featured: false,
    image: '/blog/modern-vs-legacy.jpg',
    seoKeywords: ['cloud ERP', 'digital transformation', 'legacy system replacement']
  },
  {
    id: 6,
    title: 'Enterprise Security: Protecting Your Business Data',
    description: 'Understanding multi-tenant security architecture and how it ensures complete data isolation for your organisation.',
    author: 'Security Team',
    date: '2023-12-15',
    readTime: '4 min read',
    category: 'Security',
    featured: false,
    image: '/blog/enterprise-security.jpg',
    seoKeywords: ['data security', 'enterprise security', 'SaaS security']
  },
  {
    id: 7,
    title: 'Healthcare Digital Transformation Success',
    description: 'How medical practices are modernising patient management and improving operational efficiency by 45%.',
    author: 'Healthcare Team',
    date: '2023-12-10',
    readTime: '6 min read',
    category: 'Healthcare',
    featured: false,
    image: '/blog/healthcare-transformation.jpg',
    seoKeywords: ['healthcare software', 'medical practice management', 'digital health']
  },
  {
    id: 8,
    title: 'Manufacturing Excellence Through Smart Technology',
    description: 'Discover how manufacturers are achieving quality control and production efficiency with intelligent systems.',
    author: 'Manufacturing Team',
    date: '2023-12-05',
    readTime: '7 min read',
    category: 'Manufacturing',
    featured: false,
    image: '/blog/manufacturing-excellence.jpg',
    seoKeywords: ['manufacturing ERP', 'production management', 'quality control']
  },
  {
    id: 9,
    title: 'Professional Services: Maximising Billable Hours',
    description: 'Best practices for consultancies to track time, manage projects, and improve profitability by 35%.',
    author: 'Professional Services Team',
    date: '2023-11-30',
    readTime: '5 min read',
    category: 'Professional Services',
    featured: false,
    image: '/blog/professional-services.jpg',
    seoKeywords: ['consulting software', 'time tracking', 'project management']
  }
]

const categories = [
  'All',
  'Product Launch',
  'Technology',
  'Case Study',
  'Best Practices',
  'Industry Insights',
  'Security',
  'Healthcare',
  'Manufacturing',
  'Professional Services'
]

export default function BlogPage() {
  // SEO metadata would typically be handled by Next.js metadata API
  const pageTitle = 'HERA ERP Blog - Enterprise Resource Planning Insights & Updates'
  const pageDescription = 'Discover the latest insights on ERP systems, digital transformation, business automation, and industry best practices from the HERA team.'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section with SEO-friendly content */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              HERA ERP Blog
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Enterprise insights, industry trends, and success stories from the forefront of business transformation
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colours whitespace-nowrap ${
                category === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              aria-label={`Filter by ${category}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Posts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Featured Articles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {blogPosts
            .filter((post) => post.featured)
            .map((post) => (
              <article key={post.id} className="group">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600"></div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <time className="flex items-center gap-1" dateTime={post.date}>
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(post.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </time>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colours">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="mt-2">{post.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <UserIcon className="h-3 w-3" />
                        {post.author}
                      </span>
                      <Link
                        href={`/blog/${post.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all"
                        aria-label={`Read more about ${post.title}`}
                      >
                        Read more
                        <ArrowRightIcon className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </article>
            ))}
        </div>
      </section>

      {/* All Posts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Latest Articles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article key={post.id} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="h-32 bg-gradient-to-br from-gray-400 to-gray-600"></div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {post.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colours line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="mt-2 line-clamp-3">
                    {post.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {post.author}
                      </span>
                      <time className="text-xs text-gray-500 dark:text-gray-500" dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </time>
                    </div>
                    <Link
                      href={`/blog/${post.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:gap-1 transition-all"
                      aria-label={`Read ${post.title}`}
                    >
                      Read →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter CTA - SEO Optimised */}
      <section className="bg-gray-100 dark:bg-gray-800 py-16" aria-label="Newsletter subscription">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Stay Informed
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Subscribe to receive the latest insights on enterprise resource planning, digital transformation, and business optimisation
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" aria-label="Email subscription form">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Email address"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colours"
              aria-label="Subscribe to newsletter"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  )
}