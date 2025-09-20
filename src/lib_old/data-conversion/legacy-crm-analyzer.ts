/**
 * 🎯 HERA Universal Legacy Data Conversion Analyzer
 * Chief Data Architect Analysis & Mapping Strategy
 *
 * 🧠 AI-POWERED INTELLIGENT FEATURES:
 * - Deep JSON structure analysis and smart column mapping
 * - Automatic relationship detection between entities
 * - Business context understanding and industry detection
 * - Confidence scoring for all mapping decisions
 *
 * Converts legacy CRM data to HERA's 6 Universal Tables:
 * 1. core_organizations
 * 2. core_entities
 * 3. core_dynamic_data
 * 4. core_relationships
 * 5. universal_transactions
 * 6. universal_transaction_lines
 */

export interface LegacyCRMRecord {
  id: string
  project_id: string
  company_name: string
  sector: string
  amount: number
  remarks: string
  agency: string
  country: string
  state: string
  city: string
  promoter_name_1: string
  designation_promoter_1: string
  contact_no_promoter_1: string
  promoter_name_2?: string
  designation_promoter_2?: string
  contact_no_promoter_2?: string
  services: string
  feedback: string
  next_call_date: string
  reminder_email: string
  resource: string
  created_at: string
  updated_at: string
  custom_fields: any // JSON object
  status: string
}

export interface HERAUniversalMapping {
  core_organizations: any[]
  core_entities: any[]
  core_dynamic_data: any[]
  core_relationships: any[]
  universal_transactions: any[]
  universal_transaction_lines: any[]
}

/**
 * 🏗️ HERA CHIEF DATA ARCHITECT ANALYSIS
 * =======================================
 *
 * ENTITY STRUCTURE IDENTIFICATION:
 *
 * 1. ORGANIZATIONS (core_organizations):
 *    - Primary: Customer companies (company_name)
 *    - Secondary: Agency organizations (CRISIL, etc.)
 *    - Geographic: Country/State/City hierarchy
 *
 * 2. ENTITIES (core_entities):
 *    - Companies: Each company_name → entity_type='customer'
 *    - Promoters: Each promoter → entity_type='contact'
 *    - Projects: Each project_id → entity_type='project'
 *    - Services: Each service → entity_type='service_offering'
 *
 * 3. DYNAMIC DATA (core_dynamic_data):
 *    - Company details: sector, agency, location data
 *    - Contact details: designations, phone numbers
 *    - Project details: amount, status, custom_fields JSON
 *    - Service details: feedback, next_call_date
 *
 * 4. RELATIONSHIPS (core_relationships):
 *    - Company ←→ Promoters
 *    - Company ←→ Projects
 *    - Project ←→ Services
 *    - Promoters ←→ Projects (ownership)
 *
 * 5. TRANSACTIONS (universal_transactions):
 *    - Project initiation transactions
 *    - Service delivery transactions
 *    - Follow-up activity transactions
 *
 * 6. TRANSACTION LINES (universal_transaction_lines):
 *    - Project amount breakdown
 *    - Service fee details
 *    - Activity cost tracking
 */

import { HERASmartMappingEngine, SmartMappingResult } from './smart-mapping-engine'

export class HERALegacyCRMConverter {
  private organizationId: string
  private conversionLog: string[] = []
  private smartMappingEngine: HERASmartMappingEngine
  private intelligentMapping: SmartMappingResult | null = null

  constructor(organizationId: string = 'imported_crm_org') {
    this.organizationId = organizationId
    this.smartMappingEngine = new HERASmartMappingEngine('claude', 0.8)
  }

