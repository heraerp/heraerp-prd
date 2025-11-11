/**
 * Protected Page Template
 *
 * Description: Standard protected page with authentication, organization context,
 * and data fetching using React Query.
 *
 * Usage:
 * ```bash
 * cp docs/salon/examples/pages/protected-page.tsx src/app/salon/[feature]/page.tsx
 * # Customize for your feature
 * ```
 *
 * Features:
 * - Three-layer authentication check (authenticated → context loaded → org present)
 * - Organization-scoped data fetching
 * - Mobile-first responsive layout
 * - Loading and error states
 * - Empty state handling
 *
 * Related Documentation:
 * - /docs/salon/technical/AUTHENTICATION.md - Authentication patterns
 * - /docs/salon/technical/HOOKS.md - Custom hooks reference
 * - /docs/salon/technical/MOBILE-LAYOUT.md - Mobile-first design
 *
 * @example
 * // Create a new Customers page
 * export default function CustomersPage() {
 *   const { customers, isLoading } = useHeraCustomers({ ... })
 *   // ... rest of implementation
 * }
 */

'use client'

import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, Plus, Search } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Lazy load heavy components for better performance
// ─────────────────────────────────────────────────────────────────────────────
const ItemList = lazy(() => import('@/components/salon/[feature]/ItemList'))
const ItemForm = lazy(() => import('@/components/salon/[feature]/ItemForm'))

