import {
  AIManagerResponse,
  QueryIntent,
  Organisation,
  Programme,
  Contact,
  Fund,
  Application,
  Agreement,
  Event,
  KPITarget
} from '@/types/civicflow-ai-manager'
import { crmSearchTool } from '../tools/crm-search'
import { kpiAnalyticsTool } from '../tools/kpi-analytics'
import { engagementInsightsTool } from '../tools/engagement-insights'
import { linkedinAnalyticsTool } from '../tools/linkedin-analytics'
import { emailAnalyticsTool } from '../tools/email-analytics'
import { mailchimpTool } from '../tools/mailchimp'
import { financeTool } from '../tools/finance'
import { documentSearchTool } from '../tools/document-search'

export class CivicFlowAIManager {
  private tools = [
    crmSearchTool,
    kpiAnalyticsTool,
    engagementInsightsTool,
    linkedinAnalyticsTool,
    emailAnalyticsTool,
    mailchimpTool,
    financeTool,
    documentSearchTool
  ]

  constructor(
    private userId: string,
    private organizationId: string,
    private permissions: string[]
  ) {}

  async processQuery(query: string): Promise<AIManagerResponse> {
    try {
      // 1. Detect intent from query
      const intent = this.detectIntent(query)

      // 2. Extract entities and parameters
      const context = this.extractContext(query, intent)

      // 3. Execute relevant tools
      const toolResults = await this.executeToolSequence(intent, context)

      // 4. Format response
      return this.formatResponse(toolResults, intent, query)
    } catch (error) {
      return {
        answer: [
          'I encountered an error processing your query. Please try rephrasing or contact support.'
        ],
        metrics: {},
        insights: [],
        recommended_actions: [],
        sources: [],
        confidence: 0.2
      }
    }
  }

  private detectIntent(query: string): QueryIntent {
    const q = query.toLowerCase()

    if (
      q.includes('track') ||
      q.includes('kpi') ||
      q.includes('performance') ||
      q.includes('vs plan')
    ) {
      return 'programme_tracking'
    }
    if (
      q.includes('risk') ||
      q.includes('compliance') ||
      q.includes('variation') ||
      q.includes('underperform')
    ) {
      return 'risk_compliance'
    }
    if (
      q.includes('engagement') ||
      q.includes('linkedin') ||
      q.includes('event') ||
      q.includes('conversion')
    ) {
      return 'engagement_analytics'
    }
    if (
      q.includes('brief') ||
      q.includes('committee') ||
      q.includes('stakeholder') ||
      q.includes('drawdown')
    ) {
      return 'committee_briefing'
    }
    if (q.includes('partner') || q.includes('org') || q.includes('imd') || q.includes('sector')) {
      return 'partner_search'
    }
    if (q.includes('impact') || q.includes('esg') || q.includes('outcome')) {
      return 'impact_reporting'
    }
    if (q.includes('pipeline') || q.includes('application') || q.includes('forecast')) {
      return 'pipeline_analysis'
    }

    return 'general_query'
  }

  private extractContext(query: string, intent: QueryIntent) {
    // Extract time periods
    const timeMatch = query.match(
      /(last|past|previous)?\s*(\d+)?\s*(day|week|month|quarter|year)s?/i
    )

    // Extract programme names
    const programmes = ['Flexible Finance', 'Enterprise Grants', 'Blended Finance']
    const foundProgrammes = programmes.filter(p => query.toLowerCase().includes(p.toLowerCase()))

    // Extract numbers/amounts
    const amounts = query.match(/£?\d+(?:,\d{3})*(?:\.\d{2})?[MmKk]?/g)

    return {
      intent,
      timeRange: timeMatch ? timeMatch[0] : 'current quarter',
      programmes: foundProgrammes,
      amounts,
      query
    }
  }

