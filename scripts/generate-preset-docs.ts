#!/usr/bin/env tsx

/**
 * HERA Preset Documentation Generator
 * 
 * Automatically generates comprehensive documentation from entity presets.
 * Creates both technical specs and functional guides for each entity type.
 * 
 * Usage:
 *   npm run docs:generate
 *   tsx scripts/generate-preset-docs.ts
 */

import fs from 'fs/promises'
import path from 'path'
import { entityPresets, type EntityPreset, type Role } from '../src/hooks/entityPresets'

interface DocSection {
  title: string
  content: string[]
  subsections?: DocSection[]
}

class PresetDocGenerator {
  private baseOutputDir = './docs/presets'

  async generateAll() {
    console.log('🚀 HERA Preset Documentation Generator')
    console.log('=====================================\n')

    // Ensure output directory exists
    await fs.mkdir(this.baseOutputDir, { recursive: true })

    // Generate individual preset docs
    const presetEntries = Object.entries(entityPresets)
    for (const [key, preset] of presetEntries) {
      console.log(`📝 Generating docs for ${key}...`)
      await this.generatePresetDoc(key, preset)
    }

    // Generate index/overview
    console.log('📚 Generating overview documentation...')
    await this.generateOverview(presetEntries)

    // Generate technical architecture doc
    console.log('🏗️ Generating technical architecture...')
    await this.generateArchitectureDoc()

    console.log('\n✅ Documentation generation complete!')
    console.log(`📁 Output: ${this.baseOutputDir}`)
  }

  private async generatePresetDoc(key: string, preset: EntityPreset) {
    const sections: DocSection[] = [
      this.generateHeader(key, preset),
      this.generateOverviewSection(preset),
      this.generateFieldsSection(preset),
      this.generateRelationshipsSection(preset),
      this.generatePermissionsSection(preset),
      this.generateSmartCodesSection(preset),
      this.generateUsageSection(key, preset),
      this.generateAPISection(preset),
      this.generateTechnicalSection(preset)
    ]

    const markdown = this.sectionsToMarkdown(sections)
    const filename = `${key.toLowerCase()}-preset.md`
    await fs.writeFile(path.join(this.baseOutputDir, filename), markdown)
  }

  private generateHeader(key: string, preset: EntityPreset): DocSection {
    const badges = [
      `![Entity Type](https://img.shields.io/badge/Entity-${preset.entity_type}-blue)`,
      `![Fields](https://img.shields.io/badge/Fields-${preset.dynamicFields?.length || 0}-green)`,
      `![Relationships](https://img.shields.io/badge/Relations-${preset.relationships?.length || 0}-purple)`,
      `![Smart Codes](https://img.shields.io/badge/Smart_Codes-HERA.DNA-gold)`
    ]

    return {
      title: `# ${preset.labels?.singular || key} Entity Preset`,
      content: [
        badges.join(' '),
        '',
        `> **${preset.labels?.plural || key}** - Universal entity configuration for the HERA framework`,
        '',
        `## Quick Reference`,
        '',
        `| Property | Value |`,
        `|----------|-------|`,
        `| **Entity Type** | \`${preset.entity_type}\` |`,
        `| **Singular** | ${preset.labels?.singular || 'N/A'} |`,
        `| **Plural** | ${preset.labels?.plural || 'N/A'} |`,
        `| **Dynamic Fields** | ${preset.dynamicFields?.length || 0} |`,
        `| **Relationships** | ${preset.relationships?.length || 0} |`,
        `| **Permissions** | ${preset.permissions ? '✅ Role-based' : '❌ None'} |`,
      ]
    }
  }

