#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

async function checkQualityData() {
  console.log('🔍 Checking Quality Management data for Kerala Furniture Works...\n')
  
  try {
    // Check inspections
    const { data: inspections, count: inspectionCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact' })
      .eq('organization_id', FURNITURE_ORG_ID)
      .or('transaction_type.eq.quality_inspection,smart_code.like.%QUALITY.INSPECTION%')
    
    console.log(`📋 Quality Inspections: ${inspectionCount || 0}`)
    if (inspections && inspections.length > 0) {
      // Group by status
      const statusCounts = {}
      inspections.forEach(i => {
        const status = i.metadata?.status || 'unknown'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
      console.log('   Status breakdown:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`)
      })
      
      // Calculate average pass rate
      const passRates = inspections
        .map(i => i.metadata?.pass_rate)
        .filter(r => r !== undefined)
      const avgPassRate = passRates.length > 0
        ? (passRates.reduce((sum, r) => sum + r, 0) / passRates.length).toFixed(1)
        : 0
      console.log(`   Average pass rate: ${avgPassRate}%`)
    }
    
    // Check quality issues
    const { data: issues, count: issueCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact' })
      .eq('organization_id', FURNITURE_ORG_ID)
      .or('entity_type.eq.quality_issue,smart_code.like.%QUALITY.ISSUE%')
    
    console.log(`\n⚠️ Quality Issues: ${issueCount || 0}`)
    if (issues && issues.length > 0) {
      // Group by resolution status
      const resolutionCounts = {}
      issues.forEach(i => {
        const status = i.metadata?.resolution_status || 'unknown'
        resolutionCounts[status] = (resolutionCounts[status] || 0) + 1
      })
      console.log('   Resolution status:')
      Object.entries(resolutionCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`)
      })
      
      // Group by severity
      const severityCounts = {}
      issues.forEach(i => {
        const severity = i.metadata?.severity || 'unknown'
        severityCounts[severity] = (severityCounts[severity] || 0) + 1
      })
      console.log('   Severity breakdown:')
      Object.entries(severityCounts).forEach(([severity, count]) => {
        console.log(`   - ${severity}: ${count}`)
      })
    }
    
    // Check inspectors
    const { data: inspectors, count: inspectorCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact' })
      .eq('organization_id', FURNITURE_ORG_ID)
      .like('smart_code', '%QUALITY.INSPECTOR%')
    
    console.log(`\n👨‍🔬 Quality Inspectors: ${inspectorCount || 0}`)
    inspectors?.forEach(i => {
      console.log(`   - ${i.entity_name} (${i.entity_code}) - ${i.metadata?.designation || 'Inspector'}`)
    })
    
    // Check certifications
    const { data: certEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'certification')
      .single()
    
    if (certEntity) {
      const { data: certData } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', certEntity.id)
      
      console.log(`\n🏆 Quality Certifications: ${certData?.length || 0}`)
      certData?.forEach(c => {
        console.log(`   - ${c.field_name}: ${c.field_value_text} (Expires: ${new Date(c.field_value_date).toLocaleDateString()})`)
      })
    }
    
    console.log('\n✅ Quality data check completed!')
    
  } catch (error) {
    console.error('Error checking quality data:', error)
  }
}

checkQualityData().catch(console.error)