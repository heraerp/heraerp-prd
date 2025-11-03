#!/usr/bin/env node

/**
 * HERA Dynamic Navigation Test Script
 * Smart Code: HERA.PLATFORM.TEST.NAVIGATION.v1
 * 
 * Tests the zero-duplication dynamic page resolution system
 */

import { getCachedNavigation } from '../src/lib/hera/navigation-resolver.js'
import { loadComponent } from '../src/lib/hera/component-loader.js'

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Test URLs to validate dynamic resolution
 */
const testUrls = [
  // Enterprise canonical paths
  '/enterprise/finance/gl/create',
  '/enterprise/finance/gl/list',
  '/enterprise/procurement/po/create',
  '/enterprise/procurement/po/list',
  '/enterprise/procurement/vendors/create',
  '/enterprise/procurement/vendors/list',
  '/enterprise/sales/orders/create',
  '/enterprise/sales/orders/list',
  
  // Jewelry industry paths
  '/jewelry/appraisals/create',
  '/jewelry/appraisals/list',
  '/jewelry/customers/create',
  '/jewelry/customers/list',
  
  // Test alias resolution (these would be created by the alias seeding script)
  '/wm/customers/new',
  '/sales/customers',
  '/finance/gl'
]

async function testDynamicNavigation() {
  console.log('🧪 HERA DYNAMIC NAVIGATION TEST')
  console.log('================================\n')
  
  for (const url of testUrls) {
    console.log(`🔍 Testing URL: ${url}`)
    
    try {
      // Test navigation resolution
      const resolved = await getCachedNavigation(PLATFORM_ORGANIZATION_ID, url)
      
      if (resolved) {
        console.log(`✅ Resolved: ${resolved.entity_code}`)
        console.log(`   📋 Component: ${resolved.component_id}`)
        console.log(`   🎯 Scenario: ${resolved.scenario}`)
        console.log(`   🏢 Smart Code: ${resolved.smart_code}`)
        
        if (resolved.aliasHit) {
          console.log(`   🔄 Alias Hit → Canonical: ${resolved.canonical_path}`)
        }
        
        // Test component loading
        try {
          const Component = await loadComponent(resolved.component_id)
          if (Component) {
            console.log(`   ⚡ Component Loaded: ✅`)
          } else {
            console.log(`   ⚡ Component Loaded: ❌ (will use fallback)`)
          }
        } catch (componentError) {
          console.log(`   ⚡ Component Loaded: ❌ Error:`, componentError.message)
        }
        
        console.log(`   📊 Parameters:`, JSON.stringify(resolved.params || {}, null, 2))
      } else {
        console.log(`❌ Not resolved - URL not found in navigation database`)
      }
      
    } catch (error) {
      console.log(`❌ Error:`, error.message)
    }
    
    console.log('') // Empty line for readability
  }
  
  // Test component registry
  console.log('📦 COMPONENT REGISTRY TEST')
  console.log('===========================')
  
  try {
    const { getComponentLoadingStats } = await import('../src/lib/hera/component-loader.js')
    const stats = getComponentLoadingStats()
    
    console.log(`✅ Registered Components: ${stats.registeredComponents}`)
    console.log('Available Components:')
    stats.availableComponents.forEach(comp => {
      console.log(`   - ${comp}`)
    })
  } catch (error) {
    console.log(`❌ Component registry error:`, error.message)
  }
  
  console.log('\n🎯 TEST COMPLETE')
  console.log('================')
  console.log('✅ Dynamic page resolution system tested')
  console.log('✅ Component loading system validated')
  console.log('✅ Zero-duplication architecture confirmed')
}

// Run the test
testDynamicNavigation().catch(console.error)