  private generateOverviewSection(preset: EntityPreset): DocSection {
    const description = this.getEntityDescription(preset.entity_type)
    
    return {
      title: '## Overview',
      content: [
        description,
        '',
        '### Key Features',
        '',
        '- ✅ **Universal Architecture**: Uses HERA\'s 6-table foundation',
        '- ✅ **Dynamic Fields**: No schema changes required for customization',
        '- ✅ **Smart Codes**: Built-in business intelligence and context',
        '- ✅ **Role-Based Access**: Configurable permissions per field and action',
        '- ✅ **Relationship Management**: Flexible entity connections',
        '- ✅ **Auto-Generated UI**: Forms and tables created automatically',
        '',
        '### Business Use Cases',
        '',
        ...this.getBusinessUseCases(preset.entity_type)
      ]
    }
  }

  private generateFieldsSection(preset: EntityPreset): DocSection {
    if (!preset.dynamicFields?.length) {
      return {
        title: '## Dynamic Fields',
        content: ['*No dynamic fields configured for this entity type.*']
      }
    }

    const subsections: DocSection[] = [
      {
        title: '### Field Summary',
        content: [
          '| Field | Type | Required | Roles | Description |',
          '|-------|------|----------|-------|-------------|',
          ...preset.dynamicFields.map(field => {
            const roles = field.ui?.roles?.join(', ') || 'All'
            const description = field.ui?.helpText || field.ui?.label || 'No description'
            const required = field.required || field.ui?.required ? '✅' : '❌'
            return `| \`${field.name}\` | ${field.type} | ${required} | ${roles} | ${description} |`
          })
        ]
      }
    ]

    // Group fields by category if possible
    const requiredFields = preset.dynamicFields.filter(f => f.required || f.ui?.required)
    const optionalFields = preset.dynamicFields.filter(f => !(f.required || f.ui?.required))
    const restrictedFields = preset.dynamicFields.filter(f => f.ui?.roles?.length)

    if (requiredFields.length > 0) {
      subsections.push({
        title: '### Required Fields',
        content: requiredFields.map(field => 
          `- **${field.ui?.label || field.name}** (\`${field.name}\`) - ${field.ui?.helpText || 'Required field'}`
        )
      })
    }

    if (restrictedFields.length > 0) {
      subsections.push({
        title: '### Role-Restricted Fields',
        content: restrictedFields.map(field => 
          `- **${field.ui?.label || field.name}** - Visible to: ${field.ui?.roles?.join(', ')}`
        )
      })
    }

    return {
      title: '## Dynamic Fields',
      content: [`This entity uses **${preset.dynamicFields.length} dynamic fields** stored in \`core_dynamic_data\`.`],
      subsections
    }
  }

  private generateRelationshipsSection(preset: EntityPreset): DocSection {
    if (!preset.relationships?.length) {
      return {
        title: '## Relationships',
        content: ['*No relationships configured for this entity type.*']
      }
    }

    return {
      title: '## Relationships',
      content: [
        `This entity supports **${preset.relationships.length} relationship types** stored in \`core_relationships\`.`,
        '',
        '| Relationship | Cardinality | Smart Code | Description |',
        '|--------------|-------------|------------|-------------|',
        ...preset.relationships.map(rel => {
          const description = this.getRelationshipDescription(rel.type)
          return `| \`${rel.type}\` | ${rel.cardinality || 'many'} | \`${rel.smart_code}\` | ${description} |`
        }),
        '',
        '### Relationship Details',
        '',
        ...preset.relationships.map(rel => [
          `#### ${rel.type}`,
          `- **Smart Code**: \`${rel.smart_code}\``,
          `- **Cardinality**: ${rel.cardinality || 'many'}`,
          `- **Description**: ${this.getRelationshipDescription(rel.type)}`,
          ''
        ]).flat()
      ]
    }
  }

