import { Metadata } from 'next'
import { readFileSync } from 'fs'
import { join } from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Package, ExternalLink, Gem } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Inventory Management - HERA Jewelry ERP Documentation',
  description: 'Comprehensive inventory management for jewelry retailers. Track diamonds, gemstones, precious metals, and finished jewelry with complete specifications and valuations.',
  openGraph: {
    title: 'Inventory Management - HERA Jewelry ERP',
    description: 'Track diamonds, gemstones, precious metals, and finished jewelry with complete specifications',
    type: 'article'
  }
}

export default function InventoryPage() {
  const markdownPath = join(process.cwd(), 'docs', 'jewelry', 'inventory.md')
  let markdownContent = ''
  
  try {
    markdownContent = readFileSync(markdownPath, 'utf8')
  } catch (error) {
    console.error('Error reading markdown file:', error)
    markdownContent = `
# Inventory Management - HERA Jewelry ERP

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
        <span className="text-foreground">Inventory Management</span>
      </nav>

      {/* Quick Access Card */}
      <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Advanced Inventory Tracking</h3>
              <p className="text-muted-foreground mb-4">
                Learn how to track diamonds, gemstones, precious metals, and finished jewelry with complete 
                specifications, certifications, and real-time valuations designed specifically for jewelry retail.
              </p>
              <div className="flex gap-3">
                <Link href="/jewelry/inventory" target="_blank">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Inventory Module
                  </Button>
                </Link>
                <Link href="/docs/jewelry/pos">
                  <Button variant="outline" size="sm">
                    <Gem className="w-4 h-4 mr-2" />
                    POS Integration Guide
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Markdown Content */}
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground border-b pb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-semibold mt-4 mb-2 text-foreground">
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-muted-foreground leading-relaxed">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-4 space-y-2 text-muted-foreground">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4 space-y-2 text-muted-foreground">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="ml-4">
                {children}
              </li>
            ),
            code: ({ children, className }) => {
              const isInline = !className
              if (isInline) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                    {children}
                  </code>
                )
              }
              return (
                <code className={className}>
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
          <Link href="/docs/jewelry/getting-started">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Getting Started
            </Button>
          </Link>
          <Link href="/docs/jewelry/pos">
            <Button>
              Point of Sale (POS)
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}