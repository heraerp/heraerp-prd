/**
 * MCP Execution Endpoint
 * Routes DNA SDK operations to MCP for enforcement of HERA principles
 * Smart Code: HERA.MCP.API.EXECUTE.v1
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { operation, organizationId } = await request.json();

    if (!operation || !organizationId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: operation and organizationId',
          smartCode: 'HERA.MCP.ERROR.MISSING_FIELDS.v1'
        }, 
        { status: 400 }
      );
    }

    // Map operation to MCP command
    const command = mapOperationToMCPCommand(operation);
    
    // Execute MCP command
    const mcpPath = path.join(process.cwd(), 'mcp-server');
    const fullCommand = `cd ${mcpPath} && node hera-cli.js ${command.action} '${JSON.stringify(command.args)}'`;
    
    console.log('MCP Execute:', { command: command.action, args: command.args });

    try {
      const { stdout, stderr } = await execAsync(fullCommand, {
        env: { ...process.env, FORCE_COLOR: '0' }
      });

      if (stderr && !stderr.includes('Warning')) {
        console.error('MCP stderr:', stderr);
        throw new Error(stderr);
      }

      // Parse MCP output
      const result = parseMCPOutput(stdout);
      
      return NextResponse.json({
        success: true,
        data: result,
        smartCode: 'HERA.MCP.SUCCESS.v1'
      });
    } catch (execError: any) {
      console.error('MCP execution error:', execError);
      return NextResponse.json(
        { 
          success: false, 
          error: execError.message || 'MCP execution failed',
          smartCode: 'HERA.MCP.ERROR.EXECUTION.v1'
        }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('MCP API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        smartCode: 'HERA.MCP.ERROR.INTERNAL.v1'
      }, 
      { status: 500 }
    );
  }
}

/**
 * Map DNA operation to MCP command
 */
function mapOperationToMCPCommand(operation: any): { action: string; args: any } {
  const { table, operation: op, data, id } = operation;

  // Map table to MCP entity type
  const tableMap: Record<string, string> = {
    'core_entities': 'entity',
    'universal_transactions': 'transaction',
    'core_relationships': 'relationship',
    'core_dynamic_data': 'dynamic',
  };

  const baseType = tableMap[table] || 'entity';

  switch (op) {
    case 'create':
      if (table === 'core_entities') {
        return {
          action: 'create-entity',
          args: {
            organization_id: operation.organizationId,
            entity_type: data.entity_type,
            entity_name: data.entity_name,
            entity_code: data.entity_code,
            smart_code: data.smart_code,
            metadata: data.metadata
          }
        };
      } else if (table === 'universal_transactions') {
        return {
          action: 'create-transaction',
          args: {
            organization_id: operation.organizationId,
            transaction_type: data.transaction_type,
            transaction_code: data.transaction_code,
            transaction_date: data.transaction_date,
            smart_code: data.smart_code,
            from_entity_id: data.from_entity_id,
            to_entity_id: data.to_entity_id,
            total_amount: data.total_amount,
            currency: data.currency,
            metadata: data.metadata
          }
        };
      } else if (table === 'core_relationships') {
        return {
          action: 'create-relationship',
          args: {
            organization_id: operation.organizationId,
            from_entity_id: data.from_entity_id,
            to_entity_id: data.to_entity_id,
            relationship_type: data.relationship_type,
            smart_code: data.smart_code,
            metadata: data.metadata
          }
        };
      } else if (table === 'core_dynamic_data') {
        return {
          action: 'set-field',
          args: {
            organization_id: operation.organizationId,
            entity_id: data.entity_id,
            field_name: data.field_name,
            field_value: data.field_value_text || data.field_value_number || 
                        data.field_value_boolean || data.field_value_date || 
                        data.field_value_json,
            smart_code: data.smart_code
          }
        };
      }
      break;

    case 'read':
      return {
        action: `query`,
        args: {
          organization_id: operation.organizationId,
          table: table,
          filters: data.filters || {},
          limit: data.limit || 100
        }
      };

    case 'update':
      return {
        action: `update-${baseType}`,
        args: {
          organization_id: operation.organizationId,
          id: id,
          updates: data
        }
      };

    case 'delete':
      return {
        action: `delete-${baseType}`,
        args: {
          organization_id: operation.organizationId,
          id: id
        }
      };
  }

  throw new Error(`Unsupported operation: ${op} on table ${table}`);
}

/**
 * Parse MCP output
 */
function parseMCPOutput(output: string): any {
  try {
    // Try to parse as JSON first
    const lines = output.split('\n');
    const jsonLine = lines.find(line => line.trim().startsWith('{') || line.trim().startsWith('['));
    if (jsonLine) {
      return JSON.parse(jsonLine);
    }

    // Look for success patterns
    if (output.includes('✅ Created entity') || output.includes('✅ Created transaction')) {
      // Extract ID from output
      const idMatch = output.match(/ID: ([a-f0-9-]+)/i);
      return {
        id: idMatch ? idMatch[1] : null,
        success: true
      };
    }

    // For queries, look for data
    if (output.includes('Found') && output.includes('records')) {
      // Simple extraction - in production, parse the table output
      return [];
    }

    // Default return
    return { success: true, output };
  } catch (error) {
    console.error('Failed to parse MCP output:', error);
    return { success: true, raw: output };
  }
}