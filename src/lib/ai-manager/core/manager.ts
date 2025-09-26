// AI Manager Core Implementation
import { AIManagerTools } from '../tools'
import type { AIManagerResponse, QueryIntent } from '@/types/ai-manager'

export class AIManager {
  private tools: AIManagerTools
  private systemPrompt: string

  constructor(userId: string, orgId: string, permissions: string[]) {
    this.tools = new AIManagerTools(userId, orgId, permissions)
    this.systemPrompt = this.getSystemPrompt()
  }

  private getSystemPrompt(): string {
    return `You are the AI Manager for Access's CRM, programmes, and grant system.
Goals: (1) answer questions with verified facts from tools; (2) surface insights (trends, risks, outliers);
(3) recommend 2–3 next actions; (4) respect permissions & data protection.

Rules:
- Prefer structured data from tools over memory. Cite which tool you used (tool name + object).
- Always summarise first, then show key figures, then insights, then recommended actions.
- Timebox: treat "recent" as last 90 days unless user specifies.
- Redact personal data that user is not permitted to see.
- For KPIs include target, actual, variance, trend (↗/→/↘) and RAG.
- For geography, map to IMD deciles where available.
- For engagement, de-duplicate by contact and organisation; highlight net-new stakeholders.
- If confidence < 0.6, state uncertainty and suggest what data is missing.

Output format:
1) Answer (3–6 bullet points)
2) Metrics (small table or bullet list)
3) Insights (anomalies, drivers, correlations)
4) Recommended actions (bulleted, each with owner+ETA if possible)
5) Sources (tool calls used)

Defaults: "recent" = last 90 days; currency = GBP; time zone = Europe/London.`
  }

  async processQuery(query: string): Promise<AIManagerResponse> {
    // Detect intent
    const intent = this.detectIntent(query)
    
    // Execute appropriate tool sequence
    const toolResults = await this.executeToolSequence(intent, query)
    
    // Format response
    return this.formatResponse(toolResults, intent)
  }

