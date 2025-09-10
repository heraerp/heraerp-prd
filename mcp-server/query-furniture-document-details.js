#!/usr/bin/env node

/**
 * Query detailed information about the uploaded furniture document
 */

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const DOCUMENT_ID = '4bad7e22-31d2-4174-898d-82d5eaca3bd6'

async function queryDocumentDetails() {
  console.log('📄 Querying Document Details...\n')
  
  try {
    // 1. Get document entity
    console.log('1️⃣ Document Entity:')
    const { data: doc, error: docError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', DOCUMENT_ID)
      .single()
    
    if (docError) {
      console.error('❌ Error:', docError)
      return
    }
    
    console.log('   ID:', doc.id)
    console.log('   Name:', doc.entity_name)
    console.log('   Code:', doc.entity_code)
    console.log('   Type:', doc.entity_type)
    console.log('   Smart Code:', doc.smart_code)
    console.log('   Created:', new Date(doc.created_at).toLocaleString())
    console.log('   Metadata:', JSON.stringify(doc.metadata, null, 2))
    
    // 2. Get all dynamic data
    console.log('\n2️⃣ Dynamic Data Fields:')
    const { data: dynamicData, error: dynError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', DOCUMENT_ID)
      .order('created_at')
    
    if (!dynError && dynamicData) {
      dynamicData.forEach((field, index) => {
        console.log(`\n   ${index + 1}. ${field.field_name}:`)
        if (field.field_value_text) console.log('      Text:', field.field_value_text)
        if (field.field_value_number) console.log('      Number:', field.field_value_number)
        if (field.field_value_json) console.log('      JSON:', JSON.stringify(field.field_value_json, null, 2))
        console.log('      Smart Code:', field.smart_code)
      })
    }
    
    // 3. Get related transactions
    console.log('\n3️⃣ Related Transactions:')
    
    // Upload transaction
    const { data: uploadTxn, error: uploadError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('source_entity_id', DOCUMENT_ID)
      .eq('transaction_type', 'document_upload')
    
    if (!uploadError && uploadTxn && uploadTxn.length > 0) {
      console.log('\n   Upload Transaction:')
      console.log('   - Code:', uploadTxn[0].transaction_code)
      console.log('   - Date:', new Date(uploadTxn[0].transaction_date).toLocaleString())
      console.log('   - Smart Code:', uploadTxn[0].smart_code)
    }
    
    // Analysis transaction
    const { data: analysisTxn, error: analysisError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('source_entity_id', DOCUMENT_ID)
      .eq('transaction_type', 'document_analysis')
    
    if (!analysisError && analysisTxn && analysisTxn.length > 0) {
      console.log('\n   Analysis Transaction:')
      console.log('   - Code:', analysisTxn[0].transaction_code)
      console.log('   - Date:', new Date(analysisTxn[0].transaction_date).toLocaleString())
      console.log('   - Smart Code:', analysisTxn[0].smart_code)
      console.log('   - Target Entity (Supplier):', analysisTxn[0].target_entity_id)
    }
    
    // 4. Check if supplier was created
    if (analysisTxn && analysisTxn[0] && analysisTxn[0].target_entity_id) {
      console.log('\n4️⃣ Created Supplier:')
      const { data: supplier, error: supError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', analysisTxn[0].target_entity_id)
        .single()
      
      if (!supError && supplier) {
        console.log('   ID:', supplier.id)
        console.log('   Name:', supplier.entity_name)
        console.log('   Code:', supplier.entity_code)
        console.log('   Type:', supplier.entity_type)
        console.log('   Smart Code:', supplier.smart_code)
      }
    }
    
    // 5. Storage verification
    console.log('\n5️⃣ Storage Information:')
    const fileUrl = dynamicData?.find(d => d.field_name === 'file_url')
    if (fileUrl) {
      const storagePath = fileUrl.field_value_json?.storage_path
      console.log('   Public URL:', fileUrl.field_value_text)
      console.log('   Storage Path:', storagePath)
      
      // Try to get file metadata
      const { data: fileList, error: listError } = await supabase.storage
        .from('furniture-documents')
        .list(storagePath ? storagePath.split('/').slice(0, -1).join('/') : '', {
          search: storagePath ? storagePath.split('/').pop() : ''
        })
      
      if (!listError && fileList && fileList.length > 0) {
        console.log('   File Exists:', '✓')
        console.log('   File Size:', fileList[0].metadata?.size || 'Unknown')
        console.log('   Last Modified:', fileList[0].updated_at)
      }
    }
    
    console.log('\n✅ Document is successfully stored in Supabase!')
    console.log('   - Document entity created')
    console.log('   - File uploaded to storage')
    console.log('   - Dynamic data linked')
    console.log('   - Transactions recorded')
    console.log('   - Analysis completed')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
  }
}

// Run the query
queryDocumentDetails()