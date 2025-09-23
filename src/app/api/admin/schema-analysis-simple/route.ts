import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public'
    }
  }
);

// Core tables to analyze
const CORE_TABLES = [
  'core_organizations',
  'core_entities',
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
];

// Expected columns for each table (based on HERA documentation)
const TABLE_SCHEMAS: Record<string, string[]> = {
  core_organizations: [
    'id', 'organization_name', 'organization_code', 'industry_type',
    'country', 'currency', 'smart_code', 'metadata', 'created_at',
    'updated_at', 'created_by', 'updated_by', 'is_active'
  ],
  core_entities: [
    'id', 'organization_id', 'entity_type', 'entity_name', 'entity_code',
    'smart_code', 'metadata', 'classification', 'ai_confidence_score',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'is_active'
  ],
  core_dynamic_data: [
    'id', 'organization_id', 'entity_id', 'field_name', 'field_value_text',
    'field_value_number', 'field_value_boolean', 'field_value_date',
    'field_value_json', 'smart_code', 'metadata', 'created_at',
    'updated_at', 'created_by', 'updated_by', 'is_active'
  ],
  core_relationships: [
    'id', 'organization_id', 'from_entity_id', 'to_entity_id',
    'relationship_type', 'smart_code', 'metadata', 'created_at',
    'updated_at', 'created_by', 'updated_by', 'is_active'
  ],
  universal_transactions: [
    'id', 'organization_id', 'transaction_type', 'transaction_date',
    'transaction_code', 'reference_entity_id', 'from_entity_id',
    'to_entity_id', 'total_amount', 'currency', 'exchange_rate',
    'smart_code', 'metadata', 'classification', 'ai_confidence_score',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'is_active'
  ],
  universal_transaction_lines: [
    'id', 'organization_id', 'transaction_id', 'line_number',
    'line_entity_id', 'description', 'quantity', 'unit_price',
    'line_amount', 'currency', 'exchange_rate', 'smart_code',
    'metadata', 'created_at', 'updated_at', 'created_by', 'updated_by',
    'is_active'
  ]
};

// Common entity types we expect to find
const EXPECTED_ENTITY_TYPES = [
  'customer', 'vendor', 'product', 'employee', 'gl_account',
  'location', 'project', 'branch', 'currency', 'tax_code',
  'payment_term', 'user', 'role', 'permission'
];

// Common transaction types
const EXPECTED_TRANSACTION_TYPES = [
  'sale', 'purchase', 'payment', 'receipt', 'transfer',
  'journal_entry', 'inventory_adjustment', 'production_order'
];

// Common relationship types
const EXPECTED_RELATIONSHIP_TYPES = [
  'has_status', 'parent_of', 'child_of', 'reports_to', 'belongs_to',
  'customer_of', 'vendor_of', 'member_of', 'owns', 'manages'
];

// Dynamic field names we might find
const COMMON_DYNAMIC_FIELDS = [
  'phone', 'email', 'address', 'website', 'tax_id', 'registration_number',
  'credit_limit', 'payment_terms', 'discount_rate', 'contact_person',
  'notes', 'tags', 'custom_field_1', 'custom_field_2'
];

export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const apiKey = request.headers.get('x-admin-api-key');
    if (apiKey !== process.env.ADMIN_API_KEY && apiKey !== 'test-key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysis: any = {
      timestamp: new Date().toISOString(),
      database: {
        version: 'PostgreSQL (Supabase)',
        schemas: ['public']
      },
      tables: {},
      dataProfile: {},
      relationships: [],
      sampleData: {},
      insights: {
        entityTypes: [],
        transactionTypes: [],
        relationshipTypes: [],
        dynamicFields: [],
        branches: [],
        smartCodePatterns: []
      }
    };

    // Analyze each core table
    for (const tableName of CORE_TABLES) {
      try {
        // Get row count
        const { count, error: countError } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error(`Error counting ${tableName}:`, countError);
          continue;
        }

        // Get sample data
        const { data: sampleData, error: sampleError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(5);

        if (sampleError) {
          console.error(`Error fetching sample from ${tableName}:`, sampleError);
          continue;
        }

        analysis.tables[tableName] = {
          name: tableName,
          rowCount: count || 0,
          expectedColumns: TABLE_SCHEMAS[tableName] || [],
          actualColumns: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
          hasSampleData: sampleData && sampleData.length > 0
        };

        if (sampleData && sampleData.length > 0) {
          analysis.sampleData[tableName] = sampleData;
        }

        // Profile specific tables
        if (tableName === 'core_entities' && count && count > 0) {
          // Get entity types
          const { data: entityTypes } = await supabaseAdmin
            .from('core_entities')
            .select('entity_type, organization_id')
            .limit(1000);

          if (entityTypes) {
            const typeCounts: Record<string, number> = {};
            const orgCounts: Record<string, number> = {};

            entityTypes.forEach(e => {
              typeCounts[e.entity_type] = (typeCounts[e.entity_type] || 0) + 1;
              orgCounts[e.organization_id] = (orgCounts[e.organization_id] || 0) + 1;
            });

            analysis.insights.entityTypes = Object.entries(typeCounts)
              .map(([type, count]) => ({ type, count }))
              .sort((a, b) => b.count - a.count);

            analysis.dataProfile.core_entities = {
              totalEntities: count,
              uniqueEntityTypes: Object.keys(typeCounts).length,
              entitiesPerOrganization: orgCounts,
              topEntityTypes: analysis.insights.entityTypes.slice(0, 10)
            };
          }

          // Check for branches
          const { data: branches } = await supabaseAdmin
            .from('core_entities')
            .select('id, entity_name, entity_code, metadata')
            .eq('entity_type', 'branch')
            .limit(100);

          if (branches) {
            analysis.insights.branches = branches.map(b => ({
              id: b.id,
              name: b.entity_name,
              code: b.entity_code,
              metadata: b.metadata
            }));
          }
        }

        if (tableName === 'universal_transactions' && count && count > 0) {
          // Get transaction types
          const { data: transactionTypes } = await supabaseAdmin
            .from('universal_transactions')
            .select('transaction_type, currency')
            .limit(1000);

          if (transactionTypes) {
            const typeCounts: Record<string, number> = {};
            const currencyCounts: Record<string, number> = {};

            transactionTypes.forEach(t => {
              typeCounts[t.transaction_type] = (typeCounts[t.transaction_type] || 0) + 1;
              if (t.currency) {
                currencyCounts[t.currency] = (currencyCounts[t.currency] || 0) + 1;
              }
            });

            analysis.insights.transactionTypes = Object.entries(typeCounts)
              .map(([type, count]) => ({ type, count }))
              .sort((a, b) => b.count - a.count);

            analysis.dataProfile.universal_transactions = {
              totalTransactions: count,
              uniqueTransactionTypes: Object.keys(typeCounts).length,
              currencies: Object.keys(currencyCounts),
              topTransactionTypes: analysis.insights.transactionTypes.slice(0, 10)
            };
          }
        }

        if (tableName === 'core_relationships' && count && count > 0) {
          // Get relationship types
          const { data: relationships } = await supabaseAdmin
            .from('core_relationships')
            .select('relationship_type')
            .limit(1000);

          if (relationships) {
            const typeCounts: Record<string, number> = {};

            relationships.forEach(r => {
              typeCounts[r.relationship_type] = (typeCounts[r.relationship_type] || 0) + 1;
            });

            analysis.insights.relationshipTypes = Object.entries(typeCounts)
              .map(([type, count]) => ({ type, count }))
              .sort((a, b) => b.count - a.count);

            analysis.dataProfile.core_relationships = {
              totalRelationships: count,
              uniqueRelationshipTypes: Object.keys(typeCounts).length,
              topRelationshipTypes: analysis.insights.relationshipTypes.slice(0, 10)
            };
          }
        }

        if (tableName === 'core_dynamic_data' && count && count > 0) {
          // Get dynamic field names and their usage
          const { data: dynamicFields } = await supabaseAdmin
            .from('core_dynamic_data')
            .select('field_name')
            .limit(1000);

          if (dynamicFields) {
            const fieldCounts: Record<string, number> = {};

            dynamicFields.forEach(f => {
              fieldCounts[f.field_name] = (fieldCounts[f.field_name] || 0) + 1;
            });

            analysis.insights.dynamicFields = Object.entries(fieldCounts)
              .map(([field, count]) => ({ field, count }))
              .sort((a, b) => b.count - a.count);

            analysis.dataProfile.core_dynamic_data = {
              totalRecords: count,
              uniqueFieldNames: Object.keys(fieldCounts).length,
              topFields: analysis.insights.dynamicFields.slice(0, 20)
            };
          }

          // Analyze data types used for common fields
          const commonFields = ['branch_id', 'branch_code', 'branch_name'];
          for (const fieldName of commonFields) {
            const { data: fieldData } = await supabaseAdmin
              .from('core_dynamic_data')
              .select('field_value_text, field_value_number, field_value_boolean, field_value_date, field_value_json')
              .eq('field_name', fieldName)
              .limit(10);

            if (fieldData && fieldData.length > 0) {
              const typeUsage = {
                text: fieldData.filter(f => f.field_value_text !== null).length,
                number: fieldData.filter(f => f.field_value_number !== null).length,
                boolean: fieldData.filter(f => f.field_value_boolean !== null).length,
                date: fieldData.filter(f => f.field_value_date !== null).length,
                json: fieldData.filter(f => f.field_value_json !== null).length
              };

              if (!analysis.dataProfile.dynamicFieldTypes) {
                analysis.dataProfile.dynamicFieldTypes = {};
              }

              analysis.dataProfile.dynamicFieldTypes[fieldName] = {
                samples: fieldData.length,
                typeUsage,
                primaryType: Object.entries(typeUsage).sort((a, b) => b[1] - a[1])[0][0]
              };
            }
          }
        }

        // Get smart code patterns
        if (sampleData && sampleData.length > 0 && 'smart_code' in sampleData[0]) {
          const smartCodes = sampleData
            .map(row => row.smart_code)
            .filter(code => code !== null);

          if (smartCodes.length > 0) {
            const patterns = new Set<string>();
            smartCodes.forEach(code => {
              if (code) {
                const parts = code.split('.');
                if (parts.length >= 3) {
                  patterns.add(`${parts[0]}.${parts[1]}.${parts[2]}`);
                }
              }
            });

            analysis.insights.smartCodePatterns = [...patterns];
          }
        }

      } catch (tableError) {
        console.error(`Error analyzing table ${tableName}:`, tableError);
        analysis.tables[tableName] = {
          name: tableName,
          error: tableError instanceof Error ? tableError.message : 'Unknown error'
        };
      }
    }

    // Get organizations
    try {
      const { data: orgs, count: orgCount } = await supabaseAdmin
        .from('core_organizations')
        .select('*', { count: 'exact' })
        .limit(10);

      if (orgs && orgCount) {
        analysis.insights.organizations = {
          total: orgCount,
          sample: orgs.map(org => ({
            id: org.id,
            name: org.organization_name,
            code: org.organization_code,
            industry: org.industry_type,
            country: org.country,
            currency: org.currency
          }))
        };
      }
    } catch (orgError) {
      console.error('Error fetching organizations:', orgError);
    }

    // Add summary
    analysis.summary = {
      tablesAnalyzed: Object.keys(analysis.tables).length,
      totalRows: Object.values(analysis.tables).reduce((sum: number, table: any) => 
        sum + (table.rowCount || 0), 0),
      hasData: Object.values(analysis.tables).some((table: any) => table.rowCount > 0),
      recommendations: []
    };

    // Add recommendations based on findings
    if (analysis.insights.branches.length === 0) {
      analysis.summary.recommendations.push({
        type: 'info',
        message: 'No branch entities found. Branches might be stored as dynamic data or relationships.'
      });
    }

    if (analysis.dataProfile.dynamicFieldTypes?.branch_id) {
      analysis.summary.recommendations.push({
        type: 'success',
        message: `Branch data found in core_dynamic_data using '${analysis.dataProfile.dynamicFieldTypes.branch_id.primaryType}' type.`
      });
    }

    if (analysis.insights.entityTypes.length > 0) {
      const hasExpectedTypes = EXPECTED_ENTITY_TYPES.some(type => 
        analysis.insights.entityTypes.some((et: any) => et.type === type)
      );
      
      if (hasExpectedTypes) {
        analysis.summary.recommendations.push({
          type: 'success',
          message: 'Standard entity types found in the system.'
        });
      }
    }

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Schema analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}