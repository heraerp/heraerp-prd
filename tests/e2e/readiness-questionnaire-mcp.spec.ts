/**
 * HERA ERP Readiness Questionnaire E2E Tests with MCP Integration
 * Smart Code: HERA.TEST.E2E.READINESS.MCP.PLAYWRIGHT.v1
 * 
 * Uses MCP server to intelligently fill forms and validate responses
 */

import { test, expect, Page } from '@playwright/test'
import { universalApi } from '@/lib/universal-api'

interface MCPFormFillResponse {
  success: boolean
  answers: Array<{
    questionId: string
    questionType: string
    answer: any
    reasoning: string
  }>
  completionTime: number
}

interface QuestionnaireAnswer {
  question_id: string
  response_value: any
  smart_code: string
  sequence: number
}

class MCPQuestionnaireAutomation {
  private page: Page
  private mcpEndpoint = '/api/v1/mcp/tools'
  private organizationId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'demo-org-123'

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Use MCP to intelligently analyze and answer questionnaire questions
   */
  async getIntelligentAnswers(businessContext: {
    businessType: string
    industry: string
    size: string
    goals: string[]
  }): Promise<MCPFormFillResponse> {
    const response = await this.page.request.post(this.mcpEndpoint, {
      data: {
        tool: 'intelligent-form-completion',
        input: {
          formType: 'erp_readiness_questionnaire',
          businessContext,
          organizationId: this.organizationId,
          smart_code: 'HERA.TEST.MCP.FORM.INTELLIGENT.COMPLETION.v1'
        }
      }
    })

    return await response.json()
  }

  /**
   * Fill text input with MCP-generated answer
   */
  async fillTextInput(questionId: string, answer: string, reasoning?: string) {
    const input = this.page.locator(`input[placeholder*="Type your answer"]`)
    await input.fill(answer)
    
    console.log(`✅ Filled text input for ${questionId}: "${answer}"${reasoning ? ` (${reasoning})` : ''}`)
  }

  /**
   * Fill textarea with MCP-generated answer
   */
  async fillTextarea(questionId: string, answer: string, reasoning?: string) {
    const textarea = this.page.locator(`textarea[placeholder*="Share your thoughts"]`)
    await textarea.fill(answer)
    
    console.log(`✅ Filled textarea for ${questionId}: "${answer.substring(0, 100)}..."${reasoning ? ` (${reasoning})` : ''}`)
  }

  /**
   * Select radio button option with MCP intelligence
   */
  async selectRadioOption(questionId: string, optionCode: string, reasoning?: string) {
    // Find the label for the option and click it
    const optionLabel = this.page.locator(`label[for="${optionCode}"]`)
    await optionLabel.click()
    
    console.log(`✅ Selected radio option for ${questionId}: "${optionCode}"${reasoning ? ` (${reasoning})` : ''}`)
  }

  /**
   * Select multiple checkbox options with MCP intelligence
   */
  async selectMultipleOptions(questionId: string, optionCodes: string[], reasoning?: string) {
    for (const optionCode of optionCodes) {
      const optionLabel = this.page.locator(`label[for="${optionCode}"]`)
      await optionLabel.click()
      await this.page.waitForTimeout(200) // Small delay between selections
    }
    
    console.log(`✅ Selected multiple options for ${questionId}: [${optionCodes.join(', ')}]${reasoning ? ` (${reasoning})` : ''}`)
  }

  /**
   * Answer Yes/No question with MCP intelligence
   */
  async answerYesNo(questionId: string, answer: boolean, reasoning?: string) {
    const buttonText = answer ? 'Yes' : 'No'
    const button = this.page.locator(`button:has-text("${buttonText}")`)
    await button.click()
    
    console.log(`✅ Answered Yes/No for ${questionId}: "${buttonText}"${reasoning ? ` (${reasoning})` : ''}`)
  }

  /**
   * Fill number input with MCP-generated value
   */
  async fillNumberInput(questionId: string, value: number, reasoning?: string) {
    const input = this.page.locator(`input[type="number"]`)
    await input.fill(value.toString())
    
    console.log(`✅ Filled number input for ${questionId}: ${value}${reasoning ? ` (${reasoning})` : ''}`)
  }

