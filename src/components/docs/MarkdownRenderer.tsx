'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-p:leading-7 prose-li:text-base prose-li:leading-7 prose-strong:font-semibold prose-strong:text-slate-900 dark:prose-strong:text-slate-100',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom heading renderers with anchor links
          h1: ({ children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
            return (
              <h1 id={id} className="group relative" {...props}>
                <a
                  href={`#${id}`}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  #
                </a>
                {children}
              </h1>
            )
          },
          h2: ({ children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
            return (
              <h2 id={id} className="group relative" {...props}>
                <a
                  href={`#${id}`}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  #
                </a>
                {children}
              </h2>
            )
          },
          h3: ({ children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
            return (
              <h3 id={id} className="group relative" {...props}>
                <a
                  href={`#${id}`}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  #
                </a>
                {children}
              </h3>
            )
          },
          // Code blocks with syntax highlighting
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            return !inline ? (
              <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-lg overflow-x-auto p-4 my-6 shadow-lg border border-slate-800 dark:border-slate-700">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-blue-50 dark:bg-slate-800 text-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded text-sm font-medium"
                {...props}
              >
                {children}
              </code>
            )
          },
          // Tables with better styling
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <table
                className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-slate-50 dark:bg-slate-800" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody
              className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700"
              {...props}
            >
              {children}
            </tbody>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100" {...props}>
              {children}
            </td>
          ),
          // Blockquotes with better styling
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-blue-500 bg-blue-50 dark:bg-slate-800 pl-6 pr-6 py-4 my-6 rounded-r-lg italic text-slate-700 dark:text-slate-300"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Links with better styling
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              {...props}
            >
              {children}
            </a>
          ),
          // Lists with better spacing
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-2 my-4" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 my-4" {...props}>
              {children}
            </ol>
          ),
          // Images with responsive sizing
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-lg shadow-md my-4 max-w-full h-auto"
              {...props}
            />
          ),
          // Horizontal rules
          hr: ({ ...props }) => (
            <hr className="my-8 border-gray-300 dark:border-gray-700" {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