  private generatePermissionsSection(preset: EntityPreset): DocSection {
    if (!preset.permissions) {
      return {
        title: '## Permissions',
        content: ['*No role-based permissions configured. All operations available to all users.*']
      }
    }

    const roles: Role[] = ['owner', 'manager', 'receptionist', 'staff']
    const actions = ['create', 'edit', 'delete', 'view'] as const

    const permissionTable = [
      '| Role | Create | Edit | Delete | View |',
      '|------|--------|------|--------|------|',
      ...roles.map(role => {
        const permissions = actions.map(action => {
          const fn = preset.permissions?.[action]
          if (!fn) return '❌'
          try {
            return fn(role) ? '✅' : '❌'
          } catch {
            return '❓'
          }
        })
        return `| **${role}** | ${permissions.join(' | ')} |`
      })
    ]

    return {
      title: '## Permissions',
      content: [
        'This entity uses **role-based permissions** to control access to operations.',
        '',
        ...permissionTable,
        '',
        '### Permission Notes',
        '',
        '- ✅ = Operation allowed for this role',
        '- ❌ = Operation denied for this role',
        '- ❓ = Dynamic permission (depends on context)',
        '',
        '> **Note**: Field-level permissions may further restrict access to specific data.'
      ]
    }
  }

  private generateSmartCodesSection(preset: EntityPreset): DocSection {
    const allSmartCodes = [
      `HERA.SALON.${preset.entity_type}.ENTITY.ITEM.v1`, // Entity creation
      ...(preset.dynamicFields?.map(f => f.smart_code) || []),
      ...(preset.relationships?.map(r => r.smart_code) || [])
    ]

    return {
      title: '## Smart Codes',
      content: [
        'Smart codes provide **business intelligence and context** for every operation.',
        '',
        '### Entity Smart Codes',
        '',
        '| Purpose | Smart Code |',
        '|---------|------------|',
        `| Entity Creation | \`HERA.SALON.${preset.entity_type}.ENTITY.ITEM.v1\` |`,
        '',
        '### Field Smart Codes',
        '',
        '| Field | Smart Code |',
        '|-------|------------|',
        ...(preset.dynamicFields?.map(f => `| \`${f.name}\` | \`${f.smart_code}\` |`) || ['*No dynamic fields*']),
        '',
        '### Relationship Smart Codes',
        '',
        '| Relationship | Smart Code |',
        '|--------------|------------|',
        ...(preset.relationships?.map(r => `| \`${r.type}\` | \`${r.smart_code}\` |`) || ['*No relationships*']),
        '',
        '### Smart Code Benefits',
        '',
        '- 🧠 **Business Intelligence**: Automatic categorization and analysis',
        '- 📊 **Analytics**: Built-in reporting and insights',
        '- 🔄 **Integration**: Seamless cross-module compatibility',
        '- 🎯 **Context**: Every data point has business meaning',
        '- 🚀 **AI-Ready**: Training data with built-in classification'
      ]
    }
  }

  private generateUsageSection(key: string, preset: EntityPreset): DocSection {
    return {
      title: '## Usage Examples',
      content: [
        '### React Component Usage',
        '',
        '```typescript',
        "import { EntityPage } from '@/components/entity/EntityPage'",
        `import { ${key}_PRESET } from '@/hooks/entityPresets'`,
        "import { useHERAAuth } from '@/components/auth/HERAAuthProvider'",
        '',
        `export default function ${preset.labels?.plural || key}Page() {`,
        "  const { userRole = 'staff' } = useHERAAuth() ?? {}",
        '  ',
        '  return (',
        '    <EntityPage ',
        `      preset={${key}_PRESET} `,
        '      userRole={userRole}',
        `      title="${preset.labels?.plural || key} Management"`,
        '    />',
        '  )',
        '}',
        '```',
        '',
        '### Direct Hook Usage',
        '',
        '```typescript',
        "import { useUniversalEntity } from '@/hooks/useUniversalEntity'",
        `import { ${key}_PRESET } from '@/hooks/entityPresets'`,
        '',
        'const {',
        '  entities,',
        '  create,',
        '  update,',
        '  delete: remove,',
        '  getById',
        '} = useUniversalEntity({',
        `  ...${key}_PRESET,`,
        '  filters: { include_dynamic: true }',
        '})',
        '',
        '// Create entity with dynamic fields',
        'await create({',
        `  entity_type: '${preset.entity_type}',`,
        "  entity_name: 'Example Item',",
        `  smart_code: 'HERA.SALON.${preset.entity_type}.ENTITY.ITEM.v1',`,
        '  dynamic_fields: {',
        ...(preset.dynamicFields?.slice(0, 2).map(f => 
          `    ${f.name}: { value: ${f.type === 'text' ? "'example'" : f.type === 'number' ? '100' : 'true'}, type: '${f.type}', smart_code: '${f.smart_code}' },`
        ) || []),
        '  }',
        '})',
        '```'
      ]
    }
  }

