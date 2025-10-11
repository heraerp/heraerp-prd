'use client'
import Link from 'next/link'
import { forwardRef, AnchorHTMLAttributes } from 'react'
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
