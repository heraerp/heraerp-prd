import { NextRequest, NextResponse } from "next/server";
import { rpc } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/v2/universal/entity-read
 *
 * Query parameters:
 * - entity_id: Get specific entity by ID
 * - entity_type: Filter by entity type
 * - entity_code: Get entity by code
 * - organization_id: Required for multi-tenancy
 * - limit: Max records to return (default 100)
 * - offset: Pagination offset (default 0)
 * - smart_code: Filter by smart code
 * - status: Filter by status (default: active)
 * - include_relationships: Include relationship count (default false)
 * - include_dynamic_data: Include dynamic data fields (default false)
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const entity_id = params.get("entity_id");
  const entity_type = params.get("entity_type");
  const entity_code = params.get("entity_code");
  const organization_id = params.get("organization_id");
  const smart_code = params.get("smart_code");
  const status = params.get("status") || "active";
  const limit = parseInt(params.get("limit") || "100");
  const offset = parseInt(params.get("offset") || "0");
  const include_relationships = params.get("include_relationships") === "true";
  const include_dynamic_data = params.get("include_dynamic_data") === "true";

  // Validate required fields
  if (!organization_id) {
    return NextResponse.json(
      { error: "organization_id is required" },
      { status: 400 }
    );
  }

  try {
    // Use database function for entity read
    const result = await rpc('hera_entity_read_v1', {
      p_organization_id: organization_id,
      p_entity_id: entity_id || null,
      p_entity_type: entity_type || null,
      p_entity_code: entity_code || null,
      p_smart_code: smart_code || null,
      p_status: status || null,
      p_include_relationships: include_relationships,
      p_include_dynamic_data: include_dynamic_data,
      p_limit: limit,
      p_offset: offset
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "entity_operation_failed",
          message: result.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      api_version: "v2",
      ...result
    });

  } catch (error: any) {
    console.error("Error in entity-read:", error);

    // Handle specific database errors
    if (error.message?.includes('HERA_ENTITY_NOT_FOUND')) {
      return NextResponse.json(
        { error: "entity_not_found", message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "database_error", message: error.message },
      { status: 500 }
    );
  }
}