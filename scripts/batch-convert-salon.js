#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/**
 * Batch Convert All Salon Pages
 * Updates each page to use production hooks following customers pattern
 */

const PAGES_TO_CONVERT = [
  'appointments',
  'services', 
  'staff',
  'inventory',
  'payments',
  'loyalty',
  'reports',
  'marketing',
  'settings'
]

async function convertAllSalonPages() {
  console.log('🚀 Batch Converting Salon Pages to Production\n')
  
  for (const page of PAGES_TO_CONVERT) {
    console.log(`\n📄 Converting ${page}...`)
    console.log('='.repeat(50))
    
    try {
      await convertPage(page)
      console.log(`✅ ${page} converted successfully!`)
    } catch (error) {
      console.error(`❌ Failed to convert ${page}:`, error.message)
    }
  }
  
  console.log('\n\n🎉 Conversion Complete!')
  console.log('Next steps:')
  console.log('1. Review each converted page')
  console.log('2. Test with demo user at http://localhost:3007/salon/[page]')
  console.log('3. Make any UI adjustments as needed')
}

async function convertPage(pageName) {
  const productionPath = `src/app/salon/${pageName}/page.tsx`
  
  // First, backup the existing page
  if (fs.existsSync(productionPath)) {
    const backupPath = `${productionPath}.backup`
    fs.copyFileSync(productionPath, backupPath)
    console.log(`   📋 Backed up to ${backupPath}`)
  }
  
  // Read the existing page
  let content = fs.readFileSync(productionPath, 'utf8')
  
  // Apply production conversion pattern
  content = applyConversionPattern(content, pageName)
  
  // Save the converted page
  fs.writeFileSync(productionPath, content)
}

function applyConversionPattern(content, pageName) {
  const hookMap = {
    appointments: 'useAppointment',
    services: 'useService',
    staff: 'useEmployee',
    inventory: 'useProduct',
    payments: 'useTransaction',
    loyalty: 'useLoyalty_program',
    reports: 'useReport',
    marketing: 'useCampaign',
    settings: 'useSetting'
  }
  
  const entityMap = {
    appointments: 'Appointment',
    services: 'Service',
    staff: 'Employee',
    inventory: 'Product',
    payments: 'Transaction',
    loyalty: 'Loyalty_program',
    reports: 'Report',
    marketing: 'Campaign',
    settings: 'Setting'
  }
  
  const hook = hookMap[pageName]
  const entity = entityMap[pageName]
  
  // Step 1: Add imports at the top
  const imports = `import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { ${hook} } from '@/hooks/${hook}'

`
  
  // Add imports after 'use client'
  content = content.replace("'use client'\n\n", "'use client'\n\n" + imports)
  
  // Step 2: Add auth and data hooks after component declaration
  const componentMatch = content.match(/export default function \w+\(\) {/)
  if (componentMatch) {
    const hookCode = `
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    create${entity}, 
    update${entity}, 
    delete${entity} 
  } = ${hook}(organizationId)
`
    
    const insertPos = content.indexOf(componentMatch[0]) + componentMatch[0].length
    content = content.slice(0, insertPos) + hookCode + content.slice(insertPos)
  }
  
  // Step 3: Add auth checks before main return
  const mainReturnMatch = content.match(/(\s+)return \(/)
  if (mainReturnMatch) {
    const indent = mainReturnMatch[1]
    const authChecks = `
${indent}if (!isAuthenticated) {
${indent}  return (
${indent}    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
${indent}      <Alert>
${indent}        <AlertCircle className="h-4 w-4" />
${indent}        <AlertDescription>
${indent}          Please log in to access ${pageName} management.
${indent}        </AlertDescription>
${indent}      </Alert>
${indent}    </div>
${indent}  )
${indent}}

${indent}if (contextLoading) {
${indent}  return (
${indent}    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
${indent}      <div className="text-center">
${indent}        <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
${indent}        <p className="text-gray-600">Loading your profile...</p>
${indent}      </div>
${indent}    </div>
${indent}  )
${indent}}

${indent}if (!organizationId) {
${indent}  return (
${indent}    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
${indent}      <Alert variant="destructive">
${indent}        <AlertCircle className="h-4 w-4" />
${indent}        <AlertDescription>
${indent}          Organization not found. Please contact support.
${indent}        </AlertDescription>
${indent}      </Alert>
${indent}    </div>
${indent}  )
${indent}}
`
    
    const insertPos = content.lastIndexOf(mainReturnMatch[0])
    content = content.slice(0, insertPos) + authChecks + '\n' + content.slice(insertPos)
  }
  
  // Step 4: Add user context display in header
  const headerPattern = /<div className="flex items-center justify-between">/
  const headerMatch = content.match(headerPattern)
  if (headerMatch && !content.includes('userContext.user.name')) {
    const userDisplay = `
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>`
    
    const insertPos = content.indexOf(headerMatch[0]) + headerMatch[0].length
    content = content.slice(0, insertPos) + userDisplay + content.slice(insertPos)
  }
  
  // Step 5: Add TODO comments for manual updates
  content = `// TODO: Update this page to use production data from ${hook}
// 1. Replace hardcoded data arrays with: const data = items.map(transformToUI${entity})
// 2. Update create handlers to use: await create${entity}(formData)
// 3. Update delete handlers to use: await delete${entity}(id)
// 4. Replace loading states with: loading ? <Skeleton /> : <YourComponent />

` + content
  
  return content
}

// Run the batch converter
convertAllSalonPages().catch(console.error)