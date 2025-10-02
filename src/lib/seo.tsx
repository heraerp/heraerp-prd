import React from 'react'

export function canonical(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://heraerp.com'
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export function jsonLdScript(data: unknown) {
  const json = JSON.stringify(data)
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}