  /**
   * 🎯 Main conversion method - transforms legacy CRM to HERA Universal
   */
  async convertLegacyCRMData(legacyRecords: LegacyCRMRecord[]): Promise<HERAUniversalMapping> {
    this.log('🚀 Starting HERA Universal Legacy Conversion')
    this.log(`📊 Processing ${legacyRecords.length} legacy CRM records`)

    // 🧠 AI-POWERED INTELLIGENT ANALYSIS FIRST
    this.log('🧠 Running AI-powered smart mapping analysis...')
    this.intelligentMapping = await this.smartMappingEngine.analyzeDataIntelligently(legacyRecords)
    this.log(
      `🎯 AI Analysis Complete - Overall Confidence: ${this.intelligentMapping.confidence_scores.overall_confidence}`
    )

    const mapping: HERAUniversalMapping = {
      core_organizations: [],
      core_entities: [],
      core_dynamic_data: [],
      core_relationships: [],
      universal_transactions: [],
      universal_transaction_lines: []
    }

    // Process each legacy record with intelligent mapping guidance
    for (const record of legacyRecords) {
      await this.processLegacyRecord(record, mapping)
    }

    this.log('✅ HERA Universal Conversion Complete')
    this.generateConversionSummary(mapping)
    this.generateIntelligentMappingSummary()

    return mapping
  }

  /**
   * 🏗️ Process individual legacy record into HERA Universal structure
   */
  private async processLegacyRecord(record: LegacyCRMRecord, mapping: HERAUniversalMapping) {
    const companyName = record.company_name || `Record ${record.id || 'unknown'}`
    this.log(`🔄 Processing: ${companyName}`)

    // 1. CREATE ORGANIZATIONS
    await this.createOrganizations(record, mapping)

    // 2. CREATE ENTITIES
    await this.createEntities(record, mapping)

    // 3. CREATE DYNAMIC DATA
    await this.createDynamicData(record, mapping)

    // 4. CREATE RELATIONSHIPS
    await this.createRelationships(record, mapping)

    // 5. CREATE TRANSACTIONS
    await this.createTransactions(record, mapping)

    // 6. CREATE TRANSACTION LINES
    await this.createTransactionLines(record, mapping)
  }

  /**
   * 🏢 Create Organizations (Multi-tenant structure)
   */
  private async createOrganizations(record: LegacyCRMRecord, mapping: HERAUniversalMapping) {
    // Main importing organization
    if (!mapping.core_organizations.find(org => org.organization_id === this.organizationId)) {
      mapping.core_organizations.push({
        organization_id: this.organizationId,
        organization_name: 'Imported CRM Organization',
        organization_code: 'CRM_IMPORT',
        organization_type: 'crm_import',
        country: record.country,
        state: record.state,
        city: record.city,
        status: 'active',
        created_at: new Date(record.created_at),
        smart_code: 'HERA.ORG.CRM.IMPORT.v1'
      })
    }

    // Agency organizations (CRISIL, etc.)
    if (record.agency && record.agency !== '') {
      const agencyOrgId = `agency_${record.agency.toLowerCase().replace(/\s+/g, '_')}`
      if (!mapping.core_organizations.find(org => org.organization_id === agencyOrgId)) {
        mapping.core_organizations.push({
          organization_id: agencyOrgId,
          organization_name: record.agency,
          organization_code: record.agency.substring(0, 10).toUpperCase(),
          organization_type: 'rating_agency',
          country: record.country,
          status: 'active',
          created_at: new Date(record.created_at),
          smart_code: 'HERA.ORG.AGENCY.RATING.v1'
        })
      }
    }
  }

