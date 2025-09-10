#!/bin/bash

# Enterprise Reorganization - Phase 1: Module Structure
# This script creates the new module structure without breaking existing code

echo "🏗️  Enterprise Reorganization - Phase 1: Creating Module Structure"
echo "=================================================="

# Create modules directory structure
echo "📁 Creating modules directory structure..."

# Core module directories
modules=(
  "furniture"
  "salon"
  "restaurant"
  "audit"
  "shared"
)

# Subdirectories for each module
subdirs=(
  "components"
  "services"
  "hooks"
  "types"
  "utils"
  "constants"
)

# Create the directory structure
for module in "${modules[@]}"; do
  for subdir in "${subdirs[@]}"; do
    mkdir -p "src/modules/$module/$subdir"
    echo "  ✅ Created src/modules/$module/$subdir"
  done
  
  # Create index files
  echo "export * from './components'" > "src/modules/$module/index.ts"
  echo "export * from './services'" >> "src/modules/$module/index.ts"
  echo "export * from './hooks'" >> "src/modules/$module/index.ts"
  echo "export * from './types'" >> "src/modules/$module/index.ts"
done

echo ""
echo "📝 Creating README files for each module..."

# Create README for furniture module
cat > "src/modules/furniture/README.md" << 'EOF'
# Furniture Module

Enterprise furniture management module for HERA ERP.

## Structure
- `components/` - React components specific to furniture module
- `services/` - Business logic and API services
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `constants/` - Module constants

## Usage
```typescript
import { FurnitureDashboard } from '@/modules/furniture/components'
import { ChartOfAccountsService } from '@/modules/furniture/services'
```
EOF

# Create README for salon module
cat > "src/modules/salon/README.md" << 'EOF'
# Salon Module

Beauty salon management module for HERA ERP.

## Structure
- `components/` - React components specific to salon module
- `services/` - Business logic and API services
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `constants/` - Module constants

## Usage
```typescript
import { SalonDashboard } from '@/modules/salon/components'
import { AppointmentService } from '@/modules/salon/services'
```
EOF

echo "  ✅ Created README files"

echo ""
echo "🔧 Creating migration helper script..."

# Create a helper script to migrate existing code
cat > "src/modules/migrate-module.sh" << 'EOF'
#!/bin/bash
# Helper script to migrate a module to the new structure

MODULE=$1
if [ -z "$MODULE" ]; then
  echo "Usage: ./migrate-module.sh <module-name>"
  echo "Example: ./migrate-module.sh furniture"
  exit 1
fi

echo "Migrating $MODULE module..."

# Move components
if [ -d "src/components/$MODULE" ]; then
  cp -r src/components/$MODULE/* src/modules/$MODULE/components/
  echo "✅ Migrated components"
fi

# Move services
if [ -d "src/lib/$MODULE" ]; then
  cp -r src/lib/$MODULE/* src/modules/$MODULE/services/
  echo "✅ Migrated services"
fi

# Create barrel exports
echo "// Auto-generated barrel export" > src/modules/$MODULE/components/index.ts
find src/modules/$MODULE/components -name "*.tsx" -o -name "*.ts" | grep -v index.ts | while read file; do
  basename=$(basename "$file" | sed 's/\.[^.]*$//')
  echo "export * from './$basename'" >> src/modules/$MODULE/components/index.ts
done

echo "✅ Migration complete for $MODULE"
EOF

chmod +x src/modules/migrate-module.sh

echo "  ✅ Created migration helper script"

echo ""
echo "📋 Next Steps:"
echo "1. Run './src/modules/migrate-module.sh furniture' to migrate furniture module"
echo "2. Update tsconfig.json with new path aliases"
echo "3. Gradually update imports in your code"
echo ""
echo "✅ Phase 1 structure created successfully!"