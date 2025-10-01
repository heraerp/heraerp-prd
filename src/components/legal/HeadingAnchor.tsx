import React from 'react'

interface HeadingAnchorProps {
  as?: 'h2' | 'h3'
  id: string
  children: React.ReactNode
}

export default function HeadingAnchor({ as = 'h2', id, children }: HeadingAnchorProps) {
  const Tag = as
  const sizeClasses = as === 'h2' ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'

  return (
    <Tag id={id} className={`group scroll-mt-24 ink font-semibold ${sizeClasses} mb-4 mt-8`}>
      <a href={`#${id}`} className="no-underline hover:no-underline">
        <span className="align-middle">{children}</span>
        <span
          aria-hidden
          className="ml-2 opacity-0 group-hover:opacity-100 ink-muted transition-opacity duration-200"
        >
          #
        </span>
      </a>
    </Tag>
  )
}