  /**
   * 🎯 Create Entities (Companies, Contacts, Projects, Services)
   */
  private async createEntities(record: LegacyCRMRecord, mapping: HERAUniversalMapping) {
    // 1. COMPANY ENTITY
    mapping.core_entities.push({
      entity_id: record.id,
      organization_id: this.organizationId,
      entity_type: 'customer',
      entity_name: record.company_name || 'Unnamed Company',
      entity_code: this.generateEntityCode('COMP', record.company_name || 'Company'),
      status: record.status || 'active',
      created_at: new Date(record.created_at || new Date()),
      updated_at: new Date(record.updated_at || new Date()),
      smart_code: 'HERA.CRM.CUSTOMER.COMPANY.v1',
      confidence_score: 0.95,
      classification: 'imported_customer'
    })

    // 2. PROJECT ENTITY
    if (record.project_id) {
      const companyName = record.company_name || 'Unknown Company'
      const sector = record.sector || 'General'
      mapping.core_entities.push({
        entity_id: record.project_id,
        organization_id: this.organizationId,
        entity_type: 'project',
        entity_name: `${companyName} - ${sector} Project`,
        entity_code: this.generateEntityCode('PROJ', record.project_id),
        status: record.status || 'active',
        created_at: new Date(record.created_at || new Date()),
        updated_at: new Date(record.updated_at || new Date()),
        smart_code: 'HERA.CRM.PROJECT.RATING.v1',
        confidence_score: 0.9,
        classification: 'customer_project'
      })
    }

    // 3. PROMOTER ENTITIES (Contacts)
    if (record.promoter_name_1) {
      const promoter1Id = `${record.id}_promoter_1`
      mapping.core_entities.push({
        entity_id: promoter1Id,
        organization_id: this.organizationId,
        entity_type: 'contact',
        entity_name: record.promoter_name_1,
        entity_code: this.generateEntityCode('CONT', record.promoter_name_1),
        status: 'active',
        created_at: new Date(record.created_at || new Date()),
        smart_code: 'HERA.CRM.CONTACT.PROMOTER.v1',
        confidence_score: 0.85,
        classification: 'key_contact'
      })
    }

    if (record.promoter_name_2) {
      const promoter2Id = `${record.id}_promoter_2`
      mapping.core_entities.push({
        entity_id: promoter2Id,
        organization_id: this.organizationId,
        entity_type: 'contact',
        entity_name: record.promoter_name_2,
        entity_code: this.generateEntityCode('CONT', record.promoter_name_2),
        status: 'active',
        created_at: new Date(record.created_at || new Date()),
        smart_code: 'HERA.CRM.CONTACT.PROMOTER.v1',
        confidence_score: 0.85,
        classification: 'secondary_contact'
      })
    }

    // 4. SERVICE ENTITY
    if (record.services) {
      const serviceId = `${record.id}_service`
      mapping.core_entities.push({
        entity_id: serviceId,
        organization_id: this.organizationId,
        entity_type: 'service',
        entity_name: record.services,
        entity_code: this.generateEntityCode('SERV', record.services),
        status: 'active',
        created_at: new Date(record.created_at || new Date()),
        smart_code: 'HERA.CRM.SERVICE.OFFERING.v1',
        confidence_score: 0.8,
        classification: 'service_offering'
      })
    }
  }