  /**
   * Navigate to next question with validation
   */
  async proceedToNext() {
    const nextButton = this.page.locator('button:has-text("Next")')
    
    // Wait for validation to complete
    await expect(nextButton).not.toBeDisabled()
    
    await nextButton.click()
    
    // Wait for the next question to load
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(500) // Additional time for smooth scrolling
    
    console.log('📍 Navigated to next question')
  }

  /**
   * Complete the entire questionnaire using MCP intelligence
   */
  async completeQuestionnaire(businessContext: {
    businessType: string
    industry: string
    size: string
    goals: string[]
  }) {
    console.log('🚀 Starting MCP-powered questionnaire completion...')
    
    // Get intelligent answers from MCP
    const mcpResponse = await this.getIntelligentAnswers(businessContext)
    
    if (!mcpResponse.success) {
      throw new Error('Failed to get intelligent answers from MCP')
    }

    console.log(`🧠 MCP generated ${mcpResponse.answers.length} intelligent answers`)

    let questionIndex = 0
    
    while (questionIndex < mcpResponse.answers.length) {
      const answer = mcpResponse.answers[questionIndex]
      
      console.log(`\n📋 Question ${questionIndex + 1}: ${answer.questionId}`)
      console.log(`💭 Reasoning: ${answer.reasoning}`)
      
      // Determine question type and fill accordingly
      switch (answer.questionType) {
        case 'text':
          await this.fillTextInput(answer.questionId, answer.answer, answer.reasoning)
          break
          
        case 'textarea':
          await this.fillTextarea(answer.questionId, answer.answer, answer.reasoning)
          break
          
        case 'select':
          await this.selectRadioOption(answer.questionId, answer.answer, answer.reasoning)
          break
          
        case 'multiselect':
          await this.selectMultipleOptions(answer.questionId, answer.answer, answer.reasoning)
          break
          
        case 'yesno':
          await this.answerYesNo(answer.questionId, answer.answer, answer.reasoning)
          break
          
        case 'number':
          await this.fillNumberInput(answer.questionId, answer.answer, answer.reasoning)
          break
          
        default:
          console.warn(`⚠️ Unknown question type: ${answer.questionType}`)
      }
      
      // Proceed to next question (or complete if last)
      if (questionIndex === mcpResponse.answers.length - 1) {
        // Complete the assessment
        const completeButton = this.page.locator('button:has-text("Complete Assessment")')
        await expect(completeButton).not.toBeDisabled()
        await completeButton.click()
        console.log('🎉 Completed assessment!')
        break
      } else {
        await this.proceedToNext()
        questionIndex++
      }
    }
    
    console.log(`✅ Questionnaire completed in ${mcpResponse.completionTime}ms with MCP intelligence`)
  }
}

