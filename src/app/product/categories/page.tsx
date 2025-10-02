import type { Metadata } from 'next'
import CategoriesPage from '@/features/product/categories/CategoriesPage'

export const metadata: Metadata = {
  title: 'Product Categories | HERA',
  description: 'Manage salon product categories with Universal API v2 guardrails.',
  alternates: {
    canonical: '/product/categories'
  }
}

export default function ProductCategoriesPage() {
  return <CategoriesPage />
}
