import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CategoriesPage from '@/features/product/categories/CategoriesPage'

vi.mock('@/hooks/useHeraProductCategories', () => ({
  useHeraProductCategories: () => ({
    categories: [
      {
        id: 'cat-1',
        entity_name: 'Hair Care',
        entity_code: 'CAT-HAIR',
        status: 'active',
        smart_code: 'HERA.SALON.PROD.CATEGORY.HAIRCARE.V1',
        description: 'Retail shampoos and conditioners',
        color: '#D4AF37',
        icon: 'Tag',
        sort_order: 1,
        product_count: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    isLoading: false,
    error: null,
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    archiveCategory: vi.fn(),
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isArchiving: false
  })
}))

vi.mock('@/components/salon/ui/StatusToastProvider', () => ({
  StatusToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSalonToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showLoading: vi.fn(() => 'toast-id'),
    removeToast: vi.fn()
  })
}))

vi.mock('@/app/salon/SalonProvider', () => ({
  useSalonContext: () => ({ organizationId: 'org-123' })
}))

vi.mock('@/components/auth/HERAAuthProvider', () => ({
  useHERAAuth: () => ({ organization: { id: 'org-123' } })
}))

describe('Product categories route', () => {
  it('renders page chrome with actions', () => {
    render(<CategoriesPage />)

    expect(
      screen.getByRole('heading', { name: /Product Categories/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /New category/i })
    ).toBeInTheDocument()
  })
})
