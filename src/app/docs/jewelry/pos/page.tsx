import { Metadata } from 'next'
import { readFileSync } from 'fs'
import { join } from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CreditCard, ExternalLink, ShoppingBag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Point of Sale (POS) - HERA Jewelry ERP Documentation',
  description: 'Professional point-of-sale system for jewelry retailers with payment processing, customer management, layaway support, and mobile capabilities.',
  openGraph: {
    title: 'Point of Sale (POS) - HERA Jewelry ERP',
    description: 'Professional point-of-sale system designed specifically for jewelry retailers',
    type: 'article'
  }
}

export default function POSPage() {
  const markdownPath = join(process.cwd(), 'docs', 'jewelry', 'pos.md')
  let markdownContent = ''
  
  try {
    markdownContent = readFileSync(markdownPath, 'utf8')
  } catch (error) {
    console.error('Error reading markdown file:', error)
    markdownContent = `
# Point of Sale (POS) - HERA Jewelry ERP

*Documentation is being loaded...*

Please check back shortly or contact support if this issue persists.
    `
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/docs" className="hover:text-primary">Docs</Link>
        <span>/</span>
        <Link href="/docs/jewelry" className="hover:text-primary">Jewelry ERP</Link>
        <span>/</span>
        <span className="text-foreground">Point of Sale (POS)</span>
      </nav>

      {/* Quick Access Card */}
      <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Point of Sale System
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Professional POS solution for jewelry retailers
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Link href="/jewelry/pos">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Open POS System
              </Button>
            </Link>
            <Link href="/jewelry/dashboard">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Markdown Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100 border-b pb-4">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-3xl font-semibold mt-8 mb-4 text-gray-900 dark:text-gray-100">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 space-y-2 text-gray-700 dark:text-gray-300">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 space-y-2 text-gray-700 dark:text-gray-300">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="ml-4">
                {children}
              </li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-700 dark:text-gray-300">
                {children}
              </em>
            ),
            code: ({ className, children }) => {
              if (className?.includes('language-')) {
                return (
                  <code className={className}>
                    {children}
                  </code>
                )
              }
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                  {children}
                </code>
              )
            },
            pre: ({ children }) => (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 border">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse border border-border">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted p-2 text-left font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border p-2">
                {children}
              </td>
            ),
            a: ({ href, children }) => (
              <Link 
                href={href || '#'} 
                className="text-primary hover:underline font-medium"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {children}
              </Link>
            )
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>

      {/* Navigation */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex justify-between items-center">
          <Link href="/docs/jewelry/inventory">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Inventory Management
            </Button>
          </Link>
          <Link href="/docs/jewelry/customers">
            <Button>
              Customer Management
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}