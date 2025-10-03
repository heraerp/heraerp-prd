# HERA Enterprise Module Development Checklist
## Ensuring Every New Module Meets Enterprise-Grade Standards

> Based on the successful jewelry search enhancement, this checklist ensures all HERA modules deliver enterprise-grade quality consistently.

## 🎯 **Pre-Development Setup**

### **1. Industry Theme Setup**
```bash
# Generate industry-specific theme
npm run quality:theme [industry-name]

# Available industries:
# jewelry, furniture, healthcare, automotive, restaurant, 
# salon, fitness, legal, real_estate, consulting
```

### **2. Create Module Structure**
```
src/app/[industry]/
├── components/
│   ├── [Feature]Enhanced.tsx      # Enhanced components
│   ├── [Feature]Facets.tsx        # Filter components  
│   └── [Feature]Results.tsx       # Results display
├── styles/
│   └── [industry]-theme.css       # Industry theme
└── [feature]/
    └── page.tsx                   # Main page
```

### **3. Setup Development Environment**
```bash
# Install quality tools
npm install --save-dev glob

# Verify quality scripts work
npm run quality:check
npm run quality:enterprise
```

## 🏗️ **Component Development Standards**

### **A. Enhanced Component Pattern**
```typescript
// Always create "Enhanced" versions for enterprise features
export function FeatureEnhanced({
  organizationId,        // Required: Multi-tenant isolation
  userRole,             // Required: Role-based features
  className,            // Optional: Custom styling
  spacing = 'spacious'  // Optional: Spacing mode
}: FeatureProps) {
  // ✅ 1. All hooks before conditional returns
  const [state, setState] = useState()
  const [expanded, setExpanded] = useState(new Set(['default']))
  const debouncedValue = useDebounce(searchQuery, 300)
  
  // ✅ 2. Get organization context
  const [orgContext, setOrgContext] = useState()
  
  useEffect(() => {
    // Check localStorage for organization context
    const orgId = localStorage.getItem('organizationId')
    const role = localStorage.getItem(`${industry}Role`)
    
    if (!orgId || !role) {
      router.push(`/${industry}/demo`)
      return
    }
    
    setOrgContext({ orgId, role })
  }, [])
  
  // ✅ 3. Conditional logic after hooks
  if (!orgContext) {
    return <LoadingSkeleton />
  }
  
  // ✅ 4. Enterprise-grade JSX
  return (
    <div className="min-h-screen [industry]-gradient-bg">
      <div className="relative z-10 flex h-screen">
        {/* Enhanced components */}
      </div>
    </div>
  )
}
```

### **B. Spacing Standards (MANDATORY)**
```scss
// Use these spacing classes ONLY
.enterprise-container {
  width: 384px;              // w-96 (filters)
  padding: 24px;             // p-6 (cards)
  gap: 24px;                 // space-y-6 (sections)
  margin: 12px;              // gap-3 (small items)
}

// ❌ NEVER use cramped spacing
// p-1, p-2, space-y-1, space-y-2, gap-1, gap-2
```

### **C. Text Contrast Standards (MANDATORY)**
```typescript
// High contrast text (primary content)
className="!text-gray-100 dark:!text-gray-100"

// Medium contrast text (secondary content)  
className="!text-gray-400 dark:!text-gray-400"

// Industry accent text
style={{ color: '#E6C200' }} // For badges, entity types

// Force colors for badges (override global CSS)
<Badge 
  className="bg-[industry]-primary-500/10 border-[industry]-primary-500/30"
  style={{ color: '#E6C200' }}
>
  <span style={{ color: '#E6C200' }}>
    {text}
  </span>
</Badge>
```

### **D. Interactive States (MANDATORY)**
```scss
// All interactive elements need these
.enterprise-interactive {
  transition: all 0.2s ease;           // Smooth animations
  hover:bg-[industry]-primary-500/10;  // Hover background
  hover:scale-102;                     // Subtle scale
  focus:ring-2;                        // Focus ring
  focus:ring-[industry]-primary-400;   // Focus color
  focus:ring-offset-2;                 // Focus offset
}
```

### **E. Role-Based Features (MANDATORY)**
```typescript
// Every component should check user role
const getAvailableActions = (userRole: string) => {
  const actions = [
    { label: 'View Details', icon: Eye, roles: ['*'] }
  ]
  
  if (['owner', 'manager'].includes(userRole)) {
    actions.push({ label: 'Edit', icon: Edit })
    actions.push({ label: 'Delete', icon: Trash2 })
  }
  
  if (['owner', 'manager', 'sales'].includes(userRole)) {
    actions.push({ label: 'Create Order', icon: ShoppingCart })
  }
  
  return actions
}

// Hide sensitive data based on role
{['owner', 'manager'].includes(userRole) && (
  <div className="jewelry-text-gold font-bold">
    {formatCurrency(item.price)}
  </div>
)}
```

## 🎨 **Visual Design Standards**

### **F. Industry Theme Application**
```typescript
// Import industry theme
import '[industry]Theme' from '@/styles/themes/[industry]-theme.css'

// Use industry-specific classes
className="[industry]-glass-card"           // Cards
className="[industry]-text-primary"         // Primary text
className="[industry]-text-accent"          // Accent text
className="[industry]-btn-primary"          // Primary buttons
className="[industry]-btn-secondary"        // Secondary buttons
className="[industry]-gradient-primary"     // Backgrounds
```

### **G. Responsive Design (MANDATORY)**
```typescript
// All components must be responsive
<div className="
  grid 
  grid-cols-1           // Mobile: 1 column
  md:grid-cols-2        // Tablet: 2 columns  
  lg:grid-cols-3        // Desktop: 3 columns
  xl:grid-cols-4        // Large: 4 columns
  gap-6                 // Consistent spacing
">
```

