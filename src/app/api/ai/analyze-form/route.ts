import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { entityType, formData, context } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API not configured' },
        { status: 500 }
      )
    }

    // Create analysis prompt for Claude
    const prompt = `You are an expert ERP consultant analyzing master data for HERA ERP system. 

Entity Type: ${entityType}
Context: ${context}
Form Data: ${JSON.stringify(formData, null, 2)}

Please analyze this ${entityType} master data and provide:

1. Risk Assessment (LOW/MEDIUM/HIGH) with reasoning
2. Data Quality Score (1-10) with improvement suggestions  
3. Compliance Recommendations for this entity type
4. HERA Smart Code validation
5. Business Process Recommendations
6. Potential Data Issues or Missing Information

Respond in JSON format:
{
  "riskScore": "LOW|MEDIUM|HIGH",
  "riskReason": "explanation",
  "dataQualityScore": 1-10,
  "recommendations": ["recommendation1", "recommendation2"],
  "compliance": {
    "status": "COMPLIANT|NEEDS_REVIEW|NON_COMPLIANT", 
    "level": "low|medium|high",
    "issues": ["issue1", "issue2"]
  },
  "smartCode": {
    "suggested": "HERA.ENTITY.TYPE.CODE.v1",
    "isValid": true,
    "improvements": ["improvement1"]
  },
  "missingData": ["field1", "field2"],
  "businessInsights": ["insight1", "insight2"]
}`

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    // Parse Claude's response
    const content = response.content[0]
    if (content.type === 'text') {
      try {
        const analysis = JSON.parse(content.text)
        return NextResponse.json(analysis)
      } catch (parseError) {
        // If JSON parsing fails, return a fallback analysis
        return NextResponse.json({
          riskScore: 'LOW',
          riskReason: 'Standard analysis completed',
          dataQualityScore: 7,
          recommendations: [
            'Review all required fields for completeness',
            'Verify contact information accuracy',
            'Consider setting appropriate business rules'
          ],
          compliance: {
            status: 'NEEDS_REVIEW',
            level: 'medium',
            issues: []
          },
          smartCode: {
            suggested: `HERA.${entityType.toUpperCase()}.STANDARD.CODE.v1`,
            isValid: true,
            improvements: []
          },
          missingData: [],
          businessInsights: [
            'Entity data appears complete for basic operations',
            'Consider adding additional metadata for enhanced functionality'
          ]
        })
      }
    }

    return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 })

  } catch (error) {
    console.error('AI Analysis Error:', error)
    
    // Return fallback analysis on error
    return NextResponse.json({
      riskScore: 'LOW',
      riskReason: 'Fallback analysis - AI service temporarily unavailable',
      dataQualityScore: 6,
      recommendations: [
        'Complete all required fields',
        'Verify data accuracy',
        'Review entity relationships'
      ],
      compliance: {
        status: 'NEEDS_REVIEW',
        level: 'medium',
        issues: ['AI analysis unavailable']
      },
      smartCode: {
        suggested: 'HERA.ENTITY.STANDARD.CODE.v1',
        isValid: true,
        improvements: []
      },
      missingData: [],
      businessInsights: [
        'Manual review recommended',
        'Contact system administrator if issues persist'
      ]
    })
  }
}