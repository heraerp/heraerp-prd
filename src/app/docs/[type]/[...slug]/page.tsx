import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getDocPage, getDocNavigation, trackDocView } from '@/lib/hera-docs'
import DocLayout from '@/components/docs/DocLayout'
import DocContent from '@/components/docs/DocContent'
import DocBreadcrumb from '@/components/docs/DocBreadcrumb'
import DocMeta from '@/components/docs/DocMeta'

interface PageProps {
  params: Promise<{
    type: 'dev' | 'user'
    slug: string[]
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, slug } = await params
  const slugPath = slug.join('/')
  
  try {
    const page = await getDocPage(slugPath, type)
    
    if (!page) {
      return {
        title: 'Page Not Found - HERA Docs',
        description: 'The requested documentation page could not be found.',
      }
    }
    
    return {
      title: `${page.title} - HERA ${type === 'dev' ? 'Developer' : 'User'} Docs`,
      description: page.description || `${page.title} documentation for HERA platform`,
      openGraph: {
        title: page.title,
        description: page.description,
        type: 'article',
        publishedTime: page.createdAt,
        modifiedTime: page.updatedAt,
      },
    }
  } catch (error) {
    return {
      title: 'Page Not Found - HERA Docs',
      description: 'The requested documentation page could not be found.',
    }
  }
}

export default async function DocumentationPage({ params }: PageProps) {
  const { type, slug } = await params
  const slugPath = slug.join('/')

  // Validate doc type
  if (type !== 'dev' && type !== 'user') {
    notFound()
  }


  try {
    const [page, navigation] = await Promise.all([
      getDocPage(slugPath, type),
      getDocNavigation(type)
    ])

    if (!page) {
      // During build time, create a fallback page structure
      const fallbackPage = {
        id: `fallback-${slugPath}`,
        title: slugPath.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Documentation',
        slug: slugPath,
        content: `<h1>Documentation Page</h1><p>This documentation page is being loaded dynamically.</p>`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        breadcrumb: [
          { title: 'Docs', href: '/docs' },
          { title: type === 'dev' ? 'Developer' : 'User', href: `/docs/${type}` }
        ]
      }
      
      const navigation = await getDocNavigation(type)
      
      return (
        <DocLayout navigation={navigation} docType={type} currentPath={slugPath}>
          <article className="max-w-4xl mx-auto">
            <DocBreadcrumb path={fallbackPage.breadcrumb} docType={type} />
            
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4 text-hera-primary">
                {fallbackPage.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                This documentation page will be dynamically loaded.
              </p>
            </header>

            <DocMeta
              lastUpdated={fallbackPage.updatedAt}
              readingTime={1}
            />

            <div className="prose prose-lg max-w-none">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </article>
        </DocLayout>
      )
    }

    // Track page view asynchronously
    trackDocView(page.id, type).catch(console.error)

    return (
      <DocLayout navigation={navigation} docType={type} currentPath={slugPath}>
        <article className="max-w-4xl mx-auto">
          <DocBreadcrumb path={page.breadcrumb} docType={type} />
          
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-hera-primary">
              {page.title}
            </h1>
            {page.description && (
              <p className="text-xl text-muted-foreground">
                {page.description}
              </p>
            )}
          </header>

          <DocMeta
            lastUpdated={page.updatedAt}
            author={page.author}
            readingTime={page.readingTime}
            editUrl={page.editUrl}
          />

          <DocContent 
            content={page.content}
            tableOfContents={page.tableOfContents}
          />

          {page.nextPage && (
            <div className="mt-12 pt-8 border-t">
              <div className="flex justify-between items-center">
                {page.prevPage && (
                  <a
                    href={`/docs/${type}/${page.prevPage.slug}`}
                    className="text-hera-primary hover:underline"
                  >
                    ← {page.prevPage.title}
                  </a>
                )}
                <a
                  href={`/docs/${type}/${page.nextPage.slug}`}
                  className="text-hera-primary hover:underline ml-auto"
                >
                  {page.nextPage.title} →
                </a>
              </div>
            </div>
          )}
        </article>
      </DocLayout>
    )
  } catch (error) {
    console.error('Error loading documentation page:', error)
    notFound()
  }
}

export async function generateStaticParams() {
  // Generate static params for common documentation pages
  const commonDevPaths = [
    { type: 'dev', slug: ['getting-started'] },
    { type: 'dev', slug: ['architecture', 'overview'] },
    { type: 'dev', slug: ['database', 'setup'] },
    { type: 'dev', slug: ['api', 'development'] },
    { type: 'dev', slug: ['components', 'development'] },
    { type: 'dev', slug: ['testing', 'guide'] },
    { type: 'dev', slug: ['deployment', 'guide'] },
    { type: 'dev', slug: ['contributing'] },
  ]

  const commonUserPaths = [
    { type: 'user', slug: ['overview'] },
    { type: 'user', slug: ['getting-started'] },
    { type: 'user', slug: ['dashboard', 'overview'] },
    { type: 'user', slug: ['features', 'core'] },
    { type: 'user', slug: ['account', 'management'] },
    { type: 'user', slug: ['data', 'management'] },
    { type: 'user', slug: ['troubleshooting'] },
    { type: 'user', slug: ['faq'] },
    { type: 'user', slug: ['mobile', 'guide'] },
  ]

  return [...commonDevPaths, ...commonUserPaths]
}