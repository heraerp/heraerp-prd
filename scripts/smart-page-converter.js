#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Smart Page Converter
 * Intelligently converts progressive pages to production by preserving UI
 */

const CONVERSION_MAPPINGS = {
  appointments: {
    hook: 'useAppointment',
    entity: 'Appointment',
    dataVariable: 'appointments',
    statsMapping: {
      totalAppointments: 'stats.total',
      confirmedCount: 'stats.active',
      pendingCount: 'stats.inactive'
    }
  },
  staff: {
    hook: 'useEmployee',
    entity: 'Employee',
    dataVariable: 'staff',
    statsMapping: {
      totalStaff: 'stats.total',
      activeStaff: 'stats.active'
    }
  },
  services: {
    hook: 'useService',
    entity: 'Service',
    dataVariable: 'services',
    statsMapping: {
      totalServices: 'stats.total',
      activeServices: 'stats.active'
    }
  },
  inventory: {
    hook: 'useProduct',
    entity: 'Product',
    dataVariable: 'products',
    statsMapping: {
      totalProducts: 'stats.total',
      lowStock: 'items.filter(i => i.stockLevel < i.reorderPoint).length'
    }
  },
  payments: {
    hook: 'useTransaction',
    entity: 'Transaction',
    dataVariable: 'payments',
    statsMapping: {
      totalRevenue: 'stats.total',
      todayRevenue: 'stats.active'
    }
  },
  loyalty: {
    hook: 'useLoyalty_program',
    entity: 'Loyalty_program',
    dataVariable: 'loyaltyPrograms',
    statsMapping: {
      totalPrograms: 'stats.total',
      activePrograms: 'stats.active'
    }
  },
  marketing: {
    hook: 'useCampaign',
    entity: 'Campaign',
    dataVariable: 'campaigns',
    statsMapping: {
      totalCampaigns: 'stats.total',
      activeCampaigns: 'stats.active'
    }
  },
  reports: {
    hook: 'useReport',
    entity: 'Report',
    dataVariable: 'reports',
    statsMapping: {
      totalReports: 'stats.total'
    }
  },
  settings: {
    hook: 'useSetting',
    entity: 'Setting',
    dataVariable: 'settings',
    statsMapping: {
      totalSettings: 'stats.total'
    }
  }
}

function convertSmartPage(industry, pageName) {
  const mapping = CONVERSION_MAPPINGS[pageName]
  if (!mapping) {
    console.error(`No mapping found for page: ${pageName}`)
    return
  }

  const progressivePath = `src/app/${industry}-progressive/${pageName}/page.tsx`
  const productionPath = `src/app/${industry}/${pageName}/page.tsx`

  if (!fs.existsSync(progressivePath)) {
    console.error(`Progressive page not found: ${progressivePath}`)
    return
  }

  console.log(`🎯 Smart Converting ${industry}/${pageName} to production...`)

  // Read progressive page
  let content = fs.readFileSync(progressivePath, 'utf8')

  // Step 1: Update imports
  content = updateImports(content, mapping)

  // Step 2: Replace component definition
  content = updateComponentDefinition(content, mapping)

  // Step 3: Replace data source
  content = replaceDataSource(content, mapping)

  // Step 4: Add auth checks
  content = addAuthChecks(content, mapping, pageName)

  // Step 5: Update handlers
  content = updateHandlers(content, mapping)

  // Step 6: Clean up progressive-specific code
  content = cleanupProgressiveCode(content)

  // Save the converted page
  fs.writeFileSync(productionPath, content)
  console.log(`✅ Converted ${pageName} to production!`)
  console.log(`📝 Review and test at: http://localhost:3007/${industry}/${pageName}`)
}