  /**
   * 📊 Create Dynamic Data (Extended properties) - AI-Enhanced
   */
  private async createDynamicData(record: LegacyCRMRecord, mapping: HERAUniversalMapping) {
    const dynamicData = [
      // Company dynamic data
      {
        entity_id: record.id,
        field_name: 'sector',
        field_value: record.sector,
        field_type: 'text'
      },
      {
        entity_id: record.id,
        field_name: 'agency',
        field_value: record.agency,
        field_type: 'text'
      },
      {
        entity_id: record.id,
        field_name: 'country',
        field_value: record.country,
        field_type: 'text'
      },
      { entity_id: record.id, field_name: 'state', field_value: record.state, field_type: 'text' },
      { entity_id: record.id, field_name: 'city', field_value: record.city, field_type: 'text' },
      {
        entity_id: record.id,
        field_name: 'remarks',
        field_value: record.remarks,
        field_type: 'text'
      },
      {
        entity_id: record.id,
        field_name: 'feedback',
        field_value: record.feedback,
        field_type: 'text'
      },
      {
        entity_id: record.id,
        field_name: 'next_call_date',
        field_value: record.next_call_date,
        field_type: 'datetime'
      },
      {
        entity_id: record.id,
        field_name: 'reminder_email',
        field_value: record.reminder_email,
        field_type: 'text'
      },
      {
        entity_id: record.id,
        field_name: 'resource',
        field_value: record.resource,
        field_type: 'text'
      }
    ]

    // 🧠 AI-ENHANCED JSON FIELD PROCESSING
    if (record.custom_fields && typeof record.custom_fields === 'object') {
      // Check if we have intelligent mapping for custom fields
      const jsonDestinations =
        this.intelligentMapping?.intelligent_column_mapping.json_field_destinations || []
      const customFieldDestinations = jsonDestinations.filter(
        dest => dest.parent_field === 'custom_fields'
      )

      if (customFieldDestinations.length > 0) {
        this.log('🧠 Using AI-guided JSON field mapping for custom_fields')

        // Process each nested field according to AI recommendations
        Object.entries(record.custom_fields).forEach(([key, value]) => {
          const aiDestination = customFieldDestinations.find(dest => dest.json_path === key)

          if (aiDestination) {
            // AI recommends specific handling
            if (aiDestination.recommended_destination.includes('separate record')) {
              // Create as individual dynamic data record with high priority
              dynamicData.push({
                entity_id: record.id,
                field_name: `ai_priority_${key}`,
                field_value: String(value),
                field_type: this.inferFieldType(value),
                ai_confidence: aiDestination.confidence,
                ai_reasoning: aiDestination.business_context
              } as any)
            } else if (aiDestination.recommended_destination.includes('keep in JSON')) {
              // Keep as part of JSON structure - don't flatten
              // Will be stored in custom_fields_structured below
            } else {
              // Standard dynamic data with AI context
              dynamicData.push({
                entity_id: record.id,
                field_name: `ai_${key}`,
                field_value: String(value),
                field_type: this.inferFieldType(value),
                ai_confidence: aiDestination.confidence
              } as any)
            }
          } else {
            // Fallback to original logic
            dynamicData.push({
              entity_id: record.id,
              field_name: `custom_${key}`,
              field_value: String(value),
              field_type: typeof value === 'number' ? 'number' : 'text'
            })
          }
        })

        // Store intelligently structured JSON (keep complex nested data together)
        const structuredJson = this.createIntelligentJsonStructure(
          record.custom_fields,
          customFieldDestinations
        )
        if (Object.keys(structuredJson).length > 0) {
          dynamicData.push({
            entity_id: record.id,
            field_name: 'custom_fields_structured',
            field_value: JSON.stringify(structuredJson),
            field_type: 'json',
            ai_processed: true
          })
        }
      } else {
        // Original logic if no AI mapping available
        Object.entries(record.custom_fields).forEach(([key, value]) => {
          dynamicData.push({
            entity_id: record.id,
            field_name: `custom_${key}`,
            field_value: String(value),
            field_type: typeof value === 'number' ? 'number' : 'text'
          })
        })

        // Also store raw JSON for reference
        dynamicData.push({
          entity_id: record.id,
          field_name: 'custom_fields_raw',
          field_value: JSON.stringify(record.custom_fields),
          field_type: 'json'
        })
      }
    }

    // Promoter dynamic data
    if (record.promoter_name_1) {
      const promoter1Id = `${record.id}_promoter_1`
      dynamicData.push(
        {
          entity_id: promoter1Id,
          field_name: 'designation',
          field_value: record.designation_promoter_1,
          field_type: 'text'
        },
        {
          entity_id: promoter1Id,
          field_name: 'contact_number',
          field_value: record.contact_no_promoter_1,
          field_type: 'phone'
        },
        {
          entity_id: promoter1Id,
          field_name: 'promoter_type',
          field_value: 'primary',
          field_type: 'text'
        }
      )
    }

    if (record.promoter_name_2) {
      const promoter2Id = `${record.id}_promoter_2`
      dynamicData.push(
        {
          entity_id: promoter2Id,
          field_name: 'designation',
          field_value: record.designation_promoter_2,
          field_type: 'text'
        },
        {
          entity_id: promoter2Id,
          field_name: 'contact_number',
          field_value: record.contact_no_promoter_2,
          field_type: 'phone'
        },
        {
          entity_id: promoter2Id,
          field_name: 'promoter_type',
          field_value: 'secondary',
          field_type: 'text'
        }
      )
    }

    // Add all dynamic data with proper structure
    dynamicData.forEach(data => {
      if (data.field_value && data.field_value !== '') {
        mapping.core_dynamic_data.push({
          dynamic_data_id: `${data.entity_id}_${data.field_name}`,
          entity_id: data.entity_id,
          organization_id: this.organizationId,
          field_name: data.field_name,
          field_value: data.field_value,
          field_type: data.field_type,
          created_at: new Date(record.created_at),
          updated_at: new Date(record.updated_at)
        })
      }
    })
  }

