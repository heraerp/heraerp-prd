import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        reply: "I apologize, but the AI assistant is not currently configured. Please contact your administrator for Claude API setup."
      })
    }

    // Build context-aware system prompt
    const systemPrompt = `You are HERA AI Assistant, an expert ERP consultant helping users create and manage master data in the HERA ERP system.

Current Context:
- Entity Type: ${context.entityType}
- Form Data: ${JSON.stringify(context.formData, null, 2)}

Your capabilities:
- Master data validation and best practices
- HERA Smart Code generation and validation
- Risk assessment and compliance checking
- Business process recommendations
- Data quality improvement suggestions

Guidelines:
- Be concise and actionable
- Focus on HERA ERP best practices
- Provide specific, implementable advice
- Reference the current form data when relevant
- Use professional, helpful tone
- If unsure, recommend consulting HERA documentation

User's question: ${message}`

    const messages = [
      { role: 'user' as const, content: systemPrompt }
    ]

    // Add chat history if available
    if (context.chatHistory) {
      context.chatHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })
      })
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 800,
      messages
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return NextResponse.json({ reply: content.text })
    }

    return NextResponse.json({
      reply: "I'm sorry, I encountered an issue processing your request. Please try again."
    })

  } catch (error) {
    console.error('AI Chat Error:', error)
    
    // Provide helpful fallback responses based on common questions
    const { message } = await request.json()
    const lowerMessage = message.toLowerCase()
    
    let fallbackReply = "I apologize, but I'm currently unavailable. Please try again later."
    
    if (lowerMessage.includes('smart code') || lowerMessage.includes('code')) {
      fallbackReply = "HERA Smart Codes follow the pattern: HERA.{MODULE}.{TYPE}.{IDENTIFIER}.v1. For vendors, use: HERA.PROCUREMENT.VENDOR.{CATEGORY}.{CODE}.v1"
    } else if (lowerMessage.includes('validation') || lowerMessage.includes('required')) {
      fallbackReply = "For vendor master data, ensure you complete: Vendor Name, Code, Category, Primary Contact, and Address. These are essential for HERA compliance."
    } else if (lowerMessage.includes('risk') || lowerMessage.includes('compliance')) {
      fallbackReply = "Risk assessment considers: data completeness, business relationships, compliance requirements, and operational impact. Complete all required fields for low risk rating."
    } else if (lowerMessage.includes('best practice') || lowerMessage.includes('recommend')) {
      fallbackReply = "Best practices: Use consistent naming conventions, complete all contact details, verify business credentials, set appropriate payment terms, and maintain audit trails."
    }
    
    return NextResponse.json({ reply: fallbackReply })
  }
}