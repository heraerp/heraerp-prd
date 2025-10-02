# Salon Services Testing Guide - Phase 4

**Date:** 2025-10-01
**Status:** Ready for Testing
**Purpose:** Comprehensive testing checklist for /salon/services implementation

---

## 🎯 Testing Overview

This guide covers all testing requirements for the complete salon services implementation following the Universal API v2 pattern.

### Implementation Completed:
- ✅ **Phase 1:** TypeScript types + Universal API v2 hooks
- ✅ **Phase 2:** All UI components (ServiceCategoryModal, ServiceModal, ServiceList)
- ✅ **Phase 3:** Main services page with complete CRUD
- 🧪 **Phase 4:** Testing & validation (THIS PHASE)

---

## 🧪 Testing Categories

### 1. Basic Page Load Testing

**URL:** `http://localhost:3000/salon/services`

**Pre-requisites:**
- Dev server running: `npm run dev`
- Logged in with valid session
- Organization context available
- Test data seeded (services + categories)

**Checks:**
- [ ] Page loads without errors
- [ ] PageHeader displays with breadcrumbs (HERA > SALON OS > Services)
- [ ] Search input visible in header
- [ ] "New Category" button visible
- [ ] "New Service" button visible
- [ ] No console errors on initial load

---

### 2. Categories Section Testing

**Feature:** Category pills with service counts, edit/delete functionality

#### Create Category Tests:
- [ ] Click "New Category" button
- [ ] Category modal opens
- [ ] Enter category name (e.g., "Hair Services")
- [ ] Select color from dropdown
- [ ] Color preview updates in real-time
- [ ] Enter description
- [ ] Click "Create Category"
- [ ] Success toast notification appears
- [ ] Category pill appears with correct color
- [ ] Modal closes automatically

#### Edit Category Tests:
- [ ] Click on existing category pill
- [ ] Category modal opens with pre-filled data
- [ ] Modify category name
- [ ] Change category color
- [ ] Update description
- [ ] Click "Update Category"
- [ ] Success toast notification
- [ ] Category pill updates with new color/name

#### Delete Category Tests:
- [ ] Hover over category pill - delete icon (X) appears
- [ ] Click delete icon on category with NO services
- [ ] Confirmation dialog appears
- [ ] Click "Delete"
- [ ] Success toast notification
- [ ] Category pill disappears

**Delete Protection Test:**
- [ ] Click delete icon on category WITH services
- [ ] Confirmation dialog shows warning message
- [ ] Message: "This category has X service(s). Please reassign or delete those services first."
- [ ] Only "Cancel" button available (no delete button)
- [ ] Category NOT deleted
- [ ] Delete protection working correctly

#### Service Count Tests:
- [ ] Categories show correct service counts
- [ ] Create new service in category
- [ ] Service count increments automatically
- [ ] Delete service from category
- [ ] Service count decrements automatically

---

### 3. Stats Cards Testing

**Feature:** 4 stats cards showing Total, Active, Revenue Potential, Avg Duration

#### Stats Display Tests:
- [ ] **Total Services card:** Displays correct count of all services
- [ ] **Active Services card:** Displays only active services (green color)
- [ ] **Revenue Potential card:** Shows sum of all service prices with currency (gold color)
- [ ] **Avg Duration card:** Shows average duration with Clock icon (purple color)

#### Stats Update Tests:
- [ ] Create new service → Total Services increments
- [ ] Create active service → Active Services increments
- [ ] Service with price AED 100 → Revenue Potential increases by 100
- [ ] Archive service → Active Services decrements
- [ ] Delete service → Total Services decrements

#### Duration Formatting Tests:
- [ ] Service with 30 minutes → Shows "30m"
- [ ] Service with 60 minutes → Shows "1h"
- [ ] Service with 90 minutes → Shows "1h 30m"
- [ ] Service with 120 minutes → Shows "2h"
- [ ] Average duration calculates correctly