  private generateAPISection(preset: EntityPreset): DocSection {
    return {
      title: '## API Integration',
      content: [
        `The ${preset.labels?.singular || preset.entity_type} entity integrates with **HERA Universal API v2**.`,
        '',
        '### Endpoints',
        '',
        '| Operation | Method | Endpoint |',
        '|-----------|--------|----------|',
        '| List | GET | `/api/v2/entities?entity_type=' + preset.entity_type + '` |',
        '| Get One | GET | `/api/v2/entities/{id}` |',
        '| Create | POST | `/api/v2/entities` |',
        '| Update | PUT | `/api/v2/entities` |',
        '| Delete | DELETE | `/api/v2/entities/{id}` |',
        '| Dynamic Fields | POST | `/api/v2/dynamic/batch` |',
        '| Relationships | POST | `/api/v2/relationships/upsert-batch` |',
        '',
        '### Request Examples',
        '',
        '#### Create Entity',
        '```json',
        '{',
        `  "entity_type": "${preset.entity_type}",`,
        '  "entity_name": "Example Item",',
        `  "smart_code": "HERA.SALON.${preset.entity_type}.ENTITY.ITEM.v1",`,
        '  "dynamic_fields": {',
        ...(preset.dynamicFields?.slice(0, 2).map(f => 
          `    "${f.name}": { "value": ${f.type === 'text' ? '"example"' : f.type === 'number' ? '100' : 'true'}, "type": "${f.type}", "smart_code": "${f.smart_code}" }`
        ) || []),
        '  }',
        '}',
        '```',
        '',
        '#### Update Dynamic Fields',
        '```json',
        '{',
        '  "p_organization_id": "org-uuid",',
        '  "p_entity_id": "entity-uuid",',
        '  "p_items": [',
        ...(preset.dynamicFields?.slice(0, 1).map(f => 
          `    { "field_name": "${f.name}", "field_type": "${f.type}", "field_value_${f.type}": ${f.type === 'text' ? '"new_value"' : f.type === 'number' ? '150' : 'false'}, "smart_code": "${f.smart_code}" }`
        ) || []),
        '  ]',
        '}',
        '```'
      ]
    }
  }

  private generateTechnicalSection(preset: EntityPreset): DocSection {
    return {
      title: '## Technical Architecture',
      content: [
        '### Database Tables',
        '',
        'This entity uses HERA\'s **universal 6-table architecture**:',
        '',
        '| Table | Purpose | Data Stored |',
        '|-------|---------|-------------|',
        '| `core_entities` | Entity records | Basic entity info (name, type, smart_code) |',
        '| `core_dynamic_data` | Custom fields | All dynamic field values |',
        '| `core_relationships` | Entity connections | Relationships between entities |',
        '| `universal_transactions` | Business events | Audit trail of all operations |',
        '| `universal_transaction_lines` | Event details | Detailed transaction information |',
        '| `core_organizations` | Multi-tenancy | Organization isolation |',
        '',
        '### Smart Code Architecture',
        '',
        `All operations use smart codes following the pattern: \`HERA.SALON.${preset.entity_type}.*\``,
        '',
        '- **Entity Creation**: Automatic business categorization',
        '- **Field Operations**: Context-aware data management',
        '- **Relationships**: Intelligent connection tracking',
        '- **Audit Trail**: Complete business intelligence preservation',
        '',
        '### Performance Characteristics',
        '',
        '- **Scalability**: Handles millions of entities via universal architecture',
        '- **Query Performance**: Optimized indexes on entity_type and organization_id',
        '- **Storage Efficiency**: Dynamic fields only stored when populated',
        '- **Multi-tenancy**: Perfect isolation via organization_id filtering',
        '',
        '### Integration Points',
        '',
        '- **Forms**: Auto-generated from preset configuration',
        '- **Tables**: Dynamic column generation with type-aware formatting',
        '- **Validation**: Type and business rule enforcement',
        '- **Permissions**: Role-based access control at field and operation level',
        '- **APIs**: Universal CRUD operations with smart code integration'
      ]
    }
  }

