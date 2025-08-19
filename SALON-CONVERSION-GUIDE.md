# Salon Progressive to Production Conversion Guide

## ✅ Completed Conversions

### 1. Customers Page
- **Status**: ✅ Fully converted and tested
- **Location**: `/src/app/salon/customers/page.tsx`
- **Features**: Complete CRUD, search, filtering, loyalty tiers
- **Test Data**: 8 customers with full relationships

### 2. Staff/Employees Page  
- **Status**: ✅ Framework generated
- **Generated Files**:
  - Hook: `/src/hooks/useEmployee.ts`
  - Transformer: `/src/lib/transformers/employee-transformer.ts`
  - Test Data: `/mcp-server/setup-staff-data.js`
- **Test Data**: 5 staff members created

## 🔄 Conversion Process

### Quick Conversion (Per Page)

```bash
# 1. Generate framework files
npm run convert-progressive [page-name]

# 2. Create test data
cd mcp-server && node setup-[page-name]-data.js

# 3. Test the page
# Login at http://localhost:3007/auth/login
# Navigate to http://localhost:3007/salon/[page-name]
```

### Batch Conversion (All Pages)

```bash
# 1. Convert all pages at once
node scripts/convert-all-salon-pages.js

# 2. Create all test data
cd mcp-server && node setup-all-salon-data.js

# 3. Verify all pages
cd mcp-server && node verify-salon-pages.js
```

## 📋 Remaining Pages to Convert

| Page | Entity Type | Priority | Notes |
|------|-------------|----------|-------|
| appointments | appointment | High | Core booking functionality |
| services | service | High | Service catalog |
| inventory | product | Medium | Product management |
| payments | transaction | High | Payment processing |
| pos | transaction | High | Point of sale (special handling) |
| loyalty | loyalty_program | Medium | Customer rewards |
| reports | report | Low | Analytics dashboards |
| marketing | campaign | Low | Marketing campaigns |
| settings | setting | Low | Configuration |
| finance/coa | gl_account | Medium | Already has production version |

## 🛠️ Manual Steps After Conversion

For each converted page:

1. **Update Authentication**
   ```typescript
   // Add at top of page component
   const { isAuthenticated } = useAuth()
   const { organizationId, userContext, loading: contextLoading } = useUserContext()
   ```

2. **Replace Data Source**
   ```typescript
   // Replace hardcoded data
   const { items, loading, error } = use[EntityName](organizationId)
   
   // Transform for UI
   const uiItems = items.map(transformToUI[EntityName])
   ```

3. **Add Loading States**
   ```typescript
   if (!isAuthenticated) return <AuthRequiredMessage />
   if (contextLoading) return <LoadingProfile />
   if (!organizationId) return <OrganizationError />
   if (loading) return <LoadingData />
   if (error) return <ErrorMessage error={error} />
   ```

4. **Update CRUD Operations**
   ```typescript
   // Use hook methods
   const { createItem, updateItem, deleteItem } = use[EntityName](organizationId)
   ```

## 🎯 Best Practices

1. **Always Use Organization Context**
   - Never hardcode organization IDs
   - Always get from `useUserContext()`

2. **Consistent Error Handling**
   - Show user-friendly error messages
   - Log detailed errors to console

3. **Maintain UI/UX**
   - Keep the same design from progressive
   - Just replace data source

4. **Test Thoroughly**
   - Test CRUD operations
   - Verify organization isolation
   - Check loading states

## 📊 Entity Mapping Reference

| Progressive | Universal Entity | Smart Code Pattern |
|-------------|-----------------|-------------------|
| staff | employee | HERA.SALON.EMPLOYEE.v1 |
| appointments | appointment | HERA.SALON.APPOINTMENT.v1 |
| services | service | HERA.SALON.SERVICE.v1 |
| products | product | HERA.SALON.PRODUCT.v1 |
| payments | transaction | HERA.SALON.PAYMENT.v1 |
| loyalty | loyalty_program | HERA.SALON.LOYALTY.v1 |

## 🧪 Testing Checklist

For each converted page:
- [ ] Page loads without errors
- [ ] Authentication required
- [ ] Shows correct organization data
- [ ] Search/filter works
- [ ] Create new item works
- [ ] Update item works
- [ ] Delete item works
- [ ] Loading states display
- [ ] Error states handle gracefully

## 🚀 Next Steps

1. Complete staff page UI updates
2. Convert appointments page (high priority)
3. Convert services page (high priority)
4. Create POS page with transaction handling
5. Add navigation between all pages

## 💡 Tips

- Use the converter script to save time
- Always create test data first
- Test with different user accounts
- Verify organization isolation works
- Keep the progressive UI design