function updateImports(content, mapping) {
  // Remove progressive imports
  content = content.replace(/import.*SalonTeamsSidebar.*\n/g, '')
  content = content.replace(/import.*salon-styles.*\n/g, '')
  
  // Add production imports after existing imports
  const lastImportMatch = content.match(/from ['"]lucide-react['"]/)
  if (lastImportMatch) {
    const insertPosition = content.indexOf(lastImportMatch[0]) + lastImportMatch[0].length + 1
    
    const newImports = `
import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { ${mapping.hook} } from '@/hooks/${mapping.hook}'
import { 
  transformToUI${mapping.entity},
  filter${mapping.entity}s
} from '@/lib/transformers/${mapping.entity.toLowerCase()}-transformer'`
    
    content = content.slice(0, insertPosition) + newImports + content.slice(insertPosition)
  }
  
  return content
}

function updateComponentDefinition(content, mapping) {
  // Replace function signature
  const functionMatch = content.match(/export default function \w+\(\) {/)
  if (functionMatch) {
    content = content.replace(
      functionMatch[0],
      `export default function ${mapping.entity}sProduction() {`
    )
  }
  
  return content
}

function replaceDataSource(content, mapping) {
  // Find where state is defined
  const stateMatch = content.match(/const \[(\w+), set\w+\] = useState\(initial\w+\)/)
  
  if (stateMatch) {
    const oldDataVar = stateMatch[1]
    
    // Replace state definition with hooks
    const hookCode = `  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    create${mapping.entity}, 
    update${mapping.entity}, 
    delete${mapping.entity} 
  } = ${mapping.hook}(organizationId)

  // Transform items to UI format
  const uiItems = useMemo(() => 
    items.map(transformToUI${mapping.entity}),
    [items]
  )

  // Replace original data variable
  const ${oldDataVar} = uiItems`
    
    // Find the right place to insert (after useState declarations)
    const insertMatch = content.match(/const \[searchTerm.*\n/)
    if (insertMatch) {
      const insertPosition = content.indexOf(insertMatch[0]) + insertMatch[0].length
      content = content.slice(0, insertPosition) + '\n' + hookCode + '\n' + content.slice(insertPosition)
    }
    
    // Remove the original useState for data
    content = content.replace(/const \[\w+, set\w+\] = useState\(initial\w+\)\n/g, '')
  }
  
  // Add useMemo import if not present
  if (!content.includes('useMemo')) {
    content = content.replace(
      "import React, { useState",
      "import React, { useState, useMemo"
    )
  }
  
  return content
}

function addAuthChecks(content, mapping, pageName) {
  // Find the return statement
  const returnMatch = content.match(/return \(/)
  
  if (returnMatch) {
    const authChecks = `  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access ${pageName} management.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Organization not found. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  `
    
    const insertPosition = content.indexOf(returnMatch[0])
    content = content.slice(0, insertPosition) + authChecks + content.slice(insertPosition)
  }
  
  return content
}

function updateHandlers(content, mapping) {
  // Update add/create handlers
  content = content.replace(/handleAdd\w+/g, `handleAdd${mapping.entity}`)
  content = content.replace(/set\w+\(\[\.\.\.(\w+),/g, (match, dataVar) => {
    return `await create${mapping.entity}(newItem); refetch(); // Updated: `
  })
  
  // Update delete handlers
  content = content.replace(/handleDelete\w+/g, `handleDelete${mapping.entity}`)
  content = content.replace(/set\w+\((\w+)\.filter/g, (match, dataVar) => {
    return `await delete${mapping.entity}(id); refetch(); // Updated: `
  })
  
  return content
}

function cleanupProgressiveCode(content) {
  // Remove progressive-specific code
  content = content.replace(/<SalonTeamsSidebar.*\/>/g, '')
  content = content.replace(/\/\/ Progressive Demo Data[\s\S]*?(?=\n\n)/g, '')
  content = content.replace(/const initial\w+ = \[[\s\S]*?\];\n\n/g, '')
  
  // Add user context display in header
  const headerMatch = content.match(/<div className="flex items-center justify-between">/)
  if (headerMatch) {
    const insertPosition = content.indexOf(headerMatch[0]) + headerMatch[0].length
    const userContextDisplay = `
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>`
    
    // Check if it's not already there
    if (!content.includes('userContext.user.name')) {
      content = content.slice(0, insertPosition) + userContextDisplay + content.slice(insertPosition)
    }
  }
  
  return content
}

// Main execution
const args = process.argv.slice(2)
const industry = args[0] || 'salon'
const pageName = args[1]

if (!pageName) {
  console.log(`
🎯 Smart Page Converter

Usage: npm run smart-convert [industry] [page-name]

Available pages:
${Object.keys(CONVERSION_MAPPINGS).map(p => `  - ${p}`).join('\n')}

Example: npm run smart-convert salon appointments

This converter:
✅ Preserves your UI components
✅ Replaces data source with hooks
✅ Adds authentication checks
✅ Updates handlers to use API
✅ Maintains your styling
`)
} else {
  convertSmartPage(industry, pageName)
}