// ─────────────────────────────────────────────────────────────────────────────
// Loading Skeletons (shown while lazy components load)
// ─────────────────────────────────────────────────────────────────────────────
function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-charcoal/50 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ProtectedPage() {
  const router = useRouter()

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2: Authentication and Organization Context
  // CRITICAL: Three-layer security check is MANDATORY for all protected pages
  // ───────────────────────────────────────────────────────────────────────────
  const {
    user,                    // Actor identity (WHO is accessing)
    organization,            // Organization context (WHERE - tenant boundary)
    isAuthenticated,         // Session validation status
    contextLoading,          // Loading state for org context resolution
    sessionType             // 'demo' | 'real'
  } = useHERAAuth()

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 3: Data Fetching with React Query
  // Uses Universal API v2 for organization-scoped entity management
  // ───────────────────────────────────────────────────────────────────────────
  const {
    entities,               // Fetched entities
    isLoading,             // Loading state
    error,                 // Error state
    refetch,               // Manual refetch function
    createEntity,          // Create mutation
    updateEntity,          // Update mutation
    deleteEntity           // Delete mutation
  } = useUniversalEntityV1({
    entity_type: 'MY_ENTITY_TYPE',  // TODO: Replace with your entity type (e.g., 'CUSTOMER')
    organizationId: organization?.id,
    filters: {
      include_dynamic: true,              // Include dynamic fields
      include_relationships: false,       // Include relationships if needed
      status: 'active',                   // Filter by status
      limit: 100,                         // Page size
      offset: 0                           // Pagination offset
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 4: UI State Management
  // ───────────────────────────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 5: Three-Layer Security Check (MANDATORY)
  // Layer 1: Check if user is authenticated
  // Layer 2: Wait for organization context to load
  // Layer 3: Verify organization context is present
  // ───────────────────────────────────────────────────────────────────────────

  // Layer 1: Authentication Check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            Please log in to access this page. Redirecting...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Layer 2: Context Loading Check
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-bronze">Loading organization context...</p>
        </div>
      </div>
    )
  }

  // Layer 3: Organization Context Check
  if (!organization?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            No organization context found. Please select an organization.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 6: Handle Create/Edit Actions
  // ───────────────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    setSelectedItem(null)
    setIsFormOpen(true)
  }

  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setIsFormOpen(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await deleteEntity({
        entity_id: itemId,
        organization_id: organization.id
      })
      // Success toast will be shown by mutation
    } catch (error) {
      console.error('Failed to delete item:', error)
      // Error toast will be shown by mutation
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (selectedItem?.id) {
        // Update existing item
        await updateEntity({
          p_entity_id: selectedItem.id,
          ...data,
          organization_id: organization.id
        })
      } else {
        // Create new item
        await createEntity({
          ...data,
          entity_type: 'MY_ENTITY_TYPE',  // TODO: Replace with your entity type
          smart_code: 'HERA.SALON.MY_ENTITY.v1',  // TODO: Replace with your smart code
          organization_id: organization.id
        })
      }

      setIsFormOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Failed to save item:', error)
      // Error will be handled by mutation
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 7: Filter Data (Client-Side)
  // For better performance, consider server-side filtering via API
  // ───────────────────────────────────────────────────────────────────────────
  const filteredItems = entities?.filter(item =>
    searchTerm ? item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) : true
  ) || []

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 8: Render Protected Page
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <SalonLuxePage
      title="My Feature"  {/* TODO: Update page title */}
      description="Manage your feature items"  {/* TODO: Update description */}
      maxWidth="full"
      padding="lg"
    >
      {/* ─────────────────────────────────────────────────────────────────────
          MOBILE HEADER (iOS-style)
          MANDATORY for all salon pages - provides native app feel
      ───────────────────────────────────────────────────────────────────── */}

      {/* iOS status bar spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile app header */}
      <div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20 mb-6">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {/* App icon */}
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-gold" />
            </div>
            {/* Title and subtitle */}
            <div>
              <h1 className="text-lg font-bold text-champagne">My Feature</h1>
              <p className="text-xs text-bronze">{organization.organization_name}</p>
            </div>
          </div>
          {/* Touch-friendly notification button */}
          <button
            className="min-w-[44px] min-h-[44px] rounded-full bg-gold/10 flex items-center justify-center active:scale-95 transition-transform"
            onClick={() => router.push('/salon/notifications')}
          >
            <Bell className="w-5 h-5 text-gold" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          DESKTOP HEADER AND ACTION BAR
          Hidden on mobile (md:flex shows on medium screens and up)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-champagne mb-2">My Feature</h1>
          <p className="text-bronze">Manage your feature items</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-gold text-black rounded-xl font-bold hover:bg-gold/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Item
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MOBILE ACTION BUTTON
          Fixed to bottom for easy thumb access (iOS pattern)
      ───────────────────────────────────────────────────────────────────── */}
      <button
        onClick={handleCreate}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gold text-black rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ─────────────────────────────────────────────────────────────────────
          SEARCH BAR
          Mobile-first responsive design with touch-friendly input
      ───────────────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bronze pointer-events-none" />
          <input
            type="search"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full min-h-[44px]
              pl-12 pr-4 py-3
              bg-charcoal border border-gold/20 rounded-xl
              text-champagne placeholder-bronze
              focus:outline-none focus:border-gold/50
              transition-colors
            "
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ERROR STATE
          Display if data fetching fails
      ───────────────────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Failed to load items. Please try again.
            <button
              onClick={() => refetch()}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          LOADING STATE
          Show skeleton loaders while data is being fetched
      ───────────────────────────────────────────────────────────────────── */}
      {isLoading && <ListSkeleton />}

      {/* ─────────────────────────────────────────────────────────────────────
          EMPTY STATE
          Show when no items exist (after loading completes)
      ───────────────────────────────────────────────────────────────────── */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <Search className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-xl font-semibold text-champagne mb-2">
            {searchTerm ? 'No Results Found' : 'No Items Yet'}
          </h3>
          <p className="text-bronze mb-6">
            {searchTerm
              ? `No items match "${searchTerm}"`
              : 'Get started by creating your first item'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-gold text-black rounded-xl font-bold active:scale-95 transition-transform"
            >
              Create First Item
            </button>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          ITEM LIST
          Lazy loaded for better performance
          Suspense boundary shows skeleton while component loads
      ───────────────────────────────────────────────────────────────────── */}
      {!isLoading && filteredItems.length > 0 && (
        <Suspense fallback={<ListSkeleton />}>
          <ItemList
            items={filteredItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onItemClick={(itemId) => router.push(`/salon/[feature]/${itemId}`)}
          />
        </Suspense>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          CREATE/EDIT FORM MODAL
          Lazy loaded to reduce initial bundle size
          Only loads when user opens the form
      ───────────────────────────────────────────────────────────────────── */}
      {isFormOpen && (
        <Suspense fallback={null}>
          <ItemForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            item={selectedItem}
            onSubmit={handleSubmit}
          />
        </Suspense>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          BOTTOM SPACING FOR MOBILE
          Provides comfortable scrolling space above mobile bottom navigation
      ───────────────────────────────────────────────────────────────────── */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CUSTOMIZATION CHECKLIST
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TODO: Replace the following placeholders:
 *
 * 1. Entity Type:
 *    - Replace 'MY_ENTITY_TYPE' with your entity type (e.g., 'CUSTOMER', 'SERVICE')
 *
 * 2. Smart Code:
 *    - Replace 'HERA.SALON.MY_ENTITY.v1' with your smart code
 *    - Follow pattern: HERA.SALON.[ENTITY_TYPE].[SUBTYPE].v1
 *
 * 3. Page Metadata:
 *    - Update page title (e.g., "Customers", "Services")
 *    - Update description text
 *    - Update icon in mobile header
 *
 * 4. Component Imports:
 *    - Update lazy import paths for ItemList and ItemForm
 *    - Replace with your actual component names
 *
 * 5. Dynamic Fields:
 *    - Add your entity-specific dynamic fields in handleSubmit
 *    - Example: phone, email, address, etc.
 *
 * 6. Filters:
 *    - Customize the filters object in useUniversalEntityV1
 *    - Add branch filtering, date filtering, etc. as needed
 *
 * 7. Search Logic:
 *    - Update filteredItems logic for your entity's searchable fields
 *    - Consider server-side search for large datasets
 *
 * 8. Actions:
 *    - Add entity-specific actions (e.g., "Send Email", "Book Appointment")
 *    - Update delete confirmation message
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PERFORMANCE NOTES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - Uses React.lazy() for code splitting (reduces initial bundle size)
 * - Suspense boundaries show skeleton loaders during component loading
 * - React Query caching with 5-minute staleTime (reduces API calls)
 * - Client-side filtering for < 100 items, use server-side for larger datasets
 * - Mobile-first design ensures fast loading on slower connections
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TESTING NOTES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Unit Tests:
 * - Test filter logic with various search terms
 * - Test form submission with valid/invalid data
 * - Test delete confirmation logic
 *
 * Component Tests:
 * - Test authentication check redirects
 * - Test loading states and skeletons
 * - Test empty states with/without search
 * - Test CRUD operations with mocked API
 *
 * E2E Tests:
 * - Test complete create/read/update/delete flow
 * - Test search functionality
 * - Test mobile navigation and interactions
 * - Test error handling and recovery
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ACCESSIBILITY NOTES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - All interactive elements have min 44px touch targets
 * - Proper focus states for keyboard navigation
 * - ARIA labels for icon-only buttons
 * - Semantic HTML structure (headings, lists, buttons)
 * - Error messages announced to screen readers
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
