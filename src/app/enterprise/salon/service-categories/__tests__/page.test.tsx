/**
 * Service Categories Page Tests
 *
 * Tests the core functionality of the service categories CRUD page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ServiceCategoriesPage from '../page'

// Mock the salon context
const mockSalonContext = {
  salonRole: 'owner',
  hasPermission: vi.fn(() => true),
  isAuthenticated: true,
  executeSecurely: vi.fn(),
  organization: { id: 'test-org', name: 'Test Salon' },
  user: { id: 'test-user', email: 'test@example.com' },
  isLoading: false
}

// Mock the universal entity hook
const mockUseUniversalEntity = {
  entities: [
    {
      id: 'cat-1',
      entity_name: 'Hair Services',
      dynamic_fields: {
        kind: { value: 'SERVICE' },
        name: { value: 'Hair Services' },
        code: { value: 'SRV-HAIR' },
        description: { value: 'All hair-related services' },
        display_order: { value: 1 },
        status: { value: 'active' },
        color_tag: { value: '#8B4513' }
      },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'cat-2',
      entity_name: 'Nail Services',
      dynamic_fields: {
        kind: { value: 'SERVICE' },
        name: { value: 'Nail Services' },
        code: { value: 'SRV-NAILS' },
        description: { value: 'Manicures and pedicures' },
        display_order: { value: 2 },
        status: { value: 'active' },
        color_tag: { value: '#FFD93D' }
      },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }
  ],
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  isCreating: false,
  isUpdating: false,
  isDeleting: false
}

// Mock dependencies
vi.mock('../SecuredSalonProvider', () => ({
  useSecuredSalonContext: () => mockSalonContext
}))

vi.mock('@/hooks/useUniversalEntity', () => ({
  useUniversalEntity: () => mockUseUniversalEntity
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}))

// Wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('ServiceCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title and description', async () => {
    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    expect(screen.getByText('Service Categories')).toBeInTheDocument()
    expect(
      screen.getByText('Organize your salon services for better discovery and reporting')
    ).toBeInTheDocument()
  })

  it('displays service categories in a grid', async () => {
    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Hair Services')).toBeInTheDocument()
      expect(screen.getByText('Nail Services')).toBeInTheDocument()
    })

    // Check category details
    expect(screen.getByText('Code: SRV-HAIR')).toBeInTheDocument()
    expect(screen.getByText('Code: SRV-NAILS')).toBeInTheDocument()
    expect(screen.getByText('All hair-related services')).toBeInTheDocument()
    expect(screen.getByText('Manicures and pedicures')).toBeInTheDocument()
  })

  it('shows create button for authorized users', () => {
    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument()
  })

  it('hides create button for unauthorized users', () => {
    const unauthorizedContext = {
      ...mockSalonContext,
      salonRole: 'stylist',
      hasPermission: vi.fn(() => false)
    }

    vi.mocked(require('../SecuredSalonProvider').useSecuredSalonContext).mockReturnValue(
      unauthorizedContext
    )

    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    expect(screen.queryByRole('button', { name: /new category/i })).not.toBeInTheDocument()
  })

  it('filters categories by search query', async () => {
    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    const searchInput = screen.getByPlaceholderText('Search categories...')

    fireEvent.change(searchInput, { target: { value: 'hair' } })

    await waitFor(() => {
      expect(screen.getByText('Hair Services')).toBeInTheDocument()
      expect(screen.queryByText('Nail Services')).not.toBeInTheDocument()
    })
  })

  it('filters categories by status', async () => {
    // Add an inactive category to the mock data
    const mockWithInactive = {
      ...mockUseUniversalEntity,
      entities: [
        ...mockUseUniversalEntity.entities,
        {
          id: 'cat-3',
          entity_name: 'Inactive Service',
          dynamic_fields: {
            kind: { value: 'SERVICE' },
            name: { value: 'Inactive Service' },
            status: { value: 'inactive' }
          },
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]
    }

    vi.mocked(require('@/hooks/useUniversalEntity').useUniversalEntity).mockReturnValue(
      mockWithInactive
    )

    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    // Should show all categories initially
    await waitFor(() => {
      expect(screen.getByText('Hair Services')).toBeInTheDocument()
      expect(screen.getByText('Inactive Service')).toBeInTheDocument()
    })

    // Filter to only active categories
    const statusSelect = screen.getByDisplayValue('All Status')
    fireEvent.click(statusSelect)

    const activeOption = screen.getByText('Active')
    fireEvent.click(activeOption)

    await waitFor(() => {
      expect(screen.getByText('Hair Services')).toBeInTheDocument()
      expect(screen.queryByText('Inactive Service')).not.toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    const loadingContext = {
      ...mockUseUniversalEntity,
      isLoading: true,
      entities: []
    }

    vi.mocked(require('@/hooks/useUniversalEntity').useUniversalEntity).mockReturnValue(
      loadingContext
    )

    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    // Should show loading skeletons
    const skeletons = screen.getAllByRole('generic')
    expect(skeletons.some(el => el.classList.contains('animate-pulse'))).toBe(true)
  })

  it('shows empty state when no categories found', async () => {
    const emptyContext = {
      ...mockUseUniversalEntity,
      entities: []
    }

    vi.mocked(require('@/hooks/useUniversalEntity').useUniversalEntity).mockReturnValue(
      emptyContext
    )

    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('No service categories found')).toBeInTheDocument()
      expect(screen.getByText('Create your first category to get started')).toBeInTheDocument()
    })
  })

  it('opens create modal when New Category button is clicked', async () => {
    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    const createButton = screen.getByRole('button', { name: /new category/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Create Service Category')).toBeInTheDocument()
    })
  })

  it('sorts categories by display order', async () => {
    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const categories = screen.getAllByText(/Services/)
      // Hair Services (order 1) should come before Nail Services (order 2)
      expect(categories[0]).toHaveTextContent('Hair Services')
      expect(categories[1]).toHaveTextContent('Nail Services')
    })
  })
})

describe('ServiceCategoriesPage Permission Tests', () => {
  it('allows create/edit/delete for owners', () => {
    const ownerContext = {
      ...mockSalonContext,
      salonRole: 'owner'
    }

    vi.mocked(require('../SecuredSalonProvider').useSecuredSalonContext).mockReturnValue(
      ownerContext
    )

    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument()
  })

  it('allows create/edit/delete for managers', () => {
    const managerContext = {
      ...mockSalonContext,
      salonRole: 'manager'
    }

    vi.mocked(require('../SecuredSalonProvider').useSecuredSalonContext).mockReturnValue(
      managerContext
    )

    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument()
  })

  it('restricts access for stylists', () => {
    const stylistContext = {
      ...mockSalonContext,
      salonRole: 'stylist',
      hasPermission: vi.fn(() => false)
    }

    vi.mocked(require('../SecuredSalonProvider').useSecuredSalonContext).mockReturnValue(
      stylistContext
    )

    render(
      <TestWrapper>
        <ServiceCategoriesPage />
      </TestWrapper>
    )

    expect(screen.queryByRole('button', { name: /new category/i })).not.toBeInTheDocument()
  })
})
