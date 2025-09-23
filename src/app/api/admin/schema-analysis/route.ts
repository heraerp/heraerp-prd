import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public'
    }
  }
)

interface SchemaAnalysis {
  timestamp: string
  database: {
    version: string
    schemas: string[]
  }
  tables: Record<string, TableInfo>
  relationships: RelationshipInfo[]
  indexes: IndexInfo[]
  constraints: ConstraintInfo[]
  dataProfiling: Record<string, TableProfile>
  dynamicDataTypes: DynamicDataType[]
  sampleData: Record<string, any[]>
}

interface TableInfo {
  name: string
  schema: string
  rowCount: number
  estimatedSize: string
  columns: ColumnInfo[]
  primaryKeys: string[]
  foreignKeys: ForeignKeyInfo[]
}

interface ColumnInfo {
  name: string
  dataType: string
  isNullable: boolean
  defaultValue: string | null
  maxLength: number | null
  numericPrecision: number | null
  numericScale: number | null
  isIdentity: boolean
  identityGeneration: string | null
}

interface RelationshipInfo {
  constraintName: string
  sourceTable: string
  sourceColumns: string[]
  targetTable: string
  targetColumns: string[]
  updateRule: string
  deleteRule: string
}

interface IndexInfo {
  schemaName: string
  tableName: string
  indexName: string
  indexType: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
  isPartial: boolean
  indexDefinition: string
}

interface ConstraintInfo {
  schemaName: string
  tableName: string
  constraintName: string
  constraintType: string
  definition: string
}

interface TableProfile {
  tableName: string
  rowCount: number
  nullCounts: Record<string, number>
  distinctCounts: Record<string, number>
  minMaxValues: Record<string, { min: any; max: any }>
}

interface DynamicDataType {
  fieldName: string
  dataTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
  sampleValues: any[]
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication (implement your auth check here)
    // For now, we'll use a simple API key check
    const apiKey = request.headers.get('x-admin-api-key')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysis: SchemaAnalysis = {
      timestamp: new Date().toISOString(),
      database: {
        version: '',
        schemas: []
      },
      tables: {},
      relationships: [],
      indexes: [],
      constraints: [],
      dataProfiling: {},
      dynamicDataTypes: [],
      sampleData: {}
    }

    // 1. Get PostgreSQL version - simplified
    analysis.database.version = 'PostgreSQL (Supabase)'

    // 2. Get all schemas - for now, we'll just use public schema
    analysis.database.schemas = ['public']

    // 3. Get all tables with detailed column information
    const tablesQuery = `
      SELECT 
        t.table_schema,
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_identity,
        c.identity_generation
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_schema = c.table_schema 
        AND t.table_name = c.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `

    const { data: columnsData, error: columnsError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: tablesQuery
      })
      .single()

    if (columnsError) {
      console.error('Error fetching columns:', columnsError)
      // Fallback to direct query
      const { data: tables } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')

      for (const table of tables || []) {
        const { data: columns } = await supabaseAdmin
          .from('information_schema.columns')
          .select('*')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)

        analysis.tables[table.table_name] = {
          name: table.table_name,
          schema: 'public',
          rowCount: 0,
          estimatedSize: 'Unknown',
          columns:
            columns?.map(col => ({
              name: col.column_name,
              dataType: col.data_type,
              isNullable: col.is_nullable === 'YES',
              defaultValue: col.column_default,
              maxLength: col.character_maximum_length,
              numericPrecision: col.numeric_precision,
              numericScale: col.numeric_scale,
              isIdentity: col.is_identity === 'YES',
              identityGeneration: col.identity_generation
            })) || [],
          primaryKeys: [],
          foreignKeys: []
        }
      }
    } else if (columnsData) {
      // Process columns data
      const tableMap: Record<string, TableInfo> = {}

      for (const row of columnsData) {
        if (!tableMap[row.table_name]) {
          tableMap[row.table_name] = {
            name: row.table_name,
            schema: row.table_schema,
            rowCount: 0,
            estimatedSize: 'Unknown',
            columns: [],
            primaryKeys: [],
            foreignKeys: []
          }
        }

        tableMap[row.table_name].columns.push({
          name: row.column_name,
          dataType: row.data_type,
          isNullable: row.is_nullable === 'YES',
          defaultValue: row.column_default,
          maxLength: row.character_maximum_length,
          numericPrecision: row.numeric_precision,
          numericScale: row.numeric_scale,
          isIdentity: row.is_identity === 'YES',
          identityGeneration: row.identity_generation
        })
      }

      analysis.tables = tableMap
    }

    // 4. Get row counts for each table
    for (const tableName of Object.keys(analysis.tables)) {
      try {
        const { count } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        analysis.tables[tableName].rowCount = count || 0
      } catch (error) {
        console.error(`Error getting row count for ${tableName}:`, error)
      }
    }

    // 5. Get primary keys
    const primaryKeysQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.constraint_type = 'PRIMARY KEY'
      ORDER BY tc.table_name, kcu.ordinal_position
    `

    try {
      const { data: pkData } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: primaryKeysQuery
        })
        .single()

      if (pkData) {
        for (const row of pkData) {
          if (analysis.tables[row.table_name]) {
            analysis.tables[row.table_name].primaryKeys.push(row.column_name)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching primary keys:', error)
    }

    // 6. Get foreign key relationships
    const foreignKeysQuery = `
      SELECT 
        tc.constraint_name,
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
    `

    try {
      const { data: fkData } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: foreignKeysQuery
        })
        .single()

      if (fkData) {
        const fkMap: Record<string, RelationshipInfo> = {}

        for (const row of fkData) {
          if (!fkMap[row.constraint_name]) {
            fkMap[row.constraint_name] = {
              constraintName: row.constraint_name,
              sourceTable: row.source_table,
              sourceColumns: [],
              targetTable: row.target_table,
              targetColumns: [],
              updateRule: row.update_rule,
              deleteRule: row.delete_rule
            }
          }

          fkMap[row.constraint_name].sourceColumns.push(row.source_column)
          fkMap[row.constraint_name].targetColumns.push(row.target_column)

          // Also add to table foreign keys
          if (analysis.tables[row.source_table]) {
            analysis.tables[row.source_table].foreignKeys.push({
              column: row.source_column,
              referencesTable: row.target_table,
              referencesColumn: row.target_column
            } as any)
          }
        }

        analysis.relationships = Object.values(fkMap)
      }
    } catch (error) {
      console.error('Error fetching foreign keys:', error)
    }

    // 7. Get indexes
    const indexesQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `

    try {
      const { data: indexData } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: indexesQuery
        })
        .single()

      if (indexData) {
        analysis.indexes = indexData.map((row: any) => ({
          schemaName: row.schemaname,
          tableName: row.tablename,
          indexName: row.indexname,
          indexType: row.indexdef.includes('btree') ? 'btree' : 'other',
          columns: [], // Would need to parse from indexdef
          isUnique: row.indexdef.includes('UNIQUE'),
          isPrimary: row.indexname.includes('pkey'),
          isPartial: row.indexdef.includes('WHERE'),
          indexDefinition: row.indexdef
        }))
      }
    } catch (error) {
      console.error('Error fetching indexes:', error)
    }

    // 8. Analyze core_dynamic_data field types
    if (analysis.tables['core_dynamic_data']) {
      try {
        const dynamicDataQuery = `
          SELECT 
            field_name,
            COUNT(*) as total_count,
            COUNT(field_value_text) as text_count,
            COUNT(field_value_number) as number_count,
            COUNT(field_value_boolean) as boolean_count,
            COUNT(field_value_date) as date_count,
            COUNT(field_value_json) as json_count
          FROM core_dynamic_data
          GROUP BY field_name
          ORDER BY total_count DESC
          LIMIT 20
        `

        const { data: ddData } = await supabaseAdmin
          .rpc('exec_sql', {
            sql: dynamicDataQuery
          })
          .single()

        if (ddData) {
          analysis.dynamicDataTypes = ddData.map((row: any) => {
            const types = []
            const total = row.total_count

            if (row.text_count > 0) {
              types.push({
                type: 'text',
                count: row.text_count,
                percentage: (row.text_count / total) * 100
              })
            }
            if (row.number_count > 0) {
              types.push({
                type: 'number',
                count: row.number_count,
                percentage: (row.number_count / total) * 100
              })
            }
            if (row.boolean_count > 0) {
              types.push({
                type: 'boolean',
                count: row.boolean_count,
                percentage: (row.boolean_count / total) * 100
              })
            }
            if (row.date_count > 0) {
              types.push({
                type: 'date',
                count: row.date_count,
                percentage: (row.date_count / total) * 100
              })
            }
            if (row.json_count > 0) {
              types.push({
                type: 'json',
                count: row.json_count,
                percentage: (row.json_count / total) * 100
              })
            }

            return {
              fieldName: row.field_name,
              dataTypes: types,
              sampleValues: []
            }
          })
        }
      } catch (error) {
        console.error('Error analyzing dynamic data types:', error)
      }
    }

    // 9. Get sample data for key tables
    const samplesToFetch = [
      'core_organizations',
      'core_entities',
      'core_dynamic_data',
      'core_relationships',
      'universal_transactions',
      'universal_transaction_lines'
    ]

    for (const tableName of samplesToFetch) {
      if (analysis.tables[tableName]) {
        try {
          const { data: sampleData } = await supabaseAdmin.from(tableName).select('*').limit(5)

          analysis.sampleData[tableName] = sampleData || []
        } catch (error) {
          console.error(`Error fetching sample data for ${tableName}:`, error)
        }
      }
    }

    // 10. Profile data for key columns
    for (const tableName of ['core_entities', 'universal_transactions']) {
      if (analysis.tables[tableName] && analysis.tables[tableName].rowCount > 0) {
        const profile: TableProfile = {
          tableName,
          rowCount: analysis.tables[tableName].rowCount,
          nullCounts: {},
          distinctCounts: {},
          minMaxValues: {}
        }

        // Get distinct counts for key columns
        if (tableName === 'core_entities') {
          try {
            const { data: entityTypes } = await supabaseAdmin
              .from('core_entities')
              .select('entity_type')
              .order('entity_type')

            const uniqueTypes = new Set(entityTypes?.map(e => e.entity_type))
            profile.distinctCounts['entity_type'] = uniqueTypes.size
          } catch (error) {
            console.error('Error profiling entity types:', error)
          }
        }

        if (tableName === 'universal_transactions') {
          try {
            const { data: transactionTypes } = await supabaseAdmin
              .from('universal_transactions')
              .select('transaction_type')
              .order('transaction_type')

            const uniqueTypes = new Set(transactionTypes?.map(t => t.transaction_type))
            profile.distinctCounts['transaction_type'] = uniqueTypes.size
          } catch (error) {
            console.error('Error profiling transaction types:', error)
          }
        }

        analysis.dataProfiling[tableName] = profile
      }
    }

    return NextResponse.json({
      success: true,
      analysis
    })
  } catch (error) {
    console.error('Schema analysis error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