test.describe('HERA Readiness Questionnaire - MCP E2E Tests', () => {
  test('should complete questionnaire using MCP intelligence for restaurant business', async ({ page }) => {
    const automation = new MCPQuestionnaireAutomation(page)
    
    // Navigate to questionnaire
    await page.goto('/readiness-questionnaire')
    
    // Wait for page to load
    await expect(page.locator('h1:has-text("ERP Readiness Assessment")')).toBeVisible()
    
    // Start the assessment
    await page.locator('button:has-text("Start Assessment")').click()
    
    // Wait for first question
    await expect(page.locator('[data-testid="question-card"]').first()).toBeVisible()
    
    // Define business context for MCP
    const restaurantContext = {
      businessType: 'restaurant',
      industry: 'hospitality',
      size: 'medium', // 50-200 employees
      goals: [
        'improve_efficiency',
        'better_inventory_control', 
        'financial_visibility',
        'regulatory_compliance'
      ]
    }
    
    // Complete questionnaire using MCP
    await automation.completeQuestionnaire(restaurantContext)
    
    // Verify completion
    await expect(page.locator('h2:has-text("Assessment Complete")')).toBeVisible()
    await expect(page.locator('text=Thank you for completing')).toBeVisible()
  })

  test('should complete questionnaire using MCP intelligence for healthcare business', async ({ page }) => {
    const automation = new MCPQuestionnaireAutomation(page)
    
    await page.goto('/readiness-questionnaire')
    await page.locator('button:has-text("Start Assessment")').click()
    
    const healthcareContext = {
      businessType: 'healthcare',
      industry: 'medical_services',
      size: 'large', // 200+ employees
      goals: [
        'patient_data_management',
        'compliance_tracking',
        'operational_efficiency',
        'cost_reduction'
      ]
    }
    
    await automation.completeQuestionnaire(healthcareContext)
    
    // Verify healthcare-specific insights
    await expect(page.locator('text=patient management')).toBeVisible()
    await expect(page.locator('text=HIPAA compliance')).toBeVisible()
  })

  test('should validate answers are saved to universal API', async ({ page }) => {
    const automation = new MCPQuestionnaireAutomation(page)
    
    await page.goto('/readiness-questionnaire')
    await page.locator('button:has-text("Start Assessment")').click()
    
    // Answer first few questions manually for validation
    const firstAnswer = "Manufacturing and Trading"
    await automation.fillTextInput('cp_001', firstAnswer)
    await automation.proceedToNext()
    
    // Verify answer was saved via API by checking network requests
    const apiCalls = page.locator('[data-testid="api-status"]')
    await expect(apiCalls).toContainText('Answer saved successfully')
  })

  test('should handle validation errors gracefully', async ({ page }) => {
    await page.goto('/readiness-questionnaire')
    await page.locator('button:has-text("Start Assessment")').click()
    
    // Try to proceed without answering required question
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeDisabled()
    
    // Verify validation message
    await expect(page.locator('text=This field is required')).toBeVisible()
  })

  test('should support navigation back and forth', async ({ page }) => {
    const automation = new MCPQuestionnaireAutomation(page)
    
    await page.goto('/readiness-questionnaire')
    await page.locator('button:has-text("Start Assessment")').click()
    
    // Answer first question
    await automation.answerYesNo('sl_001', true, 'Credit limit alerts needed')
    await automation.proceedToNext()
    
    // Answer second question  
    await automation.selectRadioOption('sl_002', 'DIRECT_SALES', 'Direct sales team')
    
    // Go back and verify first answer is preserved
    await page.locator('button:has-text("Previous")').click()
    
    // Verify Yes is still selected
    await expect(page.locator('button:has-text("Yes")').first()).toHaveClass(/scale-105/)
    
    // Navigate forward again
    await automation.proceedToNext()
    
    // Verify second answer is preserved
    await expect(page.locator('label[for="DIRECT_SALES"]')).toHaveClass(/peer-checked/)
  })
})

test.describe('MCP Integration Tests', () => {
  test('should integrate with HERA MCP server for intelligent form completion', async ({ page }) => {
    // Test the MCP endpoint directly
    const mcpResponse = await page.request.post('/api/v1/mcp/tools', {
      data: {
        tool: 'create-entity',
        input: {
          entity_type: 'questionnaire_session',
          entity_name: 'E2E Test Session',
          smart_code: 'HERA.TEST.E2E.QUESTIONNAIRE.SESSION.v1',
          organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
        }
      }
    })
    
    expect(mcpResponse.ok()).toBeTruthy()
    
    const data = await mcpResponse.json()
    expect(data.success).toBeTruthy()
    expect(data.data.entity_id).toBeTruthy()
  })

  test('should use MCP for business intelligence in form completion', async ({ page }) => {
    const businessAnalysis = await page.request.post('/api/v1/mcp/tools', {
      data: {
        tool: 'analyze-business-requirements',
        input: {
          industry: 'manufacturing',
          size: 'enterprise',
          challenges: ['inventory_management', 'cost_control', 'compliance'],
          smart_code: 'HERA.MCP.BUSINESS.ANALYSIS.v1'
        }
      }
    })
    
    expect(businessAnalysis.ok()).toBeTruthy()
    
    const analysis = await businessAnalysis.json()
    expect(analysis.recommendations).toBeTruthy()
    expect(analysis.erp_readiness_score).toBeGreaterThan(0)
  })
})