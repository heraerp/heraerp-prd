import { NextRequest, NextResponse } from "next/server";
import { selectValue, executeQuery } from "@/lib/db";

export const runtime = "nodejs";

/**
 * DELETE /api/v2/universal/dynamic-data-delete
 *
 * Delete dynamic fields
 *
 * Body parameters:
 * - organization_id: Required
 * - entity_id: Entity ID (required for bulk delete)
 * - field_name: Specific field name to delete
 * - field_id: Specific field ID to delete (alternative to entity_id + field_name)
 * - delete_all_fields: If true, deletes ALL fields for the entity
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const {
    organization_id,
    entity_id,
    field_name,
    field_id,
    delete_all_fields = false
  } = body;

  // Validation
  if (!organization_id) {
    return NextResponse.json(
      { error: "organization_id is required" },
      { status: 400 }
    );
  }

  if (!field_id && !entity_id) {
    return NextResponse.json(
      { error: "Either field_id or entity_id is required" },
      { status: 400 }
    );
  }

  try {
    let result;
    let deletedCount = 0;

    if (field_id) {
      // DELETE by field ID
      const deleteSql = `
        DELETE FROM core_dynamic_data
        WHERE id = $1
        AND organization_id = $2
        RETURNING id, entity_id, field_name, field_type
      `;

      result = await selectValue(deleteSql, [field_id, organization_id]);

      if (!result) {
        return NextResponse.json(
          { error: "field_not_found" },
          { status: 404 }
        );
      }

      deletedCount = 1;

    } else if (delete_all_fields && entity_id) {
      // DELETE ALL fields for an entity
      const deleteAllSql = `
        DELETE FROM core_dynamic_data
        WHERE entity_id = $1
        AND organization_id = $2
        RETURNING id, field_name
      `;

      const deletedFields = await executeQuery(deleteAllSql, [entity_id, organization_id]);
      deletedCount = deletedFields?.length || 0;

      result = {
        entity_id,
        deleted_fields: deletedFields,
        count: deletedCount
      };

    } else if (entity_id && field_name) {
      // DELETE specific field for an entity
      const deleteFieldSql = `
        DELETE FROM core_dynamic_data
        WHERE entity_id = $1
        AND field_name = $2
        AND organization_id = $3
        RETURNING id, entity_id, field_name, field_type
      `;

      result = await selectValue(deleteFieldSql, [entity_id, field_name, organization_id]);

      if (!result) {
        return NextResponse.json(
          { error: "field_not_found" },
          { status: 404 }
        );
      }

      deletedCount = 1;

    } else {
      return NextResponse.json(
        { error: "Invalid delete parameters. Provide field_id, or entity_id with field_name, or entity_id with delete_all_fields=true" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      api_version: "v2",
      success: true,
      message: `Deleted ${deletedCount} dynamic field(s)`,
      deleted_count: deletedCount,
      deleted_data: result
    });

  } catch (error: any) {
    console.error("Error in dynamic-data-delete:", error);
    return NextResponse.json(
      { error: "database_error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/universal/dynamic-data-delete/batch
 *
 * Batch delete multiple dynamic fields
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { organization_id, deletions } = body;

  if (!organization_id || !Array.isArray(deletions)) {
    return NextResponse.json(
      { error: "organization_id and deletions array are required" },
      { status: 400 }
    );
  }

  const results = [];
  let totalDeleted = 0;

  try {
    for (const deletion of deletions) {
      const deleteBody = {
        organization_id,
        ...deletion
      };

      // Reuse the DELETE logic for each deletion
      const response = await DELETE(
        new NextRequest(req.url, {
          method: 'DELETE',
          body: JSON.stringify(deleteBody)
        })
      );

      const result = await response.json();

      if (result.success) {
        totalDeleted += result.deleted_count || 0;
      }

      results.push({
        deletion_request: deletion,
        success: response.status === 200,
        ...result
      });
    }

    const hasErrors = results.some(r => !r.success);

    return NextResponse.json({
      api_version: "v2",
      success: !hasErrors,
      results,
      total_requests: results.length,
      total_deleted: totalDeleted,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }, { status: hasErrors ? 207 : 200 }); // 207 Multi-Status

  } catch (error: any) {
    console.error("Error in batch dynamic-data-delete:", error);
    return NextResponse.json(
      { error: "database_error", message: error.message },
      { status: 500 }
    );
  }
}