---

### 4. Service Modal Testing

**Feature:** Create/Edit service with all fields including duration, commission, negative margin warnings

#### Create Service Tests:
- [ ] Click "New Service" button
- [ ] Service modal opens
- [ ] All fields visible:
  - [ ] Service name
  - [ ] Service code
  - [ ] Category dropdown
  - [ ] Price field with currency
  - [ ] Cost field with currency
  - [ ] Duration field (minutes)
  - [ ] Commission amount
  - [ ] Commission type (fixed/percentage)
  - [ ] Requires booking toggle
  - [ ] Description textarea
  - [ ] Status dropdown

#### Field Validation Tests:
- [ ] Submit with empty name → Validation error
- [ ] Submit with empty code → Validation error
- [ ] Enter non-numeric price → Validation error
- [ ] Enter negative duration → Validation error

#### Negative Margin Warning Tests:
- [ ] Enter Cost: AED 150
- [ ] Enter Price: AED 100
- [ ] Warning banner appears (red border)
- [ ] Message: "Cost price (AED 150.00) is higher than selling price (AED 100.00)"
- [ ] Shows loss amount and percentage
- [ ] Can still save (warning only)

#### Duration Input Tests:
- [ ] Enter duration: 30 → Shows "30 minutes" suffix
- [ ] Enter duration: 60 → Format updates correctly
- [ ] Enter duration: 90 → Format updates correctly

#### Commission Tests:
- [ ] Select commission type: "Fixed"
- [ ] Enter commission amount: AED 20
- [ ] Save service → Commission saved correctly
- [ ] Select commission type: "Percentage"
- [ ] Enter commission amount: 15
- [ ] Save service → Commission saved as percentage

#### Category Dropdown Tests:
- [ ] Category dropdown shows all categories
- [ ] Categories display with correct colors
- [ ] Select category → Service assigned to category
- [ ] Category service count updates

#### Save Service Tests:
- [ ] Fill all required fields
- [ ] Click "Create Service"
- [ ] Loading state shows briefly
- [ ] Success toast notification
- [ ] Modal closes
- [ ] Service appears in list
- [ ] Stats cards update

#### Edit Service Tests:
- [ ] Click Edit on existing service (list view action menu)
- [ ] Modal opens with all fields pre-filled
- [ ] Modify service name
- [ ] Change price
- [ ] Update duration
- [ ] Click "Update Service"
- [ ] Success toast notification
- [ ] Service updates in list
- [ ] Stats cards recalculate

---

### 5. Service List Testing

**Feature:** Grid/List view modes with filtering, sorting, CRUD actions

#### View Mode Tests:
- [ ] Default view is Grid
- [ ] Click List icon → Switches to list view
- [ ] Click Grid icon → Switches back to grid view
- [ ] Active view mode icon is highlighted
- [ ] View preference persists during session

#### Grid View Tests:
- [ ] Services displayed as cards (4 columns on desktop)
- [ ] Each card shows:
  - [ ] Service name
  - [ ] Category badge with color
  - [ ] Price with currency
  - [ ] Duration with Clock icon
  - [ ] "Booking Required" badge (if applicable)
  - [ ] Margin percentage (if cost available)
  - [ ] Action buttons (Edit, Archive, Delete)
- [ ] Cards have consistent sizing
- [ ] Hover effect on cards

#### List View Tests:
- [ ] Services displayed in table
- [ ] Table columns:
  - [ ] Service Name
  - [ ] Code
  - [ ] Category (with color badge)
  - [ ] Price
  - [ ] Cost
  - [ ] Margin %
  - [ ] Duration (with Clock icon)
  - [ ] Commission
  - [ ] Status
  - [ ] Actions
- [ ] Rows have zebra striping
- [ ] Hover effect on rows
- [ ] All data displays correctly

#### Empty State Tests:
- [ ] Delete all services
- [ ] Empty state message appears
- [ ] Call-to-action button visible
- [ ] Click CTA → Service modal opens

