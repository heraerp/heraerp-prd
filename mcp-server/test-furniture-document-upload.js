#!/usr/bin/env node

/**
 * Test script for furniture document upload functionality
 * Verifies that documents are properly saved to Supabase and linked in universal tables
 */

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249' // Kerala Furniture Works

async function testDocumentUpload() {
  console.log('🧪 Testing Furniture Document Upload System...\n')
  
  try {
    // 1. Check if organization exists
    console.log('1️⃣ Checking furniture organization...')
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', FURNITURE_ORG_ID)
      .single()
    
    if (orgError || !org) {
      console.error('❌ Furniture organization not found:', orgError)
      return
    }
    
    console.log('✅ Found organization:', org.organization_name)
    console.log('   Organization ID:', org.id)
    console.log('   Organization Type:', org.organization_type)
    
    // 2. Check storage bucket
    console.log('\n2️⃣ Checking storage bucket...')
    const { data: buckets } = await supabase.storage.listBuckets()
    const furnitureBucket = buckets?.find(b => b.name === 'furniture-documents')
    
    if (furnitureBucket) {
      console.log('✅ Storage bucket exists:', furnitureBucket.name)
    } else {
      console.log('⚠️  Storage bucket not found - will be created on first upload')
    }
    
    // 3. Check recent document uploads
    console.log('\n3️⃣ Checking recent document uploads...')
    const { data: documents, error: docError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner (
          field_name,
          field_value_text,
          field_value_json
        )
      `)
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'document')
      .eq('core_dynamic_data.field_name', 'file_url')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (docError) {
      console.error('❌ Error querying documents:', docError)
    } else if (!documents || documents.length === 0) {
      console.log('ℹ️  No documents found for this organization')
    } else {
      console.log(`✅ Found ${documents.length} document(s):`)
      documents.forEach((doc, index) => {
        const fileUrl = doc.core_dynamic_data?.[0]?.field_value_text
        const metadata = doc.core_dynamic_data?.[0]?.field_value_json
        console.log(`\n   ${index + 1}. ${doc.entity_name}`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      Code: ${doc.entity_code}`)
        console.log(`      Created: ${new Date(doc.created_at).toLocaleString()}`)
        console.log(`      URL: ${fileUrl ? '✓ Stored' : '✗ Missing'}`)
        console.log(`      Path: ${metadata?.storage_path || 'N/A'}`)
      })
    }
    
    // 4. Check related transactions
    console.log('\n4️⃣ Checking document upload transactions...')
    const { data: transactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('transaction_type', 'document_upload')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (txnError) {
      console.error('❌ Error querying transactions:', txnError)
    } else if (!transactions || transactions.length === 0) {
      console.log('ℹ️  No document upload transactions found')
    } else {
      console.log(`✅ Found ${transactions.length} upload transaction(s):`)
      transactions.forEach((txn, index) => {
        console.log(`\n   ${index + 1}. ${txn.transaction_code}`)
        console.log(`      Date: ${new Date(txn.transaction_date).toLocaleString()}`)
        console.log(`      Document ID: ${txn.source_entity_id || 'N/A'}`)
        console.log(`      Metadata:`, JSON.stringify(txn.metadata, null, 2))
      })
    }
    
    // 5. Check document analysis records
    console.log('\n5️⃣ Checking document analysis records...')
    const { data: analysisData, error: analysisError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('field_name', 'document_analysis')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (analysisError) {
      console.error('❌ Error querying analysis data:', analysisError)
    } else if (!analysisData || analysisData.length === 0) {
      console.log('ℹ️  No document analysis records found')
    } else {
      console.log(`✅ Found ${analysisData.length} analysis record(s):`)
      analysisData.forEach((analysis, index) => {
        const data = analysis.field_value_json
        console.log(`\n   ${index + 1}. Entity ID: ${analysis.entity_id}`)
        console.log(`      Vendor: ${data?.vendor_name || 'N/A'}`)
        console.log(`      Amount: ₹${data?.total_amount?.toLocaleString('en-IN') || 'N/A'}`)
        console.log(`      Furniture Related: ${data?.is_furniture_related ? '✓' : '✗'}`)
        console.log(`      Category: ${data?.category || 'N/A'}`)
      })
    }
    
    // 6. Test storage access
    console.log('\n6️⃣ Testing storage access...')
    if (documents && documents.length > 0) {
      const firstDoc = documents[0]
      const fileUrl = firstDoc.core_dynamic_data?.[0]?.field_value_text
      const storagePath = firstDoc.core_dynamic_data?.[0]?.field_value_json?.storage_path
      
      if (storagePath) {
        console.log(`   Checking file: ${storagePath}`)
        
        // Try to download the file
        const { data: fileData, error: fileError } = await supabase.storage
          .from('furniture-documents')
          .download(storagePath)
        
        if (fileError) {
          console.log('❌ File not accessible:', fileError.message)
        } else {
          console.log('✅ File accessible from storage')
          console.log(`   File size: ${fileData.size} bytes`)
          console.log(`   File type: ${fileData.type}`)
        }
      }
    }
    
    console.log('\n✨ Document Upload System Test Complete!')
    
    // Summary
    console.log('\n📊 Summary:')
    console.log(`   Organization: ${org.organization_name}`)
    console.log(`   Documents Found: ${documents?.length || 0}`)
    console.log(`   Upload Transactions: ${transactions?.length || 0}`)
    console.log(`   Analysis Records: ${analysisData?.length || 0}`)
    console.log(`   Storage Bucket: ${furnitureBucket ? 'Ready' : 'Will be created on upload'}`)
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
  }
}

// Run the test
testDocumentUpload()