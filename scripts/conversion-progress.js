#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { UNIVERSAL_PAGE_CONFIGS, SMART_CODE_PATTERNS } = require('./universal-conversion-config')

// Industry page mappings
const INDUSTRY_PAGES = {
  salon: ['appointments', 'services', 'staff', 'inventory', 'payments', 'loyalty', 'reports', 'marketing', 'settings', 'customers'],
  healthcare: ['appointments', 'patients', 'prescriptions', 'billing', 'reports'],
  restaurant: ['menu', 'kitchen', 'delivery', 'inventory', 'pos'],
  jewelry: ['appointments', 'customers', 'inventory', 'repair', 'analytics', 'reports', 'settings'],
  audit: ['clients', 'engagements', 'working-papers', 'teams', 'documents', 'planning'],
  airline: ['bookings', 'check-in', 'loyalty', 'search'],
  crm: ['deals', 'calls', 'analytics', 'settings'],
  'enterprise-retail': ['customers', 'inventory', 'merchandising', 'procurement', 'promotions', 'analytics'],
  bpo: ['queue', 'analytics', 'audit', 'communication'],
  manufacturing: ['inventory', 'procurement', 'fixed-assets', 'reports'],
  financial: ['budgets', 'fixed-assets', 'reports']
}

function checkConversionProgress() {
  console.log('📊 HERA Universal Conversion Progress Report')
  console.log('='.repeat(60))
  console.log()

  let totalPages = 0
  let totalConverted = 0
  const industryStats = {}

  // Check each industry
  Object.entries(INDUSTRY_PAGES).forEach(([industry, pages]) => {
    let converted = 0
    let pending = []
    
    pages.forEach(page => {
      totalPages++
      const productionPath = `src/app/${industry}/${page}/page.tsx`
      const hookPath = `src/hooks/use${getEntityName(page)}.ts`
      
      if (fs.existsSync(productionPath) || fs.existsSync(hookPath)) {
        converted++
        totalConverted++
      } else {
        pending.push(page)
      }
    })
    
    industryStats[industry] = {
      total: pages.length,
      converted,
      pending,
      percentage: Math.round((converted / pages.length) * 100)
    }
  })

  // Display results
  console.log(`📈 Overall Progress: ${totalConverted}/${totalPages} pages (${Math.round((totalConverted/totalPages)*100)}%)`)
  console.log()
  
  // Progress bar
  const progressBar = generateProgressBar(totalConverted, totalPages, 40)
  console.log(`[${progressBar}]`)
  console.log()

  // Industry breakdown
  console.log('🏭 Industry Breakdown:')
  console.log('-'.repeat(60))
  
  Object.entries(industryStats).forEach(([industry, stats]) => {
    const icon = stats.percentage === 100 ? '✅' : stats.percentage > 0 ? '🟡' : '❌'
    const bar = generateProgressBar(stats.converted, stats.total, 20)
    
    console.log(`${icon} ${industry.padEnd(20)} [${bar}] ${stats.converted}/${stats.total} (${stats.percentage}%)`)
    
    if (stats.pending.length > 0 && stats.pending.length <= 5) {
      console.log(`   Pending: ${stats.pending.join(', ')}`)
    }
  })

  // Recommendations
  console.log('\n📋 Recommendations:')
  const priorityIndustries = Object.entries(industryStats)
    .filter(([_, stats]) => stats.percentage > 0 && stats.percentage < 100)
    .sort((a, b) => b[1].percentage - a[1].percentage)
    .slice(0, 3)

  if (priorityIndustries.length > 0) {
    console.log('\nContinue converting these industries:')
    priorityIndustries.forEach(([industry, stats]) => {
      console.log(`  - ${industry}: ${stats.pending.length} pages remaining`)
      console.log(`    npm run convert-industry ${industry}`)
    })
  }

  const notStarted = Object.entries(industryStats)
    .filter(([_, stats]) => stats.percentage === 0)
    .map(([industry]) => industry)

  if (notStarted.length > 0) {
    console.log('\nNot started yet:')
    notStarted.forEach(industry => {
      console.log(`  - ${industry}: npm run convert-industry ${industry}`)
    })
  }

  // Quick wins
  console.log('\n⚡ Quick Wins (single page conversions):')
  Object.entries(industryStats).forEach(([industry, stats]) => {
    if (stats.pending.length === 1) {
      console.log(`  npm run convert-universal ${industry} ${stats.pending[0]}`)
    }
  })

  // Summary
  console.log('\n📊 Summary:')
  console.log(`  - Total Industries: ${Object.keys(INDUSTRY_PAGES).length}`)
  console.log(`  - Total Pages: ${totalPages}`)
  console.log(`  - Converted: ${totalConverted}`)
  console.log(`  - Remaining: ${totalPages - totalConverted}`)
  console.log(`  - Completion: ${Math.round((totalConverted/totalPages)*100)}%`)
  
  if (totalConverted === totalPages) {
    console.log('\n🎉 Congratulations! All pages have been converted!')
  }
}

function getEntityName(page) {
  const config = UNIVERSAL_PAGE_CONFIGS[page]
  if (config) {
    return config.entityType.charAt(0).toUpperCase() + config.entityType.slice(1)
  }
  return page.charAt(0).toUpperCase() + page.slice(1)
}

function generateProgressBar(current, total, width) {
  const percentage = current / total
  const filled = Math.round(width * percentage)
  const empty = width - filled
  
  return '█'.repeat(filled) + '░'.repeat(empty)
}

// Run the check
checkConversionProgress()