/**
 * HERA UCR MCP Server
 * Smart Code: HERA.MCP.UCR.ORCHESTRATOR.v1
 * 
 * Model Context Protocol server for Universal Configuration Rules orchestration
 * Integrated directly into the HERA app for rule management without schema changes
 */

// MCP imports temporarily commented out - missing dependencies
// import { Server } from '@modelcontextprotocol/sdk/server/index.js'
// import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
// import {
//   CallToolRequestSchema,
//   ListToolsRequestSchema,
//   Tool,
// } from '@modelcontextprotocol/sdk/types.js'

// Temporary type definitions to prevent TypeScript errors
type Tool = any
type Server = any

import { z } from 'zod'
import { universalApi } from '@/lib/universal-api'
import { universalConfigService } from '@/lib/universal-config/universal-config-service'
import { v4 as uuidv4 } from 'uuid'
import { formatDate } from '@/lib/date-utils'
import { parseISO, isAfter, isBefore } from 'date-fns'

// Tool parameter schemas
const ListTemplatesSchema = z.object({
  industry: z.string().optional(),
  module: z.string().optional(),
})

const CloneTemplateSchema = z.object({
  template_id: z.string(),
  target_smart_code: z.string(),
  organization_id: z.string().uuid(),
})

const GetRuleSchema = z.object({
  rule_id: z.string().optional(),
  smart_code: z.string().optional(),
  organization_id: z.string().uuid(),
})

const ValidateRuleSchema = z.object({
  draft_rule: z.object({
    organization_id: z.string().uuid(),
    smart_code: z.string().regex(/^HERA\.[A-Z]+(\.[A-Z0-9]+){2,}\.v[0-9]+$/),
    title: z.string(),
    status: z.enum(['draft', 'active', 'deprecated']),
    tags: z.array(z.string()),
    owner: z.string(),
    version: z.number(),
    schema_version: z.number(),
    rule_payload: z.any(),
  }),
  organization_id: z.string().uuid(),
})

const SimulateRuleSchema = z.object({
  rule_id: z.string().optional(),
  draft_rule: z.any().optional(),
  scenarios: z.array(z.object({
    scenario_id: z.string(),
    context: z.any(),
    expected: z.any(),
  })),
  organization_id: z.string().uuid(),
})

const DiffRulesSchema = z.object({
  base_rule_id: z.string(),
  new_rule_id: z.string(),
})

const BumpVersionSchema = z.object({
  rule_id: z.string(),
  change_type: z.enum(['minor', 'major']),
  notes: z.string(),
})

const DeployRuleSchema = z.object({
  rule_id: z.string(),
  scope: z.object({
    apps: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    segments: z.any().optional(),
  }),
  effective_from: z.string(),
  effective_to: z.string().optional(),
  organization_id: z.string().uuid(),
  approvals: z.array(z.object({
    user_id: z.string(),
    at: z.string(),
  })),
})

const ScheduleChangeSchema = z.object({
  rule_id: z.string(),
  schedule: z.object({
    cron: z.string().optional(),
    datetime: z.string().optional(),
  }),
  organization_id: z.string().uuid(),
})

const RollbackSchema = z.object({
  rule_id: z.string().optional(),
  smart_code: z.string().optional(),
  to_version: z.number(),
  organization_id: z.string().uuid(),
})

const AuditLogSchema = z.object({
  object_ref: z.string(),
  organization_id: z.string().uuid(),
  from: z.string().optional(),
  to: z.string().optional(),
})

const SearchSchema = z.object({
  query: z.string(),
  organization_id: z.string().uuid(),
  tags: z.array(z.string()).optional(),
  include_deprecated: z.boolean().optional(),
})

const ValidatePayloadSchema = z.object({
  payload: z.any(),
  organization_id: z.string().uuid(),
})

const IsPeriodOpenSchema = z.object({
  date: z.string(),
  organization_id: z.string().uuid(),
})

const CheckScopeSchema = z.object({
  organization_id: z.string().uuid(),
  required_roles: z.array(z.string()),
})