  /**
   * 🔗 Create Relationships (Entity connections) - AI-Enhanced
   */
  private async createRelationships(record: LegacyCRMRecord, mapping: HERAUniversalMapping) {
    // Standard relationships (existing logic)
    if (record.project_id) {
      mapping.core_relationships.push({
        relationship_id: `${record.id}_project_rel`,
        organization_id: this.organizationId,
        from_entity_id: record.id,
        to_entity_id: record.project_id,
        relationship_type: 'owns_project',
        relationship_strength: 1.0,
        created_at: new Date(record.created_at),
        smart_code: 'HERA.REL.CUSTOMER.PROJECT.v1'
      })
    }

    if (record.promoter_name_1) {
      const promoter1Id = `${record.id}_promoter_1`
      mapping.core_relationships.push({
        relationship_id: `${record.id}_promoter1_rel`,
        organization_id: this.organizationId,
        from_entity_id: record.id,
        to_entity_id: promoter1Id,
        relationship_type: 'has_contact',
        relationship_strength: 0.9,
        created_at: new Date(record.created_at),
        smart_code: 'HERA.REL.CUSTOMER.CONTACT.v1'
      })
    }

    if (record.promoter_name_2) {
      const promoter2Id = `${record.id}_promoter_2`
      mapping.core_relationships.push({
        relationship_id: `${record.id}_promoter2_rel`,
        organization_id: this.organizationId,
        from_entity_id: record.id,
        to_entity_id: promoter2Id,
        relationship_type: 'has_contact',
        relationship_strength: 0.8,
        created_at: new Date(record.created_at),
        smart_code: 'HERA.REL.CUSTOMER.CONTACT.v1'
      })
    }

    if (record.project_id && record.services) {
      const serviceId = `${record.id}_service`
      mapping.core_relationships.push({
        relationship_id: `${record.project_id}_service_rel`,
        organization_id: this.organizationId,
        from_entity_id: record.project_id,
        to_entity_id: serviceId,
        relationship_type: 'requires_service',
        relationship_strength: 0.95,
        created_at: new Date(record.created_at),
        smart_code: 'HERA.REL.PROJECT.SERVICE.v1'
      })
    }

    // 🧠 AI-DETECTED RELATIONSHIPS
    if (this.intelligentMapping?.relationship_detection) {
      const detectedRelationships =
        this.intelligentMapping.relationship_detection.detected_relationships || []

      for (const aiRel of detectedRelationships) {
        if (aiRel.confidence >= this.smartMappingEngine['confidenceThreshold']) {
          this.log(
            `🧠 Creating AI-detected relationship: ${aiRel.parent_entity} → ${aiRel.child_entity} (${aiRel.relationship_type})`
          )

          mapping.core_relationships.push({
            relationship_id: `ai_${record.id}_${aiRel.relationship_field}_rel`,
            organization_id: this.organizationId,
            from_entity_id: record.id, // Assuming parent is current record
            to_entity_id: `ai_detected_${aiRel.child_entity}`, // AI-detected entity
            relationship_type: aiRel.relationship_type,
            relationship_strength: aiRel.confidence,
            created_at: new Date(record.created_at),
            smart_code: 'HERA.REL.AI.DETECTED.v1',
            ai_detected: true,
            ai_context: aiRel.business_context
          } as any)
        }
      }

      // AI-detected foreign key patterns
      const foreignKeyPatterns =
        this.intelligentMapping.relationship_detection.foreign_key_patterns || []
      for (const fkPattern of foreignKeyPatterns) {
        if (fkPattern.confidence >= 0.7) {
          this.log(
            `🧠 Detected potential foreign key pattern: ${fkPattern.field_name} (${fkPattern.pattern})`
          )

          // Create relationship based on foreign key pattern
          const fieldValue = (record as any)[fkPattern.field_name]
          if (fieldValue) {
            mapping.core_relationships.push({
              relationship_id: `fk_${record.id}_${fkPattern.field_name}`,
              organization_id: this.organizationId,
              from_entity_id: record.id,
              to_entity_id: String(fieldValue),
              relationship_type: 'references',
              relationship_strength: fkPattern.confidence,
              created_at: new Date(record.created_at),
              smart_code: 'HERA.REL.FK.PATTERN.v1',
              ai_detected: true,
              ai_pattern: fkPattern.pattern
            } as any)
          }
        }
      }
    }
  }

