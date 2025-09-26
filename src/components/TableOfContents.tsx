'use client'

import { useEffect, useState } from 'react'

interface TOCProps {
  content: string
  className?: string
}

interface Heading {
  id: string
  text: string
  level: number
}

export default function TableOfContents({ content, className = '' }: TOCProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from markdown content
    const headingMatches = content.match(/^##+ .+$/gm) || []
    const extractedHeadings: Heading[] = headingMatches.map((heading, index) => {
      const level = heading.match(/^#+/)?.[0].length || 2
      const text = heading.replace(/^#+\s+/, '')
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      return { id, text, level }
    })

    setHeadings(extractedHeadings)
  }, [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-20% 0% -70% 0%'
      }
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className={`${className}`}>
      <h3 className="mb-4 font-semibold text-gray-900">In this article</h3>
      <ul className="space-y-2 border-l-2 border-gray-200">
        {headings.map(({ id, text, level }) => (
          <li key={id} style={{ paddingLeft: `${(level - 2) * 0.75}rem` }}>
            <a
              href={`#${id}`}
              className={`
                block py-1 pl-4 text-sm transition-colors
                hover:text-blue-600
                ${
                  activeId === id
                    ? 'border-l-2 -ml-[2px] border-blue-600 text-blue-600 font-medium'
                    : 'text-gray-600'
                }
              `}
              onClick={e => {
                e.preventDefault()
                document.getElementById(id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                })
              }}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