// UCR Template library
const UCR_TEMPLATES = [
  {
    template_id: 'T_APPT_CANCEL',
    industry: 'HOSPITALITY',
    module: 'SALON',
    smart_code: 'HERA.HOSPITALITY.SALON.APPOINTMENT.CANCEL_POLICY.v1',
    title: 'Salon Appointment Cancellation Policy',
    rule_payload: {
      description: 'Standard salon cancellation policy with grace periods and fees',
      definitions: {
        grace_minutes: 15,
        no_show_fee_pct: 100,
        late_cancel_threshold_minutes: 120,
        late_cancel_fee_pct: 50,
      },
      exceptions: [
        { if: { customer_tier: 'VIP' }, then: { late_cancel_fee_pct: 0, no_show_fee_pct: 25 } }
      ],
      calendar_effects: { block_future_bookings_on_no_show: true, blocks_days: 1 },
      notifications: { channels: ['SMS', 'WHATSAPP'], template: 'SALON_CANCEL_POLICY_V1' },
    },
  },
  {
    template_id: 'T_POS_DISCOUNT',
    industry: 'HOSPITALITY',
    module: 'SALON',
    smart_code: 'HERA.HOSPITALITY.SALON.POS.DISCOUNT_CAP.v1',
    title: 'POS Discount Cap Rules',
    rule_payload: {
      description: 'Maximum discount limits for POS transactions',
      definitions: {
        max_discount_pct: 30,
        max_discount_amount: 500,
        requires_approval_above: 20,
      },
      exceptions: [
        { if: { staff_role: 'MANAGER' }, then: { max_discount_pct: 50 } },
        { if: { customer_tier: 'VIP' }, then: { max_discount_pct: 40 } },
      ],
    },
  },
  {
    template_id: 'T_BOOKING_WINDOW',
    industry: 'HOSPITALITY',
    module: 'RESTAURANT',
    smart_code: 'HERA.HOSPITALITY.RESTAURANT.RESERVATION.BOOKING_WINDOW.v1',
    title: 'Restaurant Booking Window Rules',
    rule_payload: {
      description: 'Advance booking windows by customer type',
      definitions: {
        standard_advance_days: 30,
        vip_advance_days: 90,
        min_lead_hours: 2,
      },
      peak_periods: [
        { dates: ['2025-12-24', '2025-12-25'], min_lead_hours: 24 },
        { dates: ['2025-12-31'], min_lead_hours: 48 },
      ],
    },
  },
]