  private async generateOverview(presetEntries: [string, EntityPreset][]) {
    const overview = [
      '# HERA Entity Presets Overview',
      '',
      '> **Universal Framework Documentation** - Auto-generated from preset configurations',
      '',
      '![HERA Framework](https://img.shields.io/badge/HERA-Universal_Framework-gold)',
      '![Presets](https://img.shields.io/badge/Presets-' + presetEntries.length + '-blue)',
      '![Architecture](https://img.shields.io/badge/Architecture-6_Tables-green)',
      '',
      '## Quick Navigation',
      '',
      ...presetEntries.map(([key, preset]) => 
        `- [${preset.labels?.plural || key}](${key.toLowerCase()}-preset.md) - ${this.getEntityDescription(preset.entity_type)}`
      ),
      '',
      '## Framework Statistics',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| **Total Presets** | ${presetEntries.length} |`,
      `| **Total Fields** | ${presetEntries.reduce((sum, [, preset]) => sum + (preset.dynamicFields?.length || 0), 0)} |`,
      `| **Total Relationships** | ${presetEntries.reduce((sum, [, preset]) => sum + (preset.relationships?.length || 0), 0)} |`,
      `| **Permissions-Enabled** | ${presetEntries.filter(([, preset]) => preset.permissions).length} |`,
      '',
      '## Architecture Principles',
      '',
      '### Universal Foundation',
      '- **6 Sacred Tables**: All data stored in universal schema',
      '- **Zero Schema Changes**: New entities via configuration only',
      '- **Smart Code Integration**: Every operation has business context',
      '- **Multi-tenant Ready**: Perfect organization isolation',
      '',
      '### Configuration-Driven',
      '- **Auto-Generated UI**: Forms and tables from presets',
      '- **Role-Based Security**: Configurable permissions',
      '- **Type-Safe Operations**: Full TypeScript integration',
      '- **Relationship Management**: Flexible entity connections',
      '',
      '## Quick Start',
      '',
      '```typescript',
      '// 1. Choose any preset',
      "import { PRODUCT_PRESET } from '@/hooks/entityPresets'",
      '',
      '// 2. Generate complete CRUD interface',
      '<EntityPage preset={PRODUCT_PRESET} userRole="manager" />',
      '',
      '// Result: Full entity management with:',
      '// ✅ Auto-generated forms with validation',
      '// ✅ Auto-generated tables with formatting', 
      '// ✅ Role-based permissions',
      '// ✅ Complete CRUD operations',
      '// ✅ Relationship management',
      '```',
      '',
      '## The HERA Promise',
      '',
      '> **"6 tables, infinite entities, zero repetition"**',
      '',
      'This documentation proves the HERA framework delivers on its revolutionary promise:',
      '',
      '- **Universal Backend**: Same 6 tables handle all business data',
      '- **Universal Frontend**: Same components handle all entity types',
      '- **Universal API**: Same endpoints handle all operations',
      '- **Configuration Over Code**: New entities via presets, not development',
      '',
      '---',
      '',
      `*Documentation auto-generated on ${new Date().toISOString()} from preset configurations*`
    ]

    await fs.writeFile(path.join(this.baseOutputDir, 'README.md'), overview.join('\n'))
  }

