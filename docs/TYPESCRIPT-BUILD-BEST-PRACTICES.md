# TypeScript Build Best Practices for HERA

## 🚀 Overview

This guide ensures TypeScript errors are caught during development, not during production builds.

## 🛠️ Available Commands

### Real-time TypeScript Checking

```bash
# Watch mode - see errors as you code
npm run typecheck:watch

# Enhanced development mode with live error reporting
npm run dev:enhanced

# Strict validation before builds
npm run build:validate

# Auto-fix common TypeScript issues
npm run typecheck:fix
```

### Pre-build Validation

```bash
# Always run before pushing code
npm run predeploy

# Quick quality check
npm run quality:pre-build
```

## 🔧 VS Code Setup

1. **Install Required Extensions**:
   - TypeScript and JavaScript Language Features (built-in)
   - ESLint
   - Prettier

2. **Use Workspace TypeScript Version**:
   - Open any `.ts` file
   - Press `Cmd+Shift+P` → "TypeScript: Select TypeScript Version"
   - Choose "Use Workspace Version"

3. **Enable Format on Save**:
   - Already configured in `.vscode/settings.json`
   - Automatically fixes imports and formatting

## ⚡ Common TypeScript Issues & Fixes

### 1. Missing Lucide Icons

**Error**: `Cannot find name 'Shield'`

**Fix**:
```typescript
// Add to imports
import { Shield } from 'lucide-react'

// Or run auto-fix
npm run typecheck:fix
```

### 2. useSearchParams without Suspense

**Error**: `useSearchParams must be wrapped in a Suspense boundary`

**Fix**:
```typescript
import { Suspense } from 'react'

export default function PageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Page />
    </Suspense>
  )
}

function Page() {
  const searchParams = useSearchParams()
  // ... rest of component
}
```

### 3. Incorrect Toast Imports

**Error**: `Module not found: @/components/ui/use-toast`

**Fix**:
```typescript
// Wrong
import { useToast } from '@/components/ui/use-toast'

// Correct
import { useToast } from '@/hooks/use-toast'
```

### 4. Missing 'use client' Directive

**Error**: `useState/useEffect can only be used in Client Components`

**Fix**:
```typescript
'use client'

import { useState } from 'react'
// ... rest of component
```

## 🏗️ Development Workflow

### 1. Start Development with Enhanced Mode

```bash
# Terminal 1 - Start dev server with Control Center
npm run dev

# Terminal 2 - Start TypeScript watcher
npm run typecheck:watch

# Or use the all-in-one enhanced mode
npm run dev:enhanced
```

### 2. Before Committing

```bash
# Run validation
npm run build:validate

# Auto-fix issues
npm run typecheck:fix

# Format code
npm run format
```

### 3. Before Pushing

```bash
# Full pre-deployment check
npm run predeploy
```

## 🎯 Best Practices

### 1. **Import Organization**

Always organize imports in this order:
```typescript
// 1. React/Next imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { format } from 'date-fns'

// 3. Internal components
import { Button } from '@/components/ui/button'

// 4. Internal utilities
import { cn } from '@/lib/utils'

// 5. Types
import type { User } from '@/types'
```

### 2. **Type Safety**

```typescript
// ❌ Avoid 'any'
const data: any = fetch('/api/data')

// ✅ Use proper types
interface ApiResponse {
  data: User[]
  total: number
}
const response = await fetch('/api/data') as ApiResponse
```

### 3. **Null Safety**

```typescript
// ❌ Can crash
const name = user.profile.name.toUpperCase()

// ✅ Safe with optional chaining
const name = user?.profile?.name?.toUpperCase() ?? ''
```

### 4. **Exhaustive Checks**

```typescript
type Status = 'pending' | 'approved' | 'rejected'

function handleStatus(status: Status) {
  switch (status) {
    case 'pending':
      return 'Waiting'
    case 'approved':
      return 'Success'
    case 'rejected':
      return 'Failed'
    default:
      // This ensures all cases are handled
      const _exhaustive: never = status
      return _exhaustive
  }
}
```

## 🚨 Pre-commit Hooks

The project includes automatic TypeScript validation on commit:

1. TypeScript compilation check
2. Import validation
3. Next.js 15 compatibility check
4. ESLint validation

If any check fails, the commit will be blocked with helpful error messages.

## 📊 Monitoring Build Health

### Dashboard View

```bash
npm run cc:health
```

Shows:
- TypeScript compilation status
- Import graph integrity
- Build time metrics
- Error/warning counts

### Continuous Monitoring

```bash
npm run dev:enhanced
```

Provides:
- Real-time error detection
- Import validation
- Performance metrics
- Interactive commands

## 🆘 Troubleshooting

### Build Still Failing?

1. **Clear caches**:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

2. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Run deep validation**:
   ```bash
   npm run typecheck:strict
   npm run build:validate
   ```

4. **Check for circular dependencies**:
   ```bash
   npx madge --circular --extensions ts,tsx src/
   ```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Next.js TypeScript Guide](https://nextjs.org/docs/basic-features/typescript)
- [HERA Development Guide](./DEVELOPMENT-GUIDE.md)