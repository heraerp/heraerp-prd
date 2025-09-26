import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(process.cwd(), 'generated/blog-posts')

export interface PostMeta {
  title: string
  description: string
  excerpt: string
  date: string
  city: string
  region: string
  country: string
  pillar: string
  keywords: string[]
  faq: Array<{ q: string; a: string }>
  cta_variants: string[]
  trust_signals: string[]
  local_stats: {
    business_count: string
    growth_rate: string
    pain_points: string[]
    opportunities: string[]
  }
  hero_subtitle: string
  generatedAt: string
  published: boolean
}

export interface Post {
  slug: string
  meta: PostMeta
  content: string
}

// Get all post slugs for static generation
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return []
  }

  return fs
    .readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.mdx'))
    .map(file => {
      // Remove the date prefix and .mdx extension
      const filename = file.replace(/\.mdx$/, '')
      // Check if filename starts with date pattern YYYY-MM-DD-
      if (/^\d{4}-\d{2}-\d{2}-/.test(filename)) {
        return filename.substring(11) // Remove the date prefix
      }
      return filename
    })
}

// Get a single post by slug
export function getPostBySlug(slug: string): Post | null {
  if (!fs.existsSync(POSTS_DIR)) {
    return null
  }

  // Find the file that ends with this slug
  const files = fs.readdirSync(POSTS_DIR)
  const matchingFile = files.find(file => {
    if (!file.endsWith('.mdx')) return false
    const filename = file.replace(/\.mdx$/, '')
    // Check if it matches directly or after removing date prefix
    if (filename === slug) return true
    if (/^\d{4}-\d{2}-\d{2}-/.test(filename)) {
      return filename.substring(11) === slug
    }
    return false
  })

  if (!matchingFile) {
    return null
  }

  const filepath = path.join(POSTS_DIR, matchingFile)

  const fileContent = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(fileContent)

  return {
    slug,
    meta: data as PostMeta,
    content
  }
}

// Get all posts sorted by date
export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return []
  }

  const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.mdx'))
  const posts = files
    .map(file => {
      const filepath = path.join(POSTS_DIR, file)
      const fileContent = fs.readFileSync(filepath, 'utf8')
      const { data, content } = matter(fileContent)

      // Extract slug from filename
      const filename = file.replace(/\.mdx$/, '')
      let slug = filename
      if (/^\d{4}-\d{2}-\d{2}-/.test(filename)) {
        slug = filename.substring(11)
      }

      return {
        slug,
        meta: data as PostMeta,
        content
      }
    })
    .filter(post => post.meta.published !== false)
    .sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime())

  return posts
}

// Get posts by city
export function getPostsByCity(city: string): Post[] {
  return getAllPosts().filter(post => post.meta.city.toLowerCase() === city.toLowerCase())
}

// Get posts by pillar/topic
export function getPostsByPillar(pillar: string): Post[] {
  return getAllPosts().filter(post => post.meta.pillar.toLowerCase() === pillar.toLowerCase())
}

// Get related posts (same city or pillar, excluding current)
export function getRelatedPosts(currentSlug: string, limit = 3): Post[] {
  const currentPost = getPostBySlug(currentSlug)
  if (!currentPost) return []

  const allPosts = getAllPosts()

  // Score posts by relevance
  const scoredPosts = allPosts
    .filter(post => post.slug !== currentSlug)
    .map(post => {
      let score = 0

      // Same city = 2 points
      if (post.meta.city === currentPost.meta.city) score += 2

      // Same pillar = 3 points
      if (post.meta.pillar === currentPost.meta.pillar) score += 3

      // Same region = 1 point
      if (post.meta.region === currentPost.meta.region) score += 1

      return { post, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scoredPosts.slice(0, limit).map(item => item.post)
}

// Search posts by keyword
export function searchPosts(query: string): Post[] {
  const normalizedQuery = query.toLowerCase()

  return getAllPosts().filter(post => {
    const searchableContent = [
      post.meta.title,
      post.meta.description,
      post.meta.excerpt,
      post.meta.city,
      post.meta.pillar,
      ...post.meta.keywords,
      post.content
    ]
      .join(' ')
      .toLowerCase()

    return searchableContent.includes(normalizedQuery)
  })
}

// Get unique cities
export function getAllCities(): Array<{
  city: string
  region: string
  country: string
  count: number
}> {
  const posts = getAllPosts()
  const cityMap = new Map<string, { region: string; country: string; count: number }>()

  posts.forEach(post => {
    const key = post.meta.city
    const existing = cityMap.get(key) || {
      region: post.meta.region,
      country: post.meta.country,
      count: 0
    }
    cityMap.set(key, { ...existing, count: existing.count + 1 })
  })

  return Array.from(cityMap.entries())
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.count - a.count)
}

// Get unique pillars/topics
export function getAllPillars(): Array<{ pillar: string; count: number }> {
  const posts = getAllPosts()
  const pillarMap = new Map<string, number>()

  posts.forEach(post => {
    const count = pillarMap.get(post.meta.pillar) || 0
    pillarMap.set(post.meta.pillar, count + 1)
  })

  return Array.from(pillarMap.entries())
    .map(([pillar, count]) => ({ pillar, count }))
    .sort((a, b) => b.count - a.count)
}