  /**
   * 💰 Create Transactions (Business activities)
   */
  private async createTransactions(record: LegacyCRMRecord, mapping: HERAUniversalMapping) {
    // Project initiation transaction
    if (record.amount && record.amount > 0) {
      mapping.universal_transactions.push({
        transaction_id: `${record.id}_project_txn`,
        organization_id: this.organizationId,
        transaction_type: 'project_valuation',
        transaction_date: new Date(record.created_at),
        reference_number: `PRJ-${record.project_id?.substring(0, 8)}`,
        total_amount: record.amount,
        currency: 'INR', // Assuming Indian currency
        status: record.status || 'active',
        created_at: new Date(record.created_at),
        updated_at: new Date(record.updated_at),
        smart_code: 'HERA.TXN.PROJECT.VALUATION.v1',
        metadata: {
          company_name: record.company_name,
          sector: record.sector,
          agency: record.agency,
          custom_fields: record.custom_fields
        }
      })
    }

    // Follow-up activity transaction
    if (record.next_call_date) {
      mapping.universal_transactions.push({
        transaction_id: `${record.id}_followup_txn`,
        organization_id: this.organizationId,
        transaction_type: 'crm_activity',
        transaction_date: new Date(record.next_call_date),
        reference_number: `ACT-${record.id.substring(0, 8)}`,
        total_amount: 0, // Activity has no monetary value
        currency: 'INR',
        status: 'scheduled',
        created_at: new Date(record.created_at),
        smart_code: 'HERA.TXN.CRM.FOLLOWUP.v1',
        metadata: {
          activity_type: 'follow_up_call',
          feedback: record.feedback,
          reminder_email: record.reminder_email
        }
      })
    }
  }

  /**
   * 📝 Create Transaction Lines (Detailed breakdowns)
   */
  private async createTransactionLines(record: LegacyCRMRecord, mapping: HERAUniversalMapping) {
    // Project valuation line items
    if (record.amount && record.amount > 0) {
      const projectTxnId = `${record.id}_project_txn`

      mapping.universal_transaction_lines.push({
        line_id: `${projectTxnId}_valuation`,
        transaction_id: projectTxnId,
        organization_id: this.organizationId,
        line_type: 'project_valuation',
        entity_id: record.project_id,
        description: `${record.sector} project valuation for ${record.company_name}`,
        quantity: 1,
        unit_price: record.amount,
        line_total: record.amount,
        currency: 'INR',
        created_at: new Date(record.created_at),
        smart_code: 'HERA.TXN.LINE.PROJECT.VALUE.V1'
      })

      // Service fee line (if applicable)
      if (record.services) {
        mapping.universal_transaction_lines.push({
          line_id: `${projectTxnId}_service`,
          transaction_id: projectTxnId,
          organization_id: this.organizationId,
          line_type: 'service_fee',
          entity_id: `${record.id}_service`,
          description: `Service: ${record.services}`,
          quantity: 1,
          unit_price: 0, // Will be determined later
          line_total: 0,
          currency: 'INR',
          created_at: new Date(record.created_at),
          smart_code: 'HERA.TXN.LINE.SERVICE.FEE.V1'
        })
      }
    }
  }

