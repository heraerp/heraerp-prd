// server component (no "use client")
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Product Categories (Legacy) | HERA',
  robots: { index: false, follow: false },
}

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}