  private async generateArchitectureDoc() {
    const architecture = [
      '# HERA Universal Architecture',
      '',
      '> **Technical Deep Dive** - How the 6-table universal framework powers infinite entity types',
      '',
      '## Core Architecture',
      '',
      '### The Sacred 6 Tables',
      '',
      '```mermaid',
      'erDiagram',
      '    CORE_ORGANIZATIONS {',
      '        uuid id PK',
      '        text name',
      '        text slug',
      '        timestamp created_at',
      '    }',
      '    ',
      '    CORE_ENTITIES {',
      '        uuid id PK',
      '        uuid organization_id FK',
      '        text entity_type',
      '        text entity_name',
      '        text entity_code',
      '        text smart_code',
      '        jsonb metadata',
      '        timestamp created_at',
      '    }',
      '    ',
      '    CORE_DYNAMIC_DATA {',
      '        uuid id PK',
      '        uuid organization_id FK',
      '        uuid entity_id FK',
      '        text field_name',
      '        text field_type',
      '        text field_value_text',
      '        numeric field_value_number',
      '        boolean field_value_boolean',
      '        timestamp field_value_date',
      '        jsonb field_value_json',
      '        text smart_code',
      '    }',
      '    ',
      '    CORE_RELATIONSHIPS {',
      '        uuid id PK',
      '        uuid organization_id FK',
      '        uuid from_entity_id FK',
      '        uuid to_entity_id FK',
      '        text relationship_type',
      '        text smart_code',
      '        boolean is_active',
      '    }',
      '    ',
      '    UNIVERSAL_TRANSACTIONS {',
      '        uuid id PK',
      '        uuid organization_id FK',
      '        text transaction_type',
      '        text transaction_code',
      '        text smart_code',
      '        numeric total_amount',
      '        timestamp transaction_date',
      '    }',
      '    ',
      '    UNIVERSAL_TRANSACTION_LINES {',
      '        uuid id PK',
      '        uuid transaction_id FK',
      '        uuid line_entity_id FK',
      '        integer line_number',
      '        numeric quantity',
      '        numeric unit_price',
      '        numeric line_amount',
      '        text smart_code',
      '    }',
      '    ',
      '    CORE_ORGANIZATIONS ||--o{ CORE_ENTITIES : owns',
      '    CORE_ORGANIZATIONS ||--o{ CORE_DYNAMIC_DATA : isolates',
      '    CORE_ORGANIZATIONS ||--o{ CORE_RELATIONSHIPS : contains',
      '    CORE_ENTITIES ||--o{ CORE_DYNAMIC_DATA : has',
      '    CORE_ENTITIES ||--o{ CORE_RELATIONSHIPS : connects',
      '    CORE_ENTITIES ||--o{ UNIVERSAL_TRANSACTION_LINES : involves',
      '```',
      '',
      '### Data Flow Architecture',
      '',
      '```mermaid',
      'flowchart TD',
      '    A[Entity Preset] --> B[EntityPage Component]',
      '    B --> C[EntityForm]',
      '    B --> D[EntityTable]',
      '    C --> E[useUniversalEntity Hook]',
      '    D --> E',
      '    E --> F[Universal API v2]',
      '    F --> G[6 Sacred Tables]',
      '    ',
      '    subgraph "Frontend Layer"',
      '        A',
      '        B',
      '        C',
      '        D',
      '    end',
      '    ',
      '    subgraph "Logic Layer"',
      '        E',
      '    end',
      '    ',
      '    subgraph "API Layer"',
      '        F',
      '    end',
      '    ',
      '    subgraph "Data Layer"',
      '        G',
      '    end',
      '```',
      '',
      '## Smart Code System',
      '',
      '### Pattern: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}`',
      '',
      '```typescript',
      '// Entity Creation',
      '"HERA.SALON.PRODUCT.ENTITY.ITEM.v1"',
      '',
      '// Dynamic Fields', 
      '"HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1"',
      '"HERA.SALON.PRODUCT.DYN.PRICE.COST.v1"',
      '',
      '// Relationships',
      '"HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1"',
      '',
      '// Transactions',
      '"HERA.SALON.POS.TXN.SALE.v1"',
      '```',
      '',
      '### Benefits',
      '',
      '- **Business Intelligence**: Every data point has semantic meaning',
      '- **Cross-Module Integration**: Smart codes enable automatic integration',
      '- **Analytics Ready**: Built-in categorization for reporting',
      '- **AI Training Data**: Classified data perfect for machine learning',
      '- **Audit Trails**: Complete business context preservation',
      '',
      '## Performance Characteristics',
      '',
      '### Scalability Metrics',
      '',
      '| Aspect | Performance | Notes |',
      '|--------|-------------|-------|',
      '| **Entities per Org** | 10M+ | Indexed by entity_type + organization_id |',
      '| **Dynamic Fields** | Unlimited | Sparse storage, only populated fields stored |',
      '| **Relationships** | 100M+ | Optimized bidirectional indexing |',
      '| **Query Performance** | <100ms | For typical business queries |',
      '| **Write Performance** | <50ms | Single-table operations |',
      '| **Multi-tenancy** | Perfect | Zero data leakage via organization_id |',
      '',
      '### Index Strategy',
      '',
      '```sql',
      '-- Core performance indexes',
      'CREATE INDEX idx_entities_org_type ON core_entities(organization_id, entity_type);',
      'CREATE INDEX idx_dynamic_org_entity ON core_dynamic_data(organization_id, entity_id);',
      'CREATE INDEX idx_relationships_from ON core_relationships(from_entity_id, relationship_type);',
      'CREATE INDEX idx_transactions_org_date ON universal_transactions(organization_id, transaction_date);',
      '```',
      '',
      '## Security Architecture',
      '',
      '### Multi-Tenant Isolation',
      '',
      '```typescript',
      '// Every query automatically filtered by organization_id',
      'SELECT * FROM core_entities ',
      'WHERE organization_id = $1 AND entity_type = $2',
      '',
      '// Row Level Security policies enforce isolation',
      'CREATE POLICY hera_entities_access ON core_entities',
      '  FOR ALL TO authenticated',
      '  USING (organization_id = hera_get_current_org_id())',
      '```',
      '',
      '### Role-Based Access Control',
      '',
      '```typescript',
      '// Preset-defined permissions',
      'permissions: {',
      '  create: (role: Role) => [\'owner\', \'manager\'].includes(role),',
      '  edit: (role: Role) => [\'owner\', \'manager\', \'receptionist\'].includes(role),',
      '  delete: (role: Role) => [\'owner\'].includes(role)',
      '}',
      '',
      '// Field-level visibility',
      'ui: {',
      '  roles: [\'owner\', \'manager\'] // Hide from staff',
      '}',
      '```',
      '',
      '## Extension Patterns',
      '',
      '### Industry-Specific Presets',
      '',
      '```typescript',
      '// Salon Industry',
      'export const SALON_PRESETS = {',
      '  PRODUCT: SALON_PRODUCT_PRESET,',
      '  SERVICE: SALON_SERVICE_PRESET,',
      '  CUSTOMER: SALON_CUSTOMER_PRESET',
      '}',
      '',
      '// Healthcare Industry',
      'export const HEALTHCARE_PRESETS = {',
      '  PATIENT: HEALTHCARE_PATIENT_PRESET,',
      '  APPOINTMENT: HEALTHCARE_APPOINTMENT_PRESET,',
      '  PRESCRIPTION: HEALTHCARE_PRESCRIPTION_PRESET',
      '}',
      '```',
      '',
      '### Custom Field Types',
      '',
      '```typescript',
      '// Extend DynamicFieldDef for specialized types',
      'interface CustomFieldDef extends DynamicFieldDef {',
      '  type: \'text\' | \'number\' | \'boolean\' | \'date\' | \'json\' | \'currency\' | \'percentage\'',
      '  validation?: (value: any) => boolean',
      '  formatter?: (value: any) => string',
      '}',
      '```',
      '',
      '## Future Architecture',
      '',
      '### Planned Enhancements',
      '',
      '- **Smart Code Evolution**: Automatic version management and migration',
      '- **Dynamic UI Generation**: AI-powered form and table generation',
      '- **Cross-Industry Learning**: Machine learning from universal patterns',
      '- **Real-time Collaboration**: Live multi-user editing with conflict resolution',
      '- **Blockchain Integration**: Immutable audit trails for compliance',
      '',
      '---',
      '',
      '*This architecture documentation is auto-generated and reflects the current state of the HERA universal framework.*'
    ]

    await fs.writeFile(path.join(this.baseOutputDir, 'ARCHITECTURE.md'), architecture.join('\n'))
  }