  private detectIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('tracking') || lowerQuery.includes('vs plan')) {
      return 'programme_tracking'
    } else if (lowerQuery.includes('risk') || lowerQuery.includes('underperform')) {
      return 'risk_assessment'
    } else if (lowerQuery.includes('linkedin') || lowerQuery.includes('engagement')) {
      return 'engagement_analysis'
    } else if (lowerQuery.includes('committee') || lowerQuery.includes('brief')) {
      return 'committee_briefing'
    } else if (lowerQuery.includes('touchpoint') || lowerQuery.includes('outreach')) {
      return 'outreach_targeting'
    } else if (lowerQuery.includes('drawdown') || lowerQuery.includes('finance')) {
      return 'financial_overview'
    } else if (lowerQuery.includes('impact') || lowerQuery.includes('kpi')) {
      return 'impact_measurement'
    } else {
      return 'stakeholder_mapping'
    }
  }

  private async executeToolSequence(intent: QueryIntent, query: string): Promise<any[]> {
    const results = []
    
    switch (intent) {
      case 'programme_tracking':
        // Example: "How is Flexible Finance tracking vs plan this quarter?"
        results.push(await this.tools.biKPI({ programme_id: 'FF' }))
        results.push(await this.tools.financeDrawdowns({ programme_id: 'FF' }))
        results.push(await this.tools.crmQuery({
          sql: "SELECT fund_id, kpi_name, target, actual, rag FROM kpi_view WHERE programme='FF' AND period=current_qtr"
        }))
        break

      case 'risk_assessment':
        // Example: "Which partners are at risk on matched finance?"
        results.push(await this.tools.crmQuery({
          sql: `SELECT p.name, f.fund_id, f.matched_finance_progress, f.matched_finance_target,
                (f.matched_finance_progress / NULLIF(f.matched_finance_target,0)) AS pct
                FROM fund f JOIN partner p ON p.id=f.partner_id
                WHERE f.status='deploying' 
                AND (f.matched_finance_progress / NULLIF(f.matched_finance_target,0)) < 0.8`
        }))
        break

      case 'engagement_analysis':
        // Example: "Top LinkedIn content engaging foundations last month?"
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        results.push(await this.tools.linkedinPostList({
          since: lastMonth.toISOString().split('T')[0],
          until: new Date().toISOString().split('T')[0]
        }))
        break

      case 'committee_briefing':
        // Example: "Brief me before the Blended Finance Investment Committee"
        results.push(await this.tools.crmQuery({
          sql: `SELECT * FROM agenda_items WHERE committee='IC' AND date >= CURRENT_DATE AND date <= CURRENT_DATE + INTERVAL '14 days'`
        }))
        results.push(await this.tools.graphMailSearch({
          query: 'investment committee',
          after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
        break

      case 'outreach_targeting':
        // Example: "Show orgs in IMD deciles 1–3 with no touchpoints in 90d"
        results.push(await this.tools.crmQuery({
          sql: `SELECT o.* FROM organisations o 
                LEFT JOIN touchpoints t ON t.org_id = o.id 
                WHERE o.imd_decile IN (1,2,3) 
                AND (t.date IS NULL OR t.date < CURRENT_DATE - INTERVAL '90 days')
                GROUP BY o.id`
        }))
        results.push(await this.tools.mailchimpMetrics({}))
        break

      default:
        // Generic query
        results.push(await this.tools.biKPI({}))
    }
    
    return results
  }

  private formatResponse(toolResults: any[], intent: QueryIntent): AIManagerResponse {
    // This would normally use an LLM to format the response
    // For now, return a structured example
    
    const successfulResults = toolResults.filter(r => r.success)
    const sources = successfulResults.map((r, i) => `Tool call ${i + 1}: ${intent}`)
    
    // Example response for programme tracking
    if (intent === 'programme_tracking') {
      const kpis = successfulResults[0]?.data?.kpis || []
      
      return {
        answer: [
          'Flexible Finance is tracking at 85% of quarterly targets overall',
          'Jobs created: 425/500 (85%) - on track for quarter end',
          'IMD 1-3 reach at 52% vs 60% target requires intervention',
          'Matched finance at £1.875M/£2.5M (75%) with strong momentum',
          'Three partners flagged for enhanced support due to low activity'
        ],
        metrics: {
          'Jobs Created': { actual: 425, target: 500, variance: '-15%', rag: '🟡' },
          'IMD 1-3 Reach': { actual: '52%', target: '60%', variance: '-8pp', rag: '🟡' },
          'Matched Finance': { actual: '£1.875M', target: '£2.5M', variance: '-25%', rag: '🟢' },
          'Active Partners': { actual: 28, target: 30, variance: '-2', rag: '🟢' }
        },
        insights: [
          'IMD reach shortfall concentrated in Manchester and Birmingham regions',
          'Top 3 partners account for 45% of job creation - concentration risk',
          'September typically sees 30% increase in matched finance completions'
        ],
        recommended_actions: [
          {
            action: 'Schedule check-ins with 3 underperforming IMD-focused partners',
            owner: 'Programme Manager',
            eta: 'This week'
          },
          {
            action: 'Launch targeted outreach to Birmingham social enterprises',
            owner: 'Partnerships Team',
            eta: 'Next 2 weeks'
          },
          {
            action: 'Prepare matched finance acceleration plan for October IC',
            owner: 'Finance Team',
            eta: 'By month end'
          }
        ],
        sources,
        confidence: 0.85
      }
    }
    
    // Default response
    return {
      answer: ['Query processed successfully'],
      metrics: {},
      insights: [],
      recommended_actions: [],
      sources,
      confidence: 0.7
    }
  }

  // High-value query handlers
  async getQuarterlyOverview(programmeId: string): Promise<AIManagerResponse> {
    return this.processQuery(`Quarterly overview for ${programmeId}: KPIs vs targets, drawdowns vs schedule, top risks, actions.`)
  }

  async getUnderperformingPartners(): Promise<AIManagerResponse> {
    return this.processQuery('Partners underperforming on IMD reach (deciles 1–3) vs commitment.')
  }

  async getCrossPortfolioAnalysis(): Promise<AIManagerResponse> {
    return this.processQuery('Which investees appear across multiple programmes in last 24 months? Show overlaps.')
  }

  async getVariationRequests(): Promise<AIManagerResponse> {
    return this.processQuery('Variations requested in last 60 days and their approval status.')
  }

  async prepareStakeholderBrief(orgName: string): Promise<AIManagerResponse> {
    return this.processQuery(`Prepare stakeholder brief for ${orgName}: last 6 months of meetings, emails, events, LinkedIn engagement, Mailchimp interactions.`)
  }

  // Proactive insights (would be scheduled)
  async generateWeeklyInsights() {
    return {
      drawdownSlippage: await this.processQuery('Show drawdown schedule slippage in next 10 days'),
      matchedFinanceGaps: await this.processQuery('Partners with matched finance below 80% of target'),
      lowEngagement: await this.processQuery('Partners with engagement score below threshold')
    }
  }

  async generateMonthlyInsights() {
    return {
      channelLeaderboard: await this.processQuery('Channel performance: LinkedIn vs Mailchimp engagement rates'),
      imdCoverage: await this.processQuery('IMD coverage heatmap by region'),
      ediTrends: await this.processQuery('EDI snapshot trends across portfolio')
    }
  }
}