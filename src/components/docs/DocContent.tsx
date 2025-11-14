'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

interface DocContentProps {
  content: string
  tableOfContents?: TableOfContentsItem[]
  className?: string
}

export default function DocContent({ content, tableOfContents, className }: DocContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Generate table of contents from content if not provided
  useEffect(() => {
    if (!contentRef.current) return

    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const toc: TableOfContentsItem[] = []

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      const id = heading.id || `heading-${index}`
      const title = heading.textContent || ''

      // Add ID if it doesn't exist
      if (!heading.id) {
        heading.id = id
      }

      toc.push({ id, title, level })
    })

    // Update table of contents in sidebar
    const tocContainer = document.getElementById('toc-container')
    if (tocContainer && (tableOfContents || toc.length > 0)) {
      const tocItems = tableOfContents || toc
      tocContainer.innerHTML = tocItems
        .map(
          item => `
        <div class="toc-item level-${item.level}">
          <a 
            href="#${item.id}" 
            class="block py-1 text-xs hover:text-hera-primary transition-colors ${
              item.level === 1
                ? 'font-medium'
                : item.level === 2
                  ? 'ml-2'
                  : item.level === 3
                    ? 'ml-4'
                    : 'ml-6'
            }"
          >
            ${item.title}
          </a>
        </div>
      `
        )
        .join('')

      // Add smooth scrolling to TOC links
      const tocLinks = tocContainer.querySelectorAll('a[href^="#"]')
      tocLinks.forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault()
          const targetId = link.getAttribute('href')?.substring(1)
          const targetElement = document.getElementById(targetId || '')
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            })
          }
        })
      })
    }
  }, [content, tableOfContents])

  // Add syntax highlighting and other content enhancements
  useEffect(() => {
    if (!contentRef.current) return

    // Add copy buttons to code blocks
    const codeBlocks = contentRef.current.querySelectorAll('pre code')
    codeBlocks.forEach(block => {
      const pre = block.parentElement
      if (!pre || pre.querySelector('.copy-button')) return

      const copyButton = document.createElement('button')
      copyButton.className =
        'copy-button absolute top-2 right-2 px-2 py-1 text-xs bg-background border rounded hover:bg-accent transition-colors'
      copyButton.textContent = 'Copy'
      copyButton.onclick = async () => {
        try {
          await navigator.clipboard.writeText(block.textContent || '')
          copyButton.textContent = 'Copied!'
          setTimeout(() => {
            copyButton.textContent = 'Copy'
          }, 2000)
        } catch (err) {
          console.error('Failed to copy:', err)
        }
      }

      pre.style.position = 'relative'
      pre.appendChild(copyButton)
    })

    // Add link icons to headings
    const headings = contentRef.current.querySelectorAll(
      'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'
    )
    headings.forEach(heading => {
      if (heading.querySelector('.heading-link')) return

      const link = document.createElement('a')
      link.className =
        'heading-link opacity-0 group-hover:opacity-100 ml-2 text-muted-foreground hover:text-hera-primary transition-opacity'
      link.href = `#${heading.id}`
      link.innerHTML = '#'

      heading.classList.add('group')
      heading.appendChild(link)
    })

    // Add external link indicators
    const externalLinks = contentRef.current.querySelectorAll('a[href^="http"]')
    externalLinks.forEach(link => {
      if (!link.querySelector('.external-icon')) {
        link.classList.add('inline-flex', 'items-center', 'gap-1')
        const icon = document.createElement('span')
        icon.className = 'external-icon text-muted-foreground'
        icon.innerHTML = '↗'
        link.appendChild(icon)
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
      }
    })
  }, [content])

  return (
    <div
      ref={contentRef}
      className={cn(
        'prose prose-slate dark:prose-invert max-w-none',
        'prose-headings:scroll-mt-20',
        'prose-h1:text-3xl prose-h1:font-bold prose-h1:text-hera-primary',
        'prose-h2:text-2xl prose-h2:font-semibold prose-h2:text-foreground prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4',
        'prose-h3:text-xl prose-h3:font-semibold prose-h3:text-foreground prose-h3:mt-6 prose-h3:mb-3',
        'prose-p:text-muted-foreground prose-p:leading-7',
        'prose-a:text-hera-primary prose-a:no-underline hover:prose-a:underline',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-code:text-hera-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
        'prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto',
        'prose-blockquote:border-l-4 prose-blockquote:border-hera-primary prose-blockquote:bg-hera-primary/5 prose-blockquote:p-4 prose-blockquote:rounded-r',
        'prose-ul:text-muted-foreground prose-ol:text-muted-foreground',
        'prose-li:text-muted-foreground prose-li:my-1',
        'prose-table:text-sm',
        'prose-th:bg-muted prose-th:font-semibold prose-th:text-foreground prose-th:p-3',
        'prose-td:p-3 prose-td:border-t prose-td:text-muted-foreground',
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