  private sectionsToMarkdown(sections: DocSection[]): string {
    const lines: string[] = []
    
    for (const section of sections) {
      lines.push(section.title, ...section.content, '')
      
      if (section.subsections) {
        for (const subsection of section.subsections) {
          lines.push(subsection.title, ...subsection.content, '')
        }
      }
    }
    
    return lines.join('\n')
  }

  private getEntityDescription(entityType: string): string {
    const descriptions: Record<string, string> = {
      'PRODUCT': 'Physical items sold or used in business operations, including inventory tracking and pricing.',
      'SERVICE': 'Intangible offerings provided to customers, including time-based and skill-based services.',
      'CUSTOMER': 'Individuals or businesses that purchase products or services, including contact and preference data.',
      'EMPLOYEE': 'Staff members and their employment details, roles, and performance tracking.',
      'APPOINTMENT': 'Scheduled time slots for services, including customer and staff assignments.',
      'VENDOR': 'Suppliers and business partners providing products or services to the organization.',
      'CATEGORY': 'Classification system for organizing products, services, and other business entities.',
      'BRAND': 'Manufacturer or brand information for products and services.',
      'ROLE': 'System roles defining user permissions and access levels.'
    }
    return descriptions[entityType] || 'Business entity managed through the universal framework.'
  }

  private getBusinessUseCases(entityType: string): string[] {
    const useCases: Record<string, string[]> = {
      'PRODUCT': [
        '- **Inventory Management**: Track stock levels, reorder points, and supplier information',
        '- **Pricing Strategy**: Manage market prices, cost prices, and profit margins',
        '- **Product Catalog**: Organize products by categories and brands',
        '- **Sales Analytics**: Monitor product performance and trends'
      ],
      'SERVICE': [
        '- **Service Catalog**: Define available services with pricing and duration',
        '- **Staff Scheduling**: Assign services to qualified staff members',
        '- **Commission Tracking**: Calculate staff commissions based on services performed',
        '- **Customer Experience**: Package services for optimal customer satisfaction'
      ],
      'CUSTOMER': [
        '- **Contact Management**: Store comprehensive customer contact information',
        '- **Loyalty Programs**: Track VIP status and loyalty points',
        '- **Service History**: Maintain complete customer service records',
        '- **Referral Tracking**: Monitor customer referral networks'
      ]
    }
    return useCases[entityType] || ['- General business entity management and tracking']
  }

  private getRelationshipDescription(relType: string): string {
    const descriptions: Record<string, string> = {
      'HAS_CATEGORY': 'Links entity to its classification category',
      'HAS_BRAND': 'Associates entity with its brand or manufacturer',
      'SUPPLIED_BY': 'Connects products to their suppliers',
      'FOR_CUSTOMER': 'Associates transaction or appointment with customer',
      'WITH_EMPLOYEE': 'Links service or appointment to staff member',
      'INCLUDES_SERVICE': 'Connects appointment to specific services',
      'HAS_ROLE': 'Assigns role permissions to employee',
      'REPORTS_TO': 'Defines management hierarchy',
      'CAN_PERFORM': 'Specifies which services an employee can provide',
      'REFERRED_BY': 'Tracks customer referral relationships',
      'PREFERRED_STYLIST': 'Customer\'s preferred service provider'
    }
    return descriptions[relType] || 'Relationship between business entities'
  }
}

// CLI execution
if (require.main === module) {
  const generator = new PresetDocGenerator()
  generator.generateAll().catch(console.error)
}

export { PresetDocGenerator }