  private async executeToolSequence(intent: QueryIntent, context: any) {
    const results = []

    switch (intent) {
      case 'programme_tracking':
        // Execute KPI analytics and CRM search
        results.push(
          await kpiAnalyticsTool.execute(
            {
              programme_id: context.programmes?.[0],
              time_range: 'qtd'
            },
            this
          )
        )
        break

      case 'risk_compliance':
        // Search for at-risk partners and variations
        results.push(
          await crmSearchTool.execute(
            {
              entity_type: 'agreement',
              filters: { status: 'active' }
            },
            this
          )
        )
        results.push(
          await kpiAnalyticsTool.execute(
            {
              category: 'financial',
              time_range: 'qtd'
            },
            this
          )
        )
        break

      case 'engagement_analytics':
        // Get engagement insights across channels
        results.push(
          await engagementInsightsTool.execute(
            {
              time_range: '30d'
            },
            this
          )
        )
        results.push(
          await linkedinAnalyticsTool.execute(
            {
              period: '30d'
            },
            this
          )
        )
        break

      case 'committee_briefing':
        // Gather comprehensive data for briefing
        results.push(
          await kpiAnalyticsTool.execute(
            {
              time_range: 'qtd'
            },
            this
          )
        )
        results.push(
          await financeTool.execute(
            {
              report_type: 'drawdown_schedule'
            },
            this
          )
        )
        break

      default:
        // General search
        results.push(
          await crmSearchTool.execute(
            {
              entity_type: 'organisation',
              query: context.query
            },
            this
          )
        )
    }

    return results
  }

  private formatResponse(
    toolResults: any[],
    intent: QueryIntent,
    query: string
  ): AIManagerResponse {
    // Mock response formatting based on intent
    const baseResponse = {
      answer: [],
      metrics: {},
      insights: [],
      recommended_actions: [],
      sources: toolResults.map(r => r.tool_name || 'Unknown'),
      confidence: 0.85,
      query_understanding: {
        intent,
        entities_detected: [],
        time_context: 'Q3 2024'
      }
    }

    switch (intent) {
      case 'programme_tracking':
        return {
          ...baseResponse,
          answer: [
            'Flexible Finance is tracking at 92% of Q3 targets across all KPIs.',
            'Total deployed capital: £4.2M vs £4.5M target (-6.7%).',
            'Partner engagement remains strong with 18 active agreements.'
          ],
          metrics: {
            'Deployed Capital': { actual: '£4.2M', target: '£4.5M', variance: '-6.7%', rag: '🟡' },
            'Active Partners': { actual: 18, target: 20, variance: '-10%', rag: '🟡' },
            'Jobs Created': { actual: 245, target: 200, variance: '+22.5%', rag: '🟢' },
            'IMD 1-3 Reach': { actual: '68%', target: '70%', variance: '-2.9%', rag: '🟡' }
          },
          insights: [
            'Strong job creation offsetting slight capital deployment lag',
            'Consider accelerating pipeline conversion for 2 pending applications'
          ],
          recommended_actions: [
            {
              action: 'Schedule quarterly review with Finance Committee',
              owner: 'Programme Manager',
              eta: '15 Oct 2024',
              priority: 'high'
            }
          ]
        }

      case 'risk_compliance':
        return {
          ...baseResponse,
          answer: [
            '3 partners identified with matched finance below 50% of commitment.',
            '2 variation requests pending approval (timeline extensions).',
            'All partners meeting IMD reach commitments.'
          ],
          metrics: {
            'At-Risk Partners': { count: 3, total: 18, percentage: '16.7%' },
            'Pending Variations': { count: 2, approved_ytd: 5 },
            'Avg Matched Finance': { value: '72%', target: '100%' }
          },
          insights: [
            'Early intervention recommended for matched finance gaps',
            'Timeline variations correlate with supply chain delays'
          ],
          recommended_actions: [
            {
              action: 'Contact 3 at-risk partners to discuss support options',
              owner: 'Relationship Manager',
              eta: '10 Oct 2024',
              priority: 'high'
            },
            {
              action: 'Review and approve pending variations',
              owner: 'Investment Committee',
              eta: '12 Oct 2024',
              priority: 'medium'
            }
          ]
        }

      default:
        return {
          ...baseResponse,
          answer: ['I found relevant information based on your query.'],
          confidence: 0.7
        }
    }
  }
}
