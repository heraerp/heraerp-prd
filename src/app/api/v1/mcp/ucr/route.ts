import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ucrMCPServer } from '@/lib/mcp/ucr-mcp-server'
import { initializeUCRMCP } from '@/lib/mcp/initialize-ucr-mcp'

// Ensure MCP server is initialized
initializeUCRMCP()

// Create Supabase client
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Map of tool names to their corresponding MCP methods
const TOOL_MAPPING: Record<string, string> = {
  'list_templates': 'ucr.list_templates',
  'clone_template': 'ucr.clone_template',
  'get_rule': 'ucr.get_rule',
  'validate_rule': 'ucr.validate_rule',
  'simulate_rule': 'ucr.simulate_rule',
  'diff_rules': 'ucr.diff_rules',
  'bump_version': 'ucr.bump_version',
  'deploy_rule': 'ucr.deploy_rule',
  'schedule_change': 'ucr.schedule_change',
  'rollback': 'ucr.rollback',
  'audit_log': 'ucr.audit_log',
  'search': 'ucr.search',
  'validate_payload': 'guardrail.validate_payload',
  'is_period_open': 'ledger.is_period_open',
  'check_scope': 'auth.check_scope'
}

export async function POST(request: NextRequest) {
  try {
    const { tool, args, organizationId } = await request.json()
    
    if (!tool || !organizationId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: tool and organizationId' 
      }, { status: 400 })
    }

    // Verify organization exists
    const supabase = getSupabase()
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('id', organizationId)
      .single()
    
    if (orgError || !org) {
      return NextResponse.json({ 
        error: 'Invalid organization' 
      }, { status: 401 })
    }

    // Get the MCP tool name
    const mcpToolName = TOOL_MAPPING[tool]
    if (!mcpToolName) {
      return NextResponse.json({ 
        error: `Unknown tool: ${tool}` 
      }, { status: 400 })
    }

    // Ensure organizationId is passed in args
    const toolArgs = {
      ...args,
      organization_id: organizationId
    }

    // Call the MCP server handler directly
    const result = await ucrMCPServer.handleToolCall(mcpToolName, toolArgs)
    
    // Extract the response content
    if (result.isError) {
      return NextResponse.json({ 
        error: result.content[0]?.text || 'Tool execution failed' 
      }, { status: 400 })
    }

    // Parse the JSON response
    const responseText = result.content[0]?.text
    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseText)
    } catch (e) {
      parsedResponse = { result: responseText }
    }

    return NextResponse.json(parsedResponse)

  } catch (error: any) {
    console.error('MCP UCR API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

// List available tools
export async function GET(request: NextRequest) {
  try {
    const tools = Object.keys(TOOL_MAPPING).map(key => ({
      name: key,
      mcpName: TOOL_MAPPING[key],
      description: getToolDescription(key)
    }))

    return NextResponse.json({ tools })
  } catch (error: any) {
    console.error('MCP UCR API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

function getToolDescription(tool: string): string {
  const descriptions: Record<string, string> = {
    'list_templates': 'List available UCR templates by industry and module',
    'clone_template': 'Clone a template to create a new rule',
    'get_rule': 'Get a rule by ID or smart code',
    'validate_rule': 'Validate a draft rule',
    'simulate_rule': 'Simulate rule execution with test scenarios',
    'diff_rules': 'Compare two rule versions',
    'bump_version': 'Create a new version of a rule',
    'deploy_rule': 'Deploy a rule to production',
    'schedule_change': 'Schedule a future rule change',
    'rollback': 'Rollback to a previous rule version',
    'audit_log': 'Get audit log for a rule',
    'search': 'Search for rules',
    'validate_payload': 'Validate rule payload against guardrails',
    'is_period_open': 'Check if accounting period is open',
    'check_scope': 'Check if user has required permissions'
  }
  return descriptions[tool] || 'No description available'
}