#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

async function seedQualityData() {
  console.log('🔍 Seeding Quality Management data for Kerala Furniture Works...')
  
  try {
    // Get existing products
    const { data: products } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'product')
      .like('smart_code', 'HERA.FURNITURE.PRODUCT%')
      .limit(10)
    
    if (!products || products.length === 0) {
      console.error('No products found. Please run seed-furniture-catalog.js first')
      return
    }
    
    console.log(`Found ${products.length} products`)
    
    // Create quality inspectors
    const inspectors = [
      { entity_code: 'QI-001', entity_name: 'Rajesh Kumar', designation: 'Senior Quality Inspector' },
      { entity_code: 'QI-002', entity_name: 'Priya Nair', designation: 'Quality Inspector' },
      { entity_code: 'QI-003', entity_name: 'Ahmed Hassan', designation: 'Lead Quality Auditor' }
    ]
    
    console.log('\n👨‍🔬 Creating quality inspectors...')
    for (const inspector of inspectors) {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'employee',
          entity_code: inspector.entity_code,
          entity_name: inspector.entity_name,
          smart_code: 'HERA.FURNITURE.QUALITY.INSPECTOR.v1',
          organization_id: FURNITURE_ORG_ID,
          status: 'active',
          metadata: {
            designation: inspector.designation,
            department: 'Quality Control'
          }
        })
      
      if (!error) {
        console.log(`✅ Created inspector: ${inspector.entity_name}`)
      }
    }
    
    // Create quality inspection transactions
    const inspectionTypes = ['incoming', 'in_process', 'final', 'random']
    const inspections = []
    const now = Date.now()
    
    console.log('\n📋 Creating quality inspections...')
    for (let i = 0; i < 20; i++) {
      const product = products[i % products.length]
      const inspectionType = inspectionTypes[i % inspectionTypes.length]
      const passRate = Math.floor(Math.random() * 15) + 85 // 85-100%
      const status = passRate >= 95 ? 'passed' : passRate >= 90 ? 'passed' : passRate >= 80 ? 'pending' : 'failed'
      
      const inspection = {
        transaction_type: 'quality_inspection',
        transaction_code: `QC-2025-${String(i + 1).padStart(4, '0')}`,
        transaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        smart_code: 'HERA.FURNITURE.QUALITY.INSPECTION.v1',
        source_entity_id: product.id,
        total_amount: Math.floor(Math.random() * 20) + 5, // Sample size
        metadata: {
          inspection_type: inspectionType,
          batch_number: `BATCH-2025-${String(i + 1).padStart(4, '0')}`,
          pass_rate: passRate,
          status: status,
          samples_tested: Math.floor(Math.random() * 20) + 5,
          defects_found: Math.floor((100 - passRate) / 10),
          inspector: inspectors[i % inspectors.length].entity_name,
          product_name: product.entity_name,
          product_code: product.entity_code,
          checklist: [
            { item: 'Dimensions', result: passRate > 90 ? 'Pass' : 'Fail' },
            { item: 'Finish Quality', result: passRate > 85 ? 'Pass' : 'Fail' },
            { item: 'Material Consistency', result: passRate > 88 ? 'Pass' : 'Fail' },
            { item: 'Joint Strength', result: passRate > 92 ? 'Pass' : 'Fail' },
            { item: 'Hardware Alignment', result: passRate > 90 ? 'Pass' : 'Fail' }
          ],
          notes: status === 'failed' ? 'Multiple defects found, requires rework' : 
                 status === 'pending' ? 'Minor issues identified, awaiting resolution' : 
                 'All quality standards met'
        },
        organization_id: FURNITURE_ORG_ID
      }
      
      const { error } = await supabase
        .from('universal_transactions')
        .insert(inspection)
      
      if (!error) {
        console.log(`✅ Created inspection: ${inspection.transaction_code} (${inspection.metadata.status})`)
        inspections.push(inspection)
      } else {
        console.error(`Error creating inspection:`, error.message)
      }
    }
    
    // Create quality issues
    const issueTypes = ['dimension', 'finish', 'material', 'assembly', 'packaging']
    const severities = ['critical', 'major', 'minor']
    const resolutionStatuses = ['open', 'in_progress', 'resolved']
    
    console.log('\n⚠️ Creating quality issues...')
    for (let i = 0; i < 15; i++) {
      const product = products[i % products.length]
      const issueType = issueTypes[i % issueTypes.length]
      const severity = severities[i % severities.length]
      const resolutionStatus = resolutionStatuses[i % resolutionStatuses.length]
      
      const issue = {
        entity_type: 'quality_issue',
        entity_code: `QI-2025-${String(i + 1).padStart(4, '0')}`,
        entity_name: `Quality Issue - ${product.entity_name}`,
        smart_code: 'HERA.FURNITURE.QUALITY.ISSUE.v1',
        status: resolutionStatus === 'resolved' ? 'resolved' : 'active',
        metadata: {
          product_name: product.entity_name,
          product_id: product.id,
          batch_number: `BATCH-2025-${String(i + 1).padStart(4, '0')}`,
          issue_type: issueType,
          severity: severity,
          reported_date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
          resolution_status: resolutionStatus,
          corrective_action: resolutionStatus === 'resolved' ? 
            (i % 3 === 0 ? 'Rework completed' : i % 3 === 1 ? 'Training provided' : 'Process updated') : 
            null,
          description: getIssueDescription(issueType),
          root_cause: resolutionStatus !== 'open' ? getRootCause(issueType) : null,
          prevention_measure: resolutionStatus === 'resolved' ? getPreventionMeasure(issueType) : null,
          estimated_cost: severity === 'critical' ? Math.floor(Math.random() * 50000) + 10000 :
                         severity === 'major' ? Math.floor(Math.random() * 10000) + 5000 :
                         Math.floor(Math.random() * 5000) + 1000
        },
        organization_id: FURNITURE_ORG_ID
      }
      
      const { error } = await supabase
        .from('core_entities')
        .insert(issue)
      
      if (!error) {
        console.log(`✅ Created issue: ${issue.entity_code} (${severity} - ${resolutionStatus})`)
      } else {
        console.error(`Error creating issue:`, error.message)
      }
    }
    
    // Create some quality certifications as dynamic data
    console.log('\n🏆 Creating quality certifications...')
    const certifications = [
      { standard: 'ISO 9001:2015', status: 'Certified', expiry: '2026-12-31' },
      { standard: 'ISI Mark', status: 'Certified', expiry: '2025-06-30' },
      { standard: 'FSC Certified', status: 'Certified', expiry: '2025-09-30' }
    ]
    
    // Create a certification entity
    const { data: certEntity } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'certification',
        entity_code: 'CERT-ORG-001',
        entity_name: 'Organization Quality Certifications',
        smart_code: 'HERA.FURNITURE.QUALITY.CERTIFICATION.v1',
        organization_id: FURNITURE_ORG_ID,
        status: 'active'
      })
      .select()
      .single()
    
    if (certEntity) {
      for (const cert of certifications) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            entity_id: certEntity.id,
            field_name: cert.standard,
            field_value_text: cert.status,
            field_value_date: cert.expiry,
            smart_code: 'HERA.FURNITURE.QUALITY.CERT.DATA.v1',
            organization_id: FURNITURE_ORG_ID
          })
        
        console.log(`✅ Added certification: ${cert.standard}`)
      }
    }
    
    console.log('\n✅ Quality Management data seeding completed!')
    console.log(`
Summary:
- ${inspectors.length} Quality Inspectors
- ${inspections.length} Quality Inspections
- ${15} Quality Issues
- ${certifications.length} Quality Certifications
    `)
    
  } catch (error) {
    console.error('Error seeding quality data:', error)
  }
}

function getIssueDescription(issueType) {
  const descriptions = {
    dimension: 'Product dimensions out of specification by 5mm',
    finish: 'Surface finish showing visible scratches and uneven coating',
    material: 'Wood grain inconsistency detected in multiple panels',
    assembly: 'Drawer alignment issues causing operational problems',
    packaging: 'Packaging damage leading to potential product harm'
  }
  return descriptions[issueType] || 'Quality issue detected'
}

function getRootCause(issueType) {
  const causes = {
    dimension: 'Calibration error in cutting machine',
    finish: 'Improper spray gun pressure settings',
    material: 'Supplier batch variation not caught during receiving',
    assembly: 'Jig misalignment in assembly station',
    packaging: 'Inadequate cushioning material specification'
  }
  return causes[issueType] || 'Under investigation'
}

function getPreventionMeasure(issueType) {
  const measures = {
    dimension: 'Daily calibration checks implemented',
    finish: 'Automated pressure monitoring system installed',
    material: 'Enhanced incoming material inspection protocol',
    assembly: 'Weekly jig inspection checklist created',
    packaging: 'Updated packaging specification with double cushioning'
  }
  return measures[issueType] || 'Corrective action taken'
}

seedQualityData().catch(console.error)