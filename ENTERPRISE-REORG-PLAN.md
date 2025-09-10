# Enterprise-Level Codebase Reorganization Plan

## Current Issues
1. **Mixed concerns** - Business modules mixed with system features in `/app`
2. **Inconsistent naming** - Different patterns (kebab-case, feature-based, version suffixes)
3. **No clear boundaries** - API versions, admin, and business features at same level
4. **Deep nesting** - Some modules have 5+ levels of nesting
5. **Duplicate functionality** - Multiple analytics-chat versions, similar features

## Proposed Enterprise Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group route
│   │   ├── login/
│   │   ├── signup/
│   │   └── auth/
│   ├── (platform)/               # Platform admin group
│   │   ├── admin/
│   │   ├── control-center/
│   │   └── monitoring/
│   ├── (modules)/                # Business modules group
│   │   ├── furniture/
│   │   ├── salon/
│   │   ├── restaurant/
│   │   └── audit/
│   ├── api/                      # API routes
│   │   ├── v1/
│   │   ├── v2/
│   │   └── health/
│   └── [...catchAll]/            # 404 handling
│
├── modules/                      # Business logic modules
│   ├── furniture/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   ├── salon/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   └── shared/                   # Shared business components
│
├── lib/                          # Core libraries & utilities
│   ├── core/                     # Core HERA functionality
│   │   ├── universal-api/
│   │   ├── supabase/
│   │   └── auth/
│   ├── features/                 # Feature libraries
│   │   ├── ai/
│   │   ├── dna/
│   │   └── analytics/
│   └── utils/                    # Utilities
│
├── components/                   # UI components
│   ├── ui/                       # Base UI components (shadcn)
│   ├── layouts/                  # Layout components
│   └── shared/                   # Shared components
│
└── config/                       # Configuration
    ├── constants/
    ├── industry/
    └── environment/
```

## Implementation Strategy

### Phase 1: Create Module Structure (Low Impact)
1. Create `/src/modules` directory structure
2. Move business logic from components to modules
3. Update imports using path aliases

### Phase 2: Reorganize App Directory (Medium Impact)
1. Use Next.js route groups for organization
2. Move business modules under `(modules)` group
3. Keep API routes separate

### Phase 3: Consolidate Libraries (Low Impact)
1. Organize `/lib` into core/features/utils
2. Remove duplicate code
3. Create clear boundaries

## Benefits
1. **Clear separation** - UI, business logic, and infrastructure separated
2. **Scalability** - Easy to add new modules
3. **Maintainability** - Clear ownership boundaries
4. **Reusability** - Shared components and services
5. **Type safety** - Centralized type definitions

## Impact Analysis
- **Import paths**: Can be minimized using path aliases
- **Git history**: Preserved with proper moves
- **Build process**: No changes required
- **Runtime**: Zero impact

## Migration Commands

```bash
# Phase 1: Create module structure
mkdir -p src/modules/{furniture,salon,restaurant,audit,shared}/{components,services,hooks,types}

# Phase 2: Move business logic (example)
mv src/components/furniture/* src/modules/furniture/components/
mv src/lib/furniture/* src/modules/furniture/services/

# Phase 3: Update imports using codemod
npx jscodeshift -t scripts/update-imports.js src/
```

## Path Alias Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/modules/*": ["./src/modules/*"],
      "@/furniture/*": ["./src/modules/furniture/*"],
      "@/salon/*": ["./src/modules/salon/*"],
      "@/core/*": ["./src/lib/core/*"],
      "@/features/*": ["./src/lib/features/*"]
    }
  }
}
```

## Is It Worth Doing?

### YES, because:
1. **Team scaling** - Clear boundaries for team ownership
2. **Code discovery** - Developers find features faster
3. **Reduced conflicts** - Less merge conflicts with clear boundaries
4. **Testing** - Easier to test isolated modules
5. **Performance** - Better code splitting opportunities

### Migration Effort:
- **Time**: 2-3 days for full migration
- **Risk**: Low with phased approach
- **Team impact**: Minimal with proper communication

### Recommendation:
Start with Phase 1 (modules directory) as it has the lowest impact and highest benefit. This can be done incrementally without breaking existing code.