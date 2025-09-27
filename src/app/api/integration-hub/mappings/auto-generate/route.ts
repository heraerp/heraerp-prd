import { NextRequest, NextResponse } from 'next/server'
import { MappingEngine } from '@/lib/integration-hub/mapping-engine'
import type { SchemaField } from '@/types/integration-hub'

// POST /api/integration-hub/mappings/auto-generate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceSchema, targetSchema } = body

    if (!sourceSchema || !targetSchema) {
      return NextResponse.json({ error: 'Source and target schemas required' }, { status: 400 })
    }

    // Validate schemas
    if (!Array.isArray(sourceSchema.fields) || !Array.isArray(targetSchema.fields)) {
      return NextResponse.json({ error: 'Invalid schema format' }, { status: 400 })
    }

    const fieldMappings = MappingEngine.autoGenerateMappings(
      sourceSchema.fields as SchemaField[],
      targetSchema.fields as SchemaField[]
    )

    const stats = {
      sourceFieldCount: sourceSchema.fields.length,
      targetFieldCount: targetSchema.fields.length,
      mappedFieldCount: fieldMappings.length,
      unmappedSourceFields: sourceSchema.fields
        .filter((sf: SchemaField) => !fieldMappings.some(m => m.source_field === sf.name))
        .map((f: SchemaField) => f.name),
      unmappedTargetFields: targetSchema.fields
        .filter((tf: SchemaField) => !fieldMappings.some(m => m.target_field === tf.name))
        .map((f: SchemaField) => f.name),
      mappingConfidence:
        (
          (fieldMappings.length /
            Math.min(sourceSchema.fields.length, targetSchema.fields.length)) *
          100
        ).toFixed(1) + '%'
    }

    return NextResponse.json({
      success: true,
      fieldMappings,
      stats
    })
  } catch (error) {
    console.error('Error auto-generating mappings:', error)
    return NextResponse.json({ error: 'Failed to auto-generate mappings' }, { status: 500 })
  }
}
