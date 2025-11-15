'use client'
import React from 'react'
import Link from 'next/link'
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
export const NavigationLink = forwardRef<HTMLAnchorElement, Props>(
  ({ href, children, ...rest }, ref) => (
    <Link href={href} {...rest} ref={ref as any}>
      {children}
    </Link>
  )
)
NavigationLink.displayName = 'NavigationLink'
export default NavigationLink