#### Loading State Tests:
- [ ] Initial page load shows loading spinner
- [ ] Loading state has correct styling
- [ ] Loading text: "Loading services..."

---

### 6. Filtering & Search Testing

**Feature:** Active/All tabs, category filter, search query

#### Active/All Tabs Tests:
- [ ] Default tab: "Active"
- [ ] Shows only active services
- [ ] Click "All Services" tab
- [ ] Shows all services (including archived)
- [ ] Stats cards update accordingly
- [ ] Service counts match displayed services

#### Category Filter Tests:
- [ ] Click "Filter" button
- [ ] Filter panel expands
- [ ] Category filter dropdown visible
- [ ] Select category → Only services from that category shown
- [ ] Filter indicator shows active filter
- [ ] Clear filter → All services shown again

#### Search Tests:
- [ ] Enter text in search field (header)
- [ ] Services filtered by name match
- [ ] Search is case-insensitive
- [ ] Partial matches work (e.g., "cut" matches "Haircut")
- [ ] Clear search → All services shown
- [ ] Search works with category filter simultaneously

---

### 7. Sorting Testing

**Feature:** Sort by name, duration, price

#### Sort Options Tests:
- [ ] Sort dropdown shows options:
  - [ ] Name (A-Z)
  - [ ] Name (Z-A)
  - [ ] Duration (Shortest)
  - [ ] Duration (Longest)
  - [ ] Price (Low to High)
  - [ ] Price (High to Low)

#### Sort Functionality Tests:
- [ ] Select "Name (A-Z)" → Services sorted alphabetically ascending
- [ ] Select "Name (Z-A)" → Services sorted alphabetically descending
- [ ] Select "Duration (Shortest)" → Services sorted by duration ascending
- [ ] Select "Duration (Longest)" → Services sorted by duration descending
- [ ] Select "Price (Low to High)" → Services sorted by price ascending
- [ ] Select "Price (High to Low)" → Services sorted by price descending
- [ ] Sort persists during session

---

### 8. CRUD Operations Testing

**Feature:** Complete Create, Read, Update, Delete, Archive, Restore

#### Archive Service Tests:
- [ ] Click Archive on active service (action menu)
- [ ] Confirmation dialog appears
- [ ] Click "Archive"
- [ ] Success toast notification
- [ ] Service status changes to "archived"
- [ ] Service disappears from Active tab
- [ ] Service visible in All Services tab
- [ ] Active Services count decrements

#### Restore Service Tests:
- [ ] Switch to "All Services" tab
- [ ] Find archived service
- [ ] Click Restore (action menu)
- [ ] Confirmation dialog appears
- [ ] Click "Restore"
- [ ] Success toast notification
- [ ] Service status changes to "active"
- [ ] Service appears in Active tab
- [ ] Active Services count increments

#### Delete Service Tests:
- [ ] Click Delete on service (action menu)
- [ ] Confirmation dialog appears
- [ ] Dialog shows service name for confirmation
- [ ] Click "Cancel" → Dialog closes, service not deleted
- [ ] Click Delete again
- [ ] Click "Delete" → Deletion proceeds
- [ ] Loading state during deletion
- [ ] Success toast notification
- [ ] Service completely removed
- [ ] Stats cards update
- [ ] Category service count decrements

---

### 9. Toast Notification Testing

**Feature:** StatusToastProvider with success, error, loading states

#### Success Toasts:
- [ ] Create service → Green toast with checkmark
- [ ] Update service → Success message with service name
- [ ] Delete service → Success confirmation
- [ ] Archive service → Success message
- [ ] Restore service → Success message
- [ ] Create category → Success message
- [ ] Update category → Success message
- [ ] Delete category → Success message

#### Error Toasts:
- [ ] API error during create → Red toast with error message
- [ ] Network error → Error toast with retry option
- [ ] Validation error → Error toast with specific field
- [ ] Permission error → Error toast

#### Loading Toasts:
- [ ] Create/Update service → "Saving..." toast appears
- [ ] Delete service → "Deleting..." toast appears
- [ ] Loading toast automatically replaced by success/error toast
- [ ] Loading state doesn't stack multiple toasts

#### Toast Behavior:
- [ ] Toasts auto-dismiss after 3 seconds
- [ ] Can manually dismiss toast with X button
- [ ] Multiple toasts stack vertically
- [ ] Toasts appear in top-right corner

---

### 10. Theme & Styling Testing

**Feature:** Salon luxe theme with gold, champagne, bronze colors

#### Color Consistency:
- [ ] Page background: Gradient from gray-900 via gray-800 to gray-900
- [ ] PageHeader: Gold gradient background
- [ ] Stats cards: Charcoal background with bronze borders
- [ ] Category pills: Category color with transparency
- [ ] Buttons: Gold gradient for primary actions
- [ ] Modal backgrounds: Charcoal with subtle shadows
- [ ] Text colors: Champagne for headings, light text for body

#### Dark Mode:
- [ ] All text is readable (no black on black)
- [ ] Contrast ratios meet WCAG standards
- [ ] Icons have proper color contrast
- [ ] Hover states are visible
- [ ] Focus states have visible outlines

#### Typography:
- [ ] Headings use correct font weights (semibold, bold)
- [ ] Body text is legible (14px minimum)
- [ ] Stat values are large and prominent (text-2xl)
- [ ] Consistency across all components

---

### 11. Responsive Design Testing

**Feature:** Mobile, tablet, desktop layouts

#### Mobile (375px - 767px):
- [ ] PageHeader stacks vertically
- [ ] Search field full width
- [ ] Action buttons stack or use dropdown
- [ ] Category pills wrap correctly
- [ ] Stats cards stack in single column (grid-cols-1)
- [ ] Grid view uses single column
- [ ] List view becomes card-like on mobile
- [ ] Modals are full-screen or near-full-screen
- [ ] Touch targets are at least 44x44px
- [ ] No horizontal scrolling

#### Tablet (768px - 1023px):
- [ ] Stats cards use 2 columns (grid-cols-2)
- [ ] Grid view uses 2 columns
- [ ] PageHeader has compact layout
- [ ] Modals have max-width constraint
- [ ] Content is well-spaced

#### Desktop (1024px+):
- [ ] Stats cards use 4 columns (grid-cols-4)
- [ ] Grid view uses 3-4 columns based on screen width
- [ ] Full table layout in list view
- [ ] Optimal spacing and padding
- [ ] No wasted space

---

### 12. Performance Testing

**Feature:** Large dataset handling, query optimization

#### Load Time Tests:
- [ ] Page loads in under 2 seconds (with 10 services)
- [ ] Page loads in under 5 seconds (with 100+ services)
- [ ] No lag during initial render
- [ ] Smooth scrolling

#### Query Optimization:
- [ ] useHeraServices hook uses React Query caching
- [ ] Data fetched only once per session
- [ ] Mutations invalidate cache correctly
- [ ] No unnecessary re-fetches

#### Large Dataset Tests:
- [ ] Create 100+ test services
- [ ] Grid view renders without lag
- [ ] List view table renders smoothly
- [ ] Filtering is instant (< 100ms)
- [ ] Sorting is instant (< 100ms)
- [ ] Search is instant (< 100ms)

#### Memory Tests:
- [ ] No memory leaks during CRUD operations
- [ ] Browser memory usage stays reasonable
- [ ] No console warnings about memory

---

### 13. Multi-Organization Testing

**Feature:** Organization isolation, context switching

#### Organization Context Tests:
- [ ] Services filtered by current organization
- [ ] No data leakage between organizations
- [ ] Currency displays correctly per organization
- [ ] Organization switching updates services list
- [ ] Stats recalculate for new organization

#### Currency Tests:
- [ ] AED organization shows "AED" prefix
- [ ] USD organization shows "USD" prefix
- [ ] INR organization shows "INR" prefix
- [ ] EUR organization shows "EUR" prefix
- [ ] Currency updates dynamically on organization switch

---

### 14. Cache Invalidation Testing

**Feature:** React Query cache management

#### Cache Tests:
- [ ] Create service → Services list updates immediately
- [ ] Update service → Changes reflect without refresh
- [ ] Delete service → Service removed from list immediately
- [ ] Archive service → Service moves to archived immediately
- [ ] Create category → Category appears in dropdown immediately
- [ ] Update category → Category updates everywhere
- [ ] Delete category → Category removed immediately

#### Manual Refresh Tests:
- [ ] Reload page → Fresh data loaded
- [ ] No stale data displayed
- [ ] Cache invalidates on mutations

---

### 15. Error Handling Testing

**Feature:** Graceful error handling with user feedback

#### API Error Tests:
- [ ] Network disconnected → Error banner appears
- [ ] 500 server error → Error toast with message
- [ ] 401 unauthorized → Redirect to login
- [ ] 403 forbidden → Permission error toast
- [ ] 404 not found → Resource not found message

#### Validation Error Tests:
- [ ] Invalid form data → Field-specific errors
- [ ] Required fields empty → Validation messages
- [ ] Invalid data types → Type error messages

#### Edge Cases:
- [ ] Delete last service → Empty state shows
- [ ] Filter with no results → "No services match" message
- [ ] Search with no results → "No services found" message
- [ ] Delete last category → Services become uncategorized

---

## 🎯 Testing Checklist Summary

### Quick Verification (15 minutes):
1. [ ] Page loads without errors
2. [ ] Can create service
3. [ ] Can create category
4. [ ] Stats cards display correctly
5. [ ] Grid/List view switching works
6. [ ] Can edit service
7. [ ] Can delete service
8. [ ] Category delete protection works

### Full Testing (2-3 hours):
- [ ] All Category tests (Create, Edit, Delete, Protection)
- [ ] All Stats tests (Display, Updates, Duration formatting)
- [ ] All Service Modal tests (Create, Edit, Validation, Warnings)
- [ ] All Service List tests (Grid, List, Empty state)
- [ ] All Filtering tests (Active/All, Category, Search)
- [ ] All Sorting tests (Name, Duration, Price)
- [ ] All CRUD tests (Archive, Restore, Delete)
- [ ] All Toast tests (Success, Error, Loading)
- [ ] All Theme tests (Colors, Dark mode, Typography)
- [ ] All Responsive tests (Mobile, Tablet, Desktop)
- [ ] All Performance tests (Load time, Large dataset)
- [ ] All Multi-org tests (Context, Currency)
- [ ] All Cache tests (Invalidation, Refresh)
- [ ] All Error tests (API, Validation, Edge cases)

---

## 🐛 Known Issues & Limitations

**Current Implementation:**
- No known issues at this time

**Future Enhancements:**
- [ ] Bulk operations (archive multiple, delete multiple)
- [ ] Import/export services (CSV)
- [ ] Service templates
- [ ] Advanced filtering (by price range, duration range)
- [ ] Service analytics dashboard
- [ ] Print-friendly view

---

## 📊 Success Criteria

**Phase 4 is complete when:**
- ✅ All 15 testing categories pass
- ✅ No critical bugs identified
- ✅ Performance benchmarks met
- ✅ Responsive design validated on 3+ devices
- ✅ Multi-organization isolation verified
- ✅ Cache invalidation working correctly
- ✅ Error handling graceful
- ✅ Toast notifications consistent
- ✅ Theme styling matches design system
- ✅ Production-ready code quality

---

**Last Updated:** 2025-10-01
**Estimated Testing Time:** 2-3 hours for complete validation
**Next Step:** Execute testing checklist and document results