### **H. Loading & Empty States**
```typescript
// Professional loading states
if (loading) {
  return (
    <div className="min-h-screen [industry]-gradient-bg flex items-center justify-center">
      <div className="[industry]-glass-card p-6">
        <RefreshCw className="h-12 w-12 [industry]-text-accent animate-spin" />
      </div>
    </div>
  )
}

// Professional empty states
if (results.length === 0) {
  return (
    <div className="[industry]-glass-card p-12 text-center">
      <Sparkles className="h-12 w-12 [industry]-text-accent mx-auto mb-4" />
      <h3 className="[industry]-text-primary text-xl font-semibold mb-2">
        No results found
      </h3>
      <p className="[industry]-text-secondary max-w-sm">
        Try adjusting your search criteria or clearing some filters.
      </p>
    </div>
  )
}
```

## 📋 **Quality Control Checklist**

### **I. Pre-Commit Checklist**
```bash
# Run before every commit
□ npm run quality:check                    # Enterprise quality
□ npm run typecheck                        # TypeScript  
□ npm run lint                            # ESLint
□ Test with different user roles          # Role functionality
□ Test responsive on mobile/tablet        # Responsive design
□ Verify text contrast in dark mode       # Accessibility
□ Check hover/focus states work           # Interactions
□ Ensure loading states display           # Loading UX
□ Test empty states render correctly      # Empty UX
```

### **J. Component Review Standards**
```markdown
## Enterprise Component Review

### Visual Quality ✅
□ Generous spacing (p-6, space-y-6, w-96)
□ High contrast text (!text-gray-100/400)
□ Smooth hover/focus animations (0.2s ease)
□ Industry theme colors applied
□ Professional loading/empty states

### Functional Quality ✅  
□ Role-based features work correctly
□ Multi-tenant isolation (organizationId)
□ Responsive breakpoints (sm/md/lg/xl)
□ Keyboard navigation works
□ Error handling implemented

### Code Quality ✅
□ TypeScript types complete
□ Props properly documented  
□ Performance optimized (memo/callbacks)
□ Accessibility attributes present
□ Industry theme imported/used
```

## 🚀 **Automated Quality Tools**

### **K. Quality Scripts Usage**
```bash
# Check enterprise quality
npm run quality:check

# Generate quality report  
npm run quality:report

# Full enterprise validation
npm run quality:enterprise

# Generate industry theme
npm run quality:theme furniture

# List available themes
npm run quality:themes list
```

### **L. Git Hooks (Automatic)**
The pre-commit hook automatically runs:
- ✅ Enterprise quality check
- ✅ TypeScript validation  
- ✅ ESLint checks
- ✅ Code formatting

### **M. Quality Metrics Targets**
```typescript
// Minimum scores for enterprise grade
const ENTERPRISE_TARGETS = {
  spacing: 90,           // Generous spacing usage
  contrast: 95,          // Text contrast compliance  
  responsiveness: 90,    // Mobile compatibility
  accessibility: 95,     // A11y compliance
  performance: 85,       // Bundle size/renders
  consistency: 90,       // Pattern adherence
  overall: 90           // Weighted average
}
```

## 🎯 **Implementation Workflow**

### **Phase 1: Setup (Day 1)**
1. Generate industry theme: `npm run quality:theme [industry]`
2. Create module structure following pattern
3. Setup base components with Enhanced pattern
4. Run initial quality check: `npm run quality:check`

### **Phase 2: Development (Days 2-5)**
1. Build components using enterprise standards
2. Apply industry theme consistently  
3. Implement role-based features
4. Add responsive breakpoints
5. Create loading/empty states

### **Phase 3: Quality Assurance (Day 6)**
1. Run full quality check: `npm run quality:enterprise`
2. Test with different user roles
3. Verify responsive behavior
4. Check accessibility compliance
5. Review code with team

### **Phase 4: Deployment (Day 7)**
1. Pass all automated quality checks
2. Get code review approval
3. Verify Git hooks pass
4. Deploy with confidence

## 🏆 **Success Criteria**

A module meets enterprise-grade standards when:

✅ **Quality Score**: 90+ overall rating  
✅ **Visual Design**: Consistent spacing, contrast, theming
✅ **User Experience**: Smooth interactions, responsive, accessible
✅ **Code Quality**: TypeScript, documented, performant  
✅ **Business Logic**: Role-based, multi-tenant, error handling
✅ **Automated Validation**: Passes all quality checks

## 📚 **Reference Examples**

### **Gold Standard**: Jewelry Search Module
- **File**: `/src/app/jewelry/search/page.tsx`
- **Enhanced Components**: `SearchFacetsEnhanced.tsx`, `SearchResultsEnhanced.tsx`
- **Quality Score**: A+ (95%+)
- **Key Features**: Role-based UI, enterprise spacing, perfect text contrast

### **Component Patterns**: 
- **Enhanced Filter Panel**: 384px width, 24px padding, collapsible sections
- **Enhanced Results Display**: Table/grid views, professional pagination
- **Enhanced Form Fields**: High contrast labels, proper spacing
- **Enhanced Buttons**: Hover states, focus rings, role-based visibility

---

## 🎯 **The Enterprise Promise**

By following this checklist, every HERA module will deliver:

🏆 **Professional UI/UX** that impresses enterprise customers  
🔒 **Enterprise Security** with role-based access control  
📱 **Mobile Excellence** that works perfectly on all devices  
♿ **Accessibility Compliance** meeting WCAG AA standards  
⚡ **Performance Optimized** for fast loading and smooth interactions  
🎨 **Brand Consistency** with industry-specific theming  
🧪 **Quality Assured** through automated testing and validation

**Result**: HERA modules that enterprises are proud to use and show to their clients.