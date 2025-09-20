#!/usr/bin/env node

/**
 * HERA Procedure Registry Loader
 * Registers all procedures from /hera/procedures/*.yml into core_dynamic_data
 * This enables the orchestration engine to discover and execute procedures
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')
const yaml = require('js-yaml')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Platform organization ID (procedures are platform-level)
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

async function main() {
  console.log('🚀 HERA Procedure Registry Loader')
  console.log('================================\n')

  try {
    // Step 1: Ensure Platform organization exists
    console.log('1️⃣ Checking Platform organization...')
    const { data: platformOrg, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', PLATFORM_ORG_ID)
      .single()

    if (orgError || !platformOrg) {
      console.error('❌ Platform organization not found. Run: node create-platform-production.js')
      process.exit(1)
    }
    console.log('✅ Platform organization found\n')

    // Step 2: Create or find Procedure Registry entity
    console.log('2️⃣ Setting up Procedure Registry entity...')
    let procedureRegistryEntity
    
    // Check if registry entity exists
    const { data: existingRegistry } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', PLATFORM_ORG_ID)
      .eq('entity_type', 'system_registry')
      .eq('entity_code', 'PROCEDURE_REGISTRY')
      .single()

    if (existingRegistry) {
      procedureRegistryEntity = existingRegistry
      console.log('✅ Found existing Procedure Registry entity:', procedureRegistryEntity.id)
    } else {
      // Create registry entity
      const { data: newRegistry, error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'system_registry',
          entity_name: 'HERA Procedure Registry',
          entity_code: 'PROCEDURE_REGISTRY',
          smart_code: 'HERA.SYS.REGISTRY.PROC.REG.v1',
          metadata: {
            description: 'Central registry for all HERA procedures',
            registry_type: 'procedures',
            version: '1.0.0',
            is_system_entity: true
          }
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create registry entity:', createError)
        process.exit(1)
      }
      
      procedureRegistryEntity = newRegistry
      console.log('✅ Created new Procedure Registry entity:', procedureRegistryEntity.id)
    }
    console.log()

    // Step 3: Load all procedure and orchestration files
    console.log('3️⃣ Loading procedure and orchestration files...')
    
    // Load procedures from main procedures directory
    const proceduresDir = path.join(__dirname, '..', 'hera', 'procedures')
    const procedureFiles = (await fs.readdir(proceduresDir))
      .filter(f => f.endsWith('.yml') && f !== 'TEMPLATE.yml')
      .map(f => ({ file: f, dir: proceduresDir, type: 'procedure' }))

    // Also scan playbooks for procedure subdirectories
    const playbooksDir = path.join(__dirname, '..', 'hera', 'playbooks')
    
    async function findPlaybookProcedures(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            if (entry.name === 'procedures') {
              // Found a procedures subdirectory
              const procFiles = await fs.readdir(fullPath)
              const validProcFiles = procFiles
                .filter(f => f.endsWith('.yml'))
                .map(f => ({ 
                  file: f, 
                  dir: fullPath, 
                  type: 'procedure',
                  relativePath: path.relative(playbooksDir, path.join(fullPath, f))
                }))
              procedureFiles.push(...validProcFiles)
            } else {
              // Recurse into subdirectories
              await findPlaybookProcedures(fullPath)
            }
          }
        }
      } catch (error) {
        // Skip if directory doesn't exist or can't be read
      }
    }
    
    await findPlaybookProcedures(playbooksDir)
    
    // Load orchestrations from playbooks
    const orchestrationFiles = []
    
    async function findOrchestrations(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            await findOrchestrations(fullPath)
          } else if (entry.name.endsWith('.yml') && entry.name.includes('orchestration')) {
            orchestrationFiles.push({ 
              file: entry.name, 
              dir: dir, 
              type: 'orchestration',
              relativePath: path.relative(playbooksDir, fullPath)
            })
          }
        }
      } catch (error) {
        // Skip if directory doesn't exist
      }
    }
    
    await findOrchestrations(playbooksDir)
    
    const allFiles = [...procedureFiles, ...orchestrationFiles]
    
    console.log(`📁 Found ${procedureFiles.length} procedure files`)
    console.log(`📁 Found ${orchestrationFiles.length} orchestration files`)
    console.log(`📁 Total: ${allFiles.length} files to process\n`)

    // Step 4: Process each file
    const results = {
      registered: [],
      updated: [],
      failed: []
    }

    for (const fileInfo of allFiles) {
      try {
        console.log(`📄 Processing ${fileInfo.type}: ${fileInfo.file}...`)
        
        // Read and parse YAML
        const filePath = path.join(fileInfo.dir, fileInfo.file)
        const yamlContent = await fs.readFile(filePath, 'utf8')
        const spec = yaml.load(yamlContent)
        
        if (!spec.smart_code) {
          console.warn(`⚠️  Skipping ${fileInfo.file} - no smart_code defined`)
          results.failed.push({ file: fileInfo.file, reason: 'no smart_code' })
          continue
        }

        // Normalize smart code to uppercase V format (e.g., .v1 → .V1)
        spec.smart_code = spec.smart_code.replace(/\.v(\d+)$/, '.V$1')

        // Determine field name based on type
        const fieldName = fileInfo.type === 'orchestration' ? 'orchestration_spec' : 'procedure_spec'

        // Check if spec already registered
        const { data: existing } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('entity_id', procedureRegistryEntity.id)
          .eq('field_name', fieldName)
          .eq('smart_code', spec.smart_code)
          .single()

        // Create/find anchor entity for this spec
        const anchorEntityType = fileInfo.type === 'orchestration' ? 'orchestration' : 'procedure'
        const anchorSmartCode = fileInfo.type === 'orchestration' 
          ? 'HERA.SYS.ORCHESTRATION.DEFINITION.ANCHOR.v1'
          : 'HERA.SYS.PROCEDURE.DEFINITION.ANCHOR.v1'

        let anchorEntity
        const { data: existingAnchor } = await supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', PLATFORM_ORG_ID)
          .eq('entity_type', anchorEntityType)
          .eq('entity_code', spec.smart_code)
          .single()

        if (existingAnchor) {
          anchorEntity = existingAnchor
        } else {
          // Create anchor entity
          const { data: newAnchor, error: anchorError } = await supabase
            .from('core_entities')
            .insert({
              organization_id: PLATFORM_ORG_ID,
              entity_type: anchorEntityType,
              entity_name: spec.smart_code,
              entity_code: spec.smart_code,
              smart_code: anchorSmartCode,
              metadata: {
                spec_type: fileInfo.type,
                intent: spec.intent,
                file_path: fileInfo.relativePath || fileInfo.file
              }
            })
            .select()
            .single()

          if (anchorError) {
            console.error(`❌ Failed to create anchor entity for ${spec.smart_code}:`, anchorError)
            results.failed.push({ file: fileInfo.file, reason: anchorError.message })
            continue
          }
          anchorEntity = newAnchor
        }

        if (existing) {
          // Version immutability check
          const existingChecksum = existing.ai_insights?.checksum
          const newChecksum = generateChecksum(yamlContent)
          
          if (existingChecksum && existingChecksum !== newChecksum) {
            const versionMatch = spec.smart_code.match(/\.v(\d+)$/)
            if (versionMatch) {
              console.error(`❌ Content changed for ${spec.smart_code} without version bump`)
              console.error(`   → Bump to v${parseInt(versionMatch[1]) + 1} to update`)
              results.failed.push({ file: fileInfo.file, reason: 'Version immutability violation - bump version' })
              continue
            }
          }

          // Update existing registration
          const { error: updateError } = await supabase
            .from('core_dynamic_data')
            .update({
              field_value_json: spec,
              ai_insights: {
                last_updated: new Date().toISOString(),
                file_name: fileInfo.file,
                file_path: fileInfo.relativePath || fileInfo.file,
                file_type: fileInfo.type,
                checksum: generateChecksum(yamlContent)
              }
            })
            .eq('id', existing.id)

          if (updateError) {
            console.error(`❌ Failed to update ${spec.smart_code}:`, updateError)
            results.failed.push({ file: fileInfo.file, reason: updateError.message })
          } else {
            console.log(`✅ Updated: ${spec.smart_code}`)
            results.updated.push(spec.smart_code)
          }
        } else {
          // Create new registration
          const { error: insertError } = await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: PLATFORM_ORG_ID,
              entity_id: anchorEntity.id,
              field_name: fieldName,
              field_type: 'json',
              field_value_json: spec,
              smart_code: spec.smart_code,
              ai_confidence: 1.0,
              ai_insights: {
                registered_at: new Date().toISOString(),
                file_name: fileInfo.file,
                file_path: fileInfo.relativePath || fileInfo.file,
                file_type: fileInfo.type,
                checksum: generateChecksum(yamlContent),
                registry_type: fileInfo.type
              },
              is_system_field: true
            })

          if (insertError) {
            console.error(`❌ Failed to register ${spec.smart_code}:`, insertError)
            results.failed.push({ file: fileInfo.file, reason: insertError.message })
          } else {
            console.log(`✅ Registered: ${spec.smart_code}`)
            results.registered.push(spec.smart_code)
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${fileInfo.file}:`, error.message)
        results.failed.push({ file: fileInfo.file, reason: error.message })
      }
    }

    // Step 5: Summary
    console.log('\n📊 Registration Summary')
    console.log('======================')
    console.log(`✅ Newly Registered: ${results.registered.length}`)
    if (results.registered.length > 0) {
      results.registered.forEach(code => console.log(`   - ${code}`))
    }
    
    console.log(`🔄 Updated: ${results.updated.length}`)
    if (results.updated.length > 0) {
      results.updated.forEach(code => console.log(`   - ${code}`))
    }
    
    if (results.failed.length > 0) {
      console.log(`❌ Failed: ${results.failed.length}`)
      results.failed.forEach(({ file, reason }) => console.log(`   - ${file}: ${reason}`))
    }

    // Step 6: Create audit transaction
    console.log('\n📝 Creating audit transaction...')
    const { error: auditError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: PLATFORM_ORG_ID,
        transaction_type: 'procedure_registry_sync',
        smart_code: 'HERA.SYS.REGISTRY.SYNC.PROCEDURES.v1',
        source_entity_id: procedureRegistryEntity.id,
        total_amount: 0,
        transaction_status: 'completed',
        ai_confidence: 1.0,
        metadata: {
          registered_count: results.registered.length,
          updated_count: results.updated.length,
          failed_count: results.failed.length,
          procedures: [...results.registered, ...results.updated],
          timestamp: new Date().toISOString()
        }
      })

    if (auditError) {
      console.warn('⚠️  Failed to create audit transaction:', auditError.message)
    } else {
      console.log('✅ Audit trail created')
    }

    console.log('\n✨ Procedure registration complete!')

  } catch (error) {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  }
}

/**
 * Generate a simple checksum for change detection
 */
function generateChecksum(content) {
  const crypto = require('crypto')
  return crypto.createHash('md5').update(content).digest('hex')
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main }