// MCP Server implementation - temporarily disabled due to missing dependencies
/* 
class UCRMCPServer {
  private server: Server
  private organizationId: string = ''

  constructor() {
    this.server = new Server(
      {
        name: 'hera-ucr-orchestrator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    this.setupHandlers()
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }))

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case 'ucr.list_templates':
            return await this.listTemplates(ListTemplatesSchema.parse(args))
          case 'ucr.clone_template':
            return await this.cloneTemplate(CloneTemplateSchema.parse(args))
          case 'ucr.get_rule':
            return await this.getRule(GetRuleSchema.parse(args))
          case 'ucr.validate_rule':
            return await this.validateRule(ValidateRuleSchema.parse(args))
          case 'ucr.simulate_rule':
            return await this.simulateRule(SimulateRuleSchema.parse(args))
          case 'ucr.diff_rules':
            return await this.diffRules(DiffRulesSchema.parse(args))
          case 'ucr.bump_version':
            return await this.bumpVersion(BumpVersionSchema.parse(args))
          case 'ucr.deploy_rule':
            return await this.deployRule(DeployRuleSchema.parse(args))
          case 'ucr.schedule_change':
            return await this.scheduleChange(ScheduleChangeSchema.parse(args))
          case 'ucr.rollback':
            return await this.rollback(RollbackSchema.parse(args))
          case 'ucr.audit_log':
            return await this.auditLog(AuditLogSchema.parse(args))
          case 'ucr.search':
            return await this.searchRules(SearchSchema.parse(args))
          case 'guardrail.validate_payload':
            return await this.validatePayload(ValidatePayloadSchema.parse(args))
          case 'ledger.is_period_open':
            return await this.isPeriodOpen(IsPeriodOpenSchema.parse(args))
          case 'auth.check_scope':
            return await this.checkScope(CheckScopeSchema.parse(args))
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            content: [{
              type: 'text',
              text: `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
            }],
            isError: true,
          }
        }
        throw error
      }
    })
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'ucr.list_templates',
        description: 'List available UCR templates by industry and module',
        inputSchema: {
          type: 'object',
          properties: {
            industry: { type: 'string', description: 'Industry filter (e.g., HOSPITALITY)' },
            module: { type: 'string', description: 'Module filter (e.g., SALON, RESTAURANT)' },
          },
        },
      },
      {
        name: 'ucr.clone_template',
        description: 'Clone a template to create a new rule',
        inputSchema: {
          type: 'object',
          properties: {
            template_id: { type: 'string' },
            target_smart_code: { type: 'string' },
            organization_id: { type: 'string' },
          },
          required: ['template_id', 'target_smart_code', 'organization_id'],
        },
      },
      {
        name: 'ucr.get_rule',
        description: 'Get a rule by ID or smart code',
        inputSchema: {
          type: 'object',
          properties: {
            rule_id: { type: 'string' },
            smart_code: { type: 'string' },
            organization_id: { type: 'string' },
          },
          required: ['organization_id'],
        },
      },
      {
        name: 'ucr.validate_rule',
        description: 'Validate a draft rule',
        inputSchema: {
          type: 'object',
          properties: {
            draft_rule: { type: 'object' },
            organization_id: { type: 'string' },
          },
          required: ['draft_rule', 'organization_id'],
        },
      },
      {
        name: 'ucr.simulate_rule',
        description: 'Simulate rule execution with test scenarios',
        inputSchema: {
          type: 'object',
          properties: {
            rule_id: { type: 'string' },
            draft_rule: { type: 'object' },
            scenarios: { type: 'array' },
            organization_id: { type: 'string' },
          },
          required: ['scenarios', 'organization_id'],
        },
      },
      {
        name: 'ucr.diff_rules',
        description: 'Compare two rule versions',
        inputSchema: {
          type: 'object',
          properties: {
            base_rule_id: { type: 'string' },
            new_rule_id: { type: 'string' },
          },
          required: ['base_rule_id', 'new_rule_id'],
        },
      },
      {
        name: 'ucr.bump_version',
        description: 'Create a new version of a rule',
        inputSchema: {
          type: 'object',
          properties: {
            rule_id: { type: 'string' },
            change_type: { type: 'string', enum: ['minor', 'major'] },
            notes: { type: 'string' },
          },
          required: ['rule_id', 'change_type', 'notes'],
        },
      },
      {
        name: 'ucr.deploy_rule',
        description: 'Deploy a rule to production',
        inputSchema: {
          type: 'object',
          properties: {
            rule_id: { type: 'string' },
            scope: { type: 'object' },
            effective_from: { type: 'string' },
            effective_to: { type: 'string' },
            organization_id: { type: 'string' },
            approvals: { type: 'array' },
          },
          required: ['rule_id', 'scope', 'effective_from', 'organization_id', 'approvals'],
        },
      },
      {
        name: 'ucr.schedule_change',
        description: 'Schedule a future rule change',
        inputSchema: {
          type: 'object',
          properties: {
            rule_id: { type: 'string' },
            schedule: { type: 'object' },
            organization_id: { type: 'string' },
          },
          required: ['rule_id', 'schedule', 'organization_id'],
        },
      },
      {
        name: 'ucr.rollback',
        description: 'Rollback to a previous rule version',
        inputSchema: {
          type: 'object',
          properties: {
            rule_id: { type: 'string' },
            smart_code: { type: 'string' },
            to_version: { type: 'number' },
            organization_id: { type: 'string' },
          },
          required: ['to_version', 'organization_id'],
        },
      },
      {
        name: 'ucr.audit_log',
        description: 'Get audit log for a rule',
        inputSchema: {
          type: 'object',
          properties: {
            object_ref: { type: 'string' },
            organization_id: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' },
          },
          required: ['object_ref', 'organization_id'],
        },
      },
      {
        name: 'ucr.search',
        description: 'Search for rules',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            organization_id: { type: 'string' },
            tags: { type: 'array' },
            include_deprecated: { type: 'boolean' },
          },
          required: ['query', 'organization_id'],
        },
      },
      {
        name: 'guardrail.validate_payload',
        description: 'Validate rule payload against guardrails',
        inputSchema: {
          type: 'object',
          properties: {
            payload: { type: 'object' },
            organization_id: { type: 'string' },
          },
          required: ['payload', 'organization_id'],
        },
      },
      {
        name: 'ledger.is_period_open',
        description: 'Check if accounting period is open',
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            organization_id: { type: 'string' },
          },
          required: ['date', 'organization_id'],
        },
      },
      {
        name: 'auth.check_scope',
        description: 'Check if user has required permissions',
        inputSchema: {
          type: 'object',
          properties: {
            organization_id: { type: 'string' },
            required_roles: { type: 'array' },
          },
          required: ['organization_id', 'required_roles'],
        },
      },
    ]
  }

  // Tool implementations
  private async listTemplates(params: z.infer<typeof ListTemplatesSchema>) {
    const { industry, module } = params
    
    let templates = UCR_TEMPLATES
    if (industry) {
      templates = templates.filter(t => t.industry === industry)
    }
    if (module) {
      templates = templates.filter(t => t.module === module)
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ templates }, null, 2),
      }],
    }
  }

  private async cloneTemplate(params: z.infer<typeof CloneTemplateSchema>) {
    const { template_id, target_smart_code, organization_id } = params
    
    const template = UCR_TEMPLATES.find(t => t.template_id === template_id)
    if (!template) {
      throw new Error(`Template ${template_id} not found`)
    }

    // Create new rule entity from template
    const ruleId = uuidv4()
    const version = parseInt(target_smart_code.match(/v(\d+)$/)?.[1] || '1')
    
    const rule = {
      id: ruleId,
      organization_id,
      smart_code: target_smart_code,
      title: template.title,
      status: 'draft',
      tags: ['cloned', template.module.toLowerCase()],
      owner: 'system',
      created_by: 'mcp-ucr-orchestrator',
      version,
      schema_version: 1,
      rule_payload: template.rule_payload,
      ai_metadata: {
        ai_confidence: 0.95,
        ai_insights: ['Template-based creation'],
        model_version: 'ucr-mcp-1.0',
      },
    }

    // Store in universal tables
    universalApi.setOrganizationId(organization_id)
    const entity = await universalApi.createEntity({
      entity_type: 'universal_rule',
      entity_name: rule.title,
      entity_code: `RULE-${ruleId}`,
      smart_code: rule.smart_code,
      status: rule.status,
      metadata: {
        rule_version: rule.version,
        schema_version: rule.schema_version,
        tags: rule.tags,
        owner: rule.owner,
      },
    })

    // Store rule payload in dynamic data
    await universalApi.setDynamicField(
      entity.id,
      'rule_payload',
      JSON.stringify(rule.rule_payload)
    )

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ rule_id: entity.id, version: rule.version }, null, 2),
      }],
    }
  }

  private async getRule(params: z.infer<typeof GetRuleSchema>) {
    const { rule_id, smart_code, organization_id } = params
    
    universalApi.setOrganizationId(organization_id)
    
    let entity
    if (rule_id) {
      const response = await universalApi.read('core_entities', rule_id, organization_id)
      entity = response.data?.[0]
    } else if (smart_code) {
      const response = await universalApi.query('core_entities', {
        entity_type: 'universal_rule',
        smart_code,
        organization_id,
      })
      entity = response.data?.[0]
    }

    if (!entity) {
      throw new Error('Rule not found')
    }

    // Get dynamic data
    const dynamicData = await universalApi.getDynamicFields(entity.id)
    const rulePayload = dynamicData.find(d => d.field_name === 'rule_payload')

    const rule = {
      id: entity.id,
      organization_id: entity.organization_id,
      smart_code: entity.smart_code,
      title: entity.entity_name,
      status: entity.status,
      tags: (entity.metadata as any)?.tags || [],
      owner: (entity.metadata as any)?.owner || 'system',
      created_by: entity.created_by,
      version: (entity.metadata as any)?.rule_version || 1,
      schema_version: (entity.metadata as any)?.schema_version || 1,
      rule_payload: rulePayload ? JSON.parse(rulePayload.field_value_text) : {},
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ rule }, null, 2),
      }],
    }
  }

  private async validateRule(params: z.infer<typeof ValidateRuleSchema>) {
    const { draft_rule, organization_id } = params
    
    const errors: string[] = []
    const warnings: string[] = []
    
    // Validate smart code format
    if (!draft_rule.smart_code.match(/^HERA\.[A-Z]+(\.[A-Z0-9]+){2,}\.v[0-9]+$/)) {
      errors.push('Smart code must match pattern: HERA.DOMAIN.MODULE.TYPE.VERSION.v[0-9]+')
    }
    
    // Validate required fields in payload
    if (!draft_rule.rule_payload.description) {
      errors.push('Rule payload must include a description')
    }
    
    // Validate organization match
    if (draft_rule.organization_id !== organization_id) {
      errors.push('Organization ID mismatch')
    }
    
    // Check for version conflicts
    universalApi.setOrganizationId(organization_id)
    const existing = await universalApi.query('core_entities', {
      entity_type: 'universal_rule',
      smart_code: draft_rule.smart_code,
      organization_id,
    })
    
    if (existing.data && existing.data.length > 0) {
      const activeRule = existing.data.find((r: any) => r.status === 'active')
      if (activeRule && (activeRule.metadata as any)?.rule_version >= draft_rule.version) {
        errors.push(`Version ${draft_rule.version} already exists or is lower than current active version`)
      }
    }
    
    // Warnings
    if (!draft_rule.tags || draft_rule.tags.length === 0) {
      warnings.push('Consider adding tags for better searchability')
    }
    
    if (!draft_rule.rule_payload.exceptions || draft_rule.rule_payload.exceptions.length === 0) {
      warnings.push('No exceptions defined - consider VIP/special cases')
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ ok: errors.length === 0, errors, warnings }, null, 2),
      }],
    }
  }

  private async simulateRule(params: z.infer<typeof SimulateRuleSchema>) {
    const { rule_id, draft_rule, scenarios, organization_id } = params
    
    let rule = draft_rule
    if (!rule && rule_id) {
      const ruleResponse = await this.getRule({ rule_id, organization_id })
      rule = JSON.parse(ruleResponse.content[0].text).rule
    }
    
    if (!rule) {
      throw new Error('No rule provided for simulation')
    }
    
    const results = []
    let passed = 0
    let failed = 0
    
    for (const scenario of scenarios) {
      try {
        // Simulate rule execution
        const result = this.executeRuleLogic(rule.rule_payload, scenario.context)
        
        // Compare with expected
        const matches = JSON.stringify(result) === JSON.stringify(scenario.expected)
        
        results.push({
          scenario_id: scenario.scenario_id,
          passed: matches,
          actual: result,
          expected: scenario.expected,
          diff: matches ? null : this.generateDiff(scenario.expected, result),
        })
        
        if (matches) passed++
        else failed++
      } catch (error) {
        results.push({
          scenario_id: scenario.scenario_id,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        failed++
      }
    }
    
    const coverage = (passed / scenarios.length) * 100
    const regressions = failed > 0 ? results.filter(r => !r.passed) : []

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ results, coverage, regressions, passed, failed }, null, 2),
      }],
    }
  }

  private executeRuleLogic(payload: any, context: any): any {
    // Simplified rule execution for demo
    const result: any = {}
    
    // Apply base definitions
    Object.assign(result, payload.definitions || {})
    
    // Apply exceptions
    if (payload.exceptions) {
      for (const exception of payload.exceptions) {
        let conditionsMet = true
        
        // Check all conditions
        for (const [key, value] of Object.entries(exception.if)) {
          if (context[key] !== value && (!context.customer || context.customer[key] !== value)) {
            conditionsMet = false
            break
          }
        }
        
        // Apply exception if conditions met
        if (conditionsMet) {
          Object.assign(result, exception.then)
        }
      }
    }
    
    // Add any calendar effects
    if (payload.calendar_effects) {
      Object.assign(result, payload.calendar_effects)
    }
    
    return result
  }

  private generateDiff(expected: any, actual: any): any {
    const diff: any = {}
    
    // Find differences
    for (const key of Object.keys(expected)) {
      if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
        diff[key] = {
          expected: expected[key],
          actual: actual[key],
        }
      }
    }
    
    // Find unexpected keys
    for (const key of Object.keys(actual)) {
      if (!(key in expected)) {
        diff[key] = {
          expected: undefined,
          actual: actual[key],
        }
      }
    }
    
    return diff
  }

  private async diffRules(params: z.infer<typeof DiffRulesSchema>) {
    const { base_rule_id, new_rule_id } = params
    
    // This would fetch both rules and compare
    // For demo, return a mock diff
    const diff = {
      summary: 'Updated VIP exception handling',
      breaking_changes: [],
      line_diffs: [
        {
          path: 'rule_payload.exceptions[0].then.late_cancel_fee_pct',
          old_value: 25,
          new_value: 0,
        },
      ],
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(diff, null, 2),
      }],
    }
  }

  private async bumpVersion(params: z.infer<typeof BumpVersionSchema>) {
    const { rule_id, change_type, notes } = params
    
    // This would create a new version of the rule
    const newVersion = change_type === 'major' ? 2 : 1.1
    const newRuleId = uuidv4()

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ new_rule_id: newRuleId, smart_code: `HERA.RULE.v${newVersion}` }, null, 2),
      }],
    }
  }

  private async deployRule(params: z.infer<typeof DeployRuleSchema>) {
    const { rule_id, scope, effective_from, effective_to, organization_id, approvals } = params
    
    // Create deployment transaction
    universalApi.setOrganizationId(organization_id)
    const deploymentTxn = await universalApi.createTransaction({
      transaction_type: 'ucr_deployment',
      smart_code: 'HERA.GOV.UCR.DEPLOY.v1',
      reference_number: `deploy-${rule_id}-${Date.now()}`,
      total_amount: 0,
      metadata: {
        rule_id,
        scope,
        effective_from,
        effective_to,
        approvals,
      },
    })

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ deployment_txn_id: deploymentTxn.id }, null, 2),
      }],
    }
  }

  private async scheduleChange(params: z.infer<typeof ScheduleChangeSchema>) {
    const { rule_id, schedule, organization_id } = params
    
    // Create scheduled job
    const jobId = uuidv4()
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ job_id: jobId }, null, 2),
      }],
    }
  }

  private async rollback(params: z.infer<typeof RollbackSchema>) {
    const { rule_id, smart_code, to_version, organization_id } = params
    
    // Create rollback transaction
    const rollbackTxnId = uuidv4()
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ rollback_txn_id: rollbackTxnId }, null, 2),
      }],
    }
  }

  private async auditLog(params: z.infer<typeof AuditLogSchema>) {
    const { object_ref, organization_id, from, to } = params
    
    // Fetch audit events
    universalApi.setOrganizationId(organization_id)
    const events = await universalApi.query('universal_transactions', {
      metadata: { rule_id: object_ref },
      organization_id,
    })
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ events: events.data || [] }, null, 2),
      }],
    }
  }

  private async searchRules(params: z.infer<typeof SearchSchema>) {
    const { query, organization_id, tags, include_deprecated } = params
    
    universalApi.setOrganizationId(organization_id)
    const rules = await universalApi.query('core_entities', {
      entity_type: 'universal_rule',
      organization_id,
    })
    
    // Filter by query and tags
    let filtered = rules.data || []
    if (!include_deprecated) {
      filtered = filtered.filter((r: any) => r.status !== 'deprecated')
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ rules: filtered }, null, 2),
      }],
    }
  }

  private async validatePayload(params: z.infer<typeof ValidatePayloadSchema>) {
    const { payload, organization_id } = params
    
    const errors: string[] = []
    const hints: string[] = []
    
    // Basic payload validation
    if (!payload) {
      errors.push('Payload is required')
    }
    
    // Check for required fields based on rule type
    if (payload && payload.definitions) {
      hints.push('Consider adding VIP exceptions for better customer experience')
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ ok: errors.length === 0, errors, hints }, null, 2),
      }],
    }
  }

  private async isPeriodOpen(params: z.infer<typeof IsPeriodOpenSchema>) {
    const { date, organization_id } = params
    
    // Check if accounting period is open
    // For demo, periods before current month are closed
    const checkDate = parseISO(date)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const isOpen = !isBefore(checkDate, currentMonth)
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ open: isOpen }, null, 2),
      }],
    }
  }

  private async checkScope(params: z.infer<typeof CheckScopeSchema>) {
    const { organization_id, required_roles } = params
    
    // For demo, assume user has UCR_EDITOR role
    const userRoles = ['UCR_EDITOR', 'CONFIG_VIEWER']
    const hasRequiredRoles = required_roles.every(role => userRoles.includes(role))
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ 
          allowed: hasRequiredRoles,
          reason: hasRequiredRoles ? null : 'Missing required roles',
        }, null, 2),
      }],
    }
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('UCR MCP Server running on stdio')
  }

  // Public method to handle tool calls
  async handleToolCall(toolName: string, args: any): Promise<any> {
    const mockRequest = {
      params: {
        name: toolName,
        arguments: args
      }
    }

    try {
      switch (toolName) {
        case 'ucr.list_templates':
          return await this.listTemplates(ListTemplatesSchema.parse(args))
        case 'ucr.clone_template':
          return await this.cloneTemplate(CloneTemplateSchema.parse(args))
        case 'ucr.get_rule':
          return await this.getRule(GetRuleSchema.parse(args))
        case 'ucr.validate_rule':
          return await this.validateRule(ValidateRuleSchema.parse(args))
        case 'ucr.simulate_rule':
          return await this.simulateRule(SimulateRuleSchema.parse(args))
        case 'ucr.diff_rules':
          return await this.diffRules(DiffRulesSchema.parse(args))
        case 'ucr.bump_version':
          return await this.bumpVersion(BumpVersionSchema.parse(args))
        case 'ucr.deploy_rule':
          return await this.deployRule(DeployRuleSchema.parse(args))
        case 'ucr.schedule_change':
          return await this.scheduleChange(ScheduleChangeSchema.parse(args))
        case 'ucr.rollback':
          return await this.rollback(RollbackSchema.parse(args))
        case 'ucr.audit_log':
          return await this.auditLog(AuditLogSchema.parse(args))
        case 'ucr.search':
          return await this.searchRules(SearchSchema.parse(args))
        case 'guardrail.validate_payload':
          return await this.validatePayload(ValidatePayloadSchema.parse(args))
        case 'ledger.is_period_open':
          return await this.isPeriodOpen(IsPeriodOpenSchema.parse(args))
        case 'auth.check_scope':
          return await this.checkScope(CheckScopeSchema.parse(args))
        default:
          throw new Error(`Unknown tool: ${toolName}`)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          content: [{
            type: 'text',
            text: `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          }],
          isError: true,
        }
      }
      throw error
    }
  }
}
*/

// Export for use in the app - temporarily disabled due to missing MCP dependencies
// export const ucrMCPServer = new UCRMCPServer()

// Placeholder export to prevent import errors
export const ucrMCPServer = {
  run: async () => {
    console.warn('UCR MCP Server is temporarily disabled - missing @modelcontextprotocol dependencies')
    return Promise.resolve()
  },
  handleToolCall: async (toolName: string, args: any) => {
    console.warn('UCR MCP Server handleToolCall is temporarily disabled - missing @modelcontextprotocol dependencies')
    return {
      isError: true,
      content: [{
        text: 'MCP server temporarily disabled - missing dependencies'
      }]
    }
  }
}

// CLI entry point
// if (require.main === module) {
//   ucrMCPServer.run().catch(console.error)
// }