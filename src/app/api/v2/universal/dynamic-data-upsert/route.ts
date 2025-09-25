import { NextRequest, NextResponse } from "next/server";
import { selectValue } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/v2/universal/dynamic-data-upsert
 *
 * Upsert dynamic fields for entities
 * Will update if entity_id + field_name combination exists, otherwise insert
 *
 * Body parameters:
 * - organization_id: Required
 * - entity_id: Entity this field belongs to (required)
 * - field_name: Name of the field (required)
 * - field_type: Type of field (text, number, boolean, date, datetime, json)
 * - field_value_text: Text value
 * - field_value_number: Numeric value
 * - field_value_boolean: Boolean value
 * - field_value_date: Date value
 * - field_value_datetime: DateTime value
 * - field_value_json: JSON value
 * - smart_code: Smart code for the field
 * - metadata: Additional metadata
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const {
    organization_id,
    entity_id,
    field_name,
    field_type = "text",
    field_value_text,
    field_value_number,
    field_value_boolean,
    field_value_date,
    field_value_datetime,
    field_value_json,
    smart_code,
    metadata = {}
  } = body;

  // Validation
  if (!organization_id || !entity_id || !field_name) {
    return NextResponse.json(
      { error: "organization_id, entity_id, and field_name are required" },
      { status: 400 }
    );
  }

  // Validate field_type
  const validTypes = ["text", "number", "boolean", "date", "datetime", "json"];
  if (!validTypes.includes(field_type)) {
    return NextResponse.json(
      { error: `Invalid field_type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // Check if the dynamic field already exists
    const checkSql = `
      SELECT id FROM core_dynamic_data
      WHERE organization_id = $1
      AND entity_id = $2
      AND field_name = $3
    `;

    const existingField = await selectValue(checkSql, [
      organization_id,
      entity_id,
      field_name
    ]);

    let result;

    if (existingField) {
      // UPDATE existing field
      const updateSql = `
        UPDATE core_dynamic_data
        SET
          field_type = $4,
          field_value_text = $5,
          field_value_number = $6,
          field_value_boolean = $7,
          field_value_date = $8,
          field_value_datetime = $9,
          field_value_json = $10,
          smart_code = $11,
          metadata = COALESCE(metadata, '{}'::jsonb) || $12::jsonb,
          updated_at = NOW()
        WHERE organization_id = $1
        AND entity_id = $2
        AND field_name = $3
        RETURNING id, field_name, field_type
      `;

      result = await selectValue(updateSql, [
        organization_id,
        entity_id,
        field_name,
        field_type,
        field_value_text || null,
        field_value_number || null,
        field_value_boolean ?? null,
        field_value_date || null,
        field_value_datetime || null,
        field_value_json || null,
        smart_code || null,
        metadata
      ]);

    } else {
      // INSERT new field
      const insertSql = `
        INSERT INTO core_dynamic_data (
          organization_id,
          entity_id,
          field_name,
          field_type,
          field_value_text,
          field_value_number,
          field_value_boolean,
          field_value_date,
          field_value_datetime,
          field_value_json,
          smart_code,
          metadata,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        )
        RETURNING id, field_name, field_type
      `;

      result = await selectValue(insertSql, [
        organization_id,
        entity_id,
        field_name,
        field_type,
        field_value_text || null,
        field_value_number || null,
        field_value_boolean ?? null,
        field_value_date || null,
        field_value_datetime || null,
        field_value_json || null,
        smart_code || null,
        metadata
      ]);
    }

    return NextResponse.json({
      api_version: "v2",
      success: true,
      dynamic_field_id: result.id,
      field_name: result.field_name,
      is_update: !!existingField
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error in dynamic-data-upsert:", error);
    return NextResponse.json(
      { error: "database_error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v2/universal/dynamic-data-upsert/batch
 *
 * Batch upsert multiple dynamic fields for an entity
 */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { organization_id, entity_id, fields } = body;

  if (!organization_id || !entity_id || !Array.isArray(fields)) {
    return NextResponse.json(
      { error: "organization_id, entity_id, and fields array are required" },
      { status: 400 }
    );
  }

  const results = [];

  try {
    for (const field of fields) {
      const fieldBody = {
        organization_id,
        entity_id,
        ...field
      };

      // Reuse the POST logic for each field
      const response = await POST(
        new NextRequest(req.url, {
          method: 'POST',
          body: JSON.stringify(fieldBody)
        })
      );

      const result = await response.json();
      results.push({
        field_name: field.field_name,
        success: response.status === 201,
        ...result
      });
    }

    const hasErrors = results.some(r => !r.success);

    return NextResponse.json({
      api_version: "v2",
      success: !hasErrors,
      results,
      total: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }, { status: hasErrors ? 207 : 201 }); // 207 Multi-Status

  } catch (error: any) {
    console.error("Error in batch dynamic-data-upsert:", error);
    return NextResponse.json(
      { error: "database_error", message: error.message },
      { status: 500 }
    );
  }
}