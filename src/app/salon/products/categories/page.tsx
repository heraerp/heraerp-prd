import type { Metadata } from 'next'
import CategoriesPage from '@/features/product/categories/CategoriesPage'

export const metadata: Metadata = {
  title: 'Product Categories (Legacy) | HERA',
  robots: {
    index: false,
    follow: true
  }
}

export default function SalonProductsCategoriesPage() {
  return <CategoriesPage />
}