  /**
   * 🏷️ Generate entity codes
   */
  private generateEntityCode(prefix: string, name: string): string {
    // Handle undefined/null names
    const safeName = name || 'UNNAMED'
    const cleanName = safeName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 8)
      .toUpperCase()
    const timestamp = Date.now().toString().slice(-4)
    return `${prefix}_${cleanName}_${timestamp}`
  }

  /**
   * 📝 Logging utility
   */
  private log(message: string) {
    this.conversionLog.push(`${new Date().toISOString()}: ${message}`)
    console.log(message)
  }

  /**
   * 📊 Generate conversion summary
   */
  private generateConversionSummary(mapping: HERAUniversalMapping) {
    this.log('📊 CONVERSION SUMMARY:')
    this.log(`   Organizations: ${mapping.core_organizations.length}`)
    this.log(`   Entities: ${mapping.core_entities.length}`)
    this.log(`   Dynamic Data: ${mapping.core_dynamic_data.length}`)
    this.log(`   Relationships: ${mapping.core_relationships.length}`)
    this.log(`   Transactions: ${mapping.universal_transactions.length}`)
    this.log(`   Transaction Lines: ${mapping.universal_transaction_lines.length}`)
  }

  /**
   * 📋 Get conversion log
   */
  getConversionLog(): string[] {
    return this.conversionLog
  }

  /**
   * 🧠 AI helper methods for enhanced processing
   */

  /**
   * 🎯 Infer field type from value using AI patterns
   */
  private inferFieldType(value: any): string {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (value instanceof Date) return 'datetime'

    const str = String(value).toLowerCase()

    // AI-powered type inference patterns
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return 'date'
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) return 'datetime'
    if (/^[\w\.-]+@[\w\.-]+\.\w+$/.test(str)) return 'email'
    if (/^[\+]?[\s\(\)\-\d]{10,}$/.test(str)) return 'phone'
    if (/^https?:\/\//.test(str)) return 'url'
    if (str.length > 500) return 'text_long'
    if (/^\d+\.?\d*$/.test(str)) return 'numeric_string'

    return 'text'
  }

  /**
   * 🏗️ Create intelligent JSON structure based on AI recommendations
   */
  private createIntelligentJsonStructure(customFields: any, destinations: any[]): any {
    const structuredJson: any = {}

    // Group fields that should remain as JSON according to AI
    Object.entries(customFields).forEach(([key, value]) => {
      const destination = destinations.find(dest => dest.json_path === key)

      if (destination && destination.recommended_destination.includes('keep in JSON')) {
        // Organize by business context for better structure
        const context = destination.business_context || 'general'
        const contextKey = context.replace(/[^\w]/g, '_').toLowerCase()

        if (!structuredJson[contextKey]) {
          structuredJson[contextKey] = {}
        }

        structuredJson[contextKey][key] = value
      }
    })

    return structuredJson
  }

  /**
   * 📊 Generate intelligent mapping summary with AI insights
   */
  private generateIntelligentMappingSummary() {
    if (!this.intelligentMapping) return

    this.log('🧠 AI INTELLIGENT MAPPING SUMMARY:')
    this.log(
      `   Overall Confidence: ${this.intelligentMapping.confidence_scores.overall_confidence}`
    )
    this.log(
      `   JSON Analysis Confidence: ${this.intelligentMapping.confidence_scores.json_analysis_confidence}`
    )
    this.log(
      `   Relationship Confidence: ${this.intelligentMapping.confidence_scores.relationship_confidence}`
    )
    this.log(
      `   Mapping Confidence: ${this.intelligentMapping.confidence_scores.mapping_confidence}`
    )

    // JSON Structure insights
    const jsonAnalysis = this.intelligentMapping.json_structure_analysis
    if (jsonAnalysis.nested_objects.length > 0) {
      this.log(`   Nested Objects Detected: ${jsonAnalysis.nested_objects.length}`)
      jsonAnalysis.nested_objects.forEach(obj => {
        this.log(`     - ${obj.path}: ${obj.recommended_action} (confidence: ${obj.confidence})`)
      })
    }

    // Relationship insights
    const relationships = this.intelligentMapping.relationship_detection.detected_relationships
    if (relationships.length > 0) {
      this.log(`   AI-Detected Relationships: ${relationships.length}`)
      relationships.forEach(rel => {
        this.log(
          `     - ${rel.parent_entity} → ${rel.child_entity} (${rel.relationship_type}, confidence: ${rel.confidence})`
        )
      })
    }

    // Business context insights
    const businessContext = this.intelligentMapping.business_context_analysis
    this.log(`   Industry Detection: ${businessContext.industry_detection}`)
    this.log(`   Data Quality Score: ${businessContext.data_quality_assessment.completeness_score}`)
  }

  /**
   * 🎯 Get intelligent mapping results for external access
   */
  getIntelligentMapping() {
    return this.intelligentMapping
  }
}
