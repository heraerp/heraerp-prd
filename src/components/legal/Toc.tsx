"use client"

import React, { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: 'h2' | 'h3'
}

interface TocProps {
  sections: TocItem[]
}

export default function Toc({ sections }: TocProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      }
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      sections.forEach(({ id }) => {
        const element = document.getElementById(id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [sections])

  return (
    <nav className="space-y-1">
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider ink-muted">
        On This Page
      </h4>
      <ul className="space-y-2">
        {sections.map((section) => (
          <li
            key={section.id}
            className={section.level === 'h3' ? 'ml-4' : ''}
          >
            <a
              href={`#${section.id}`}
              className={`
                block py-1 text-sm transition-colors duration-200
                ${
                  activeId === section.id
                    ? 'ink font-medium'
                    : 'ink-muted hover:ink'
                }
              `}
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById(section.id)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              {section.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}