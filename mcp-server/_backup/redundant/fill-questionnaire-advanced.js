#!/usr/bin/env node

/**
 * HERA ERP Readiness Questionnaire - Advanced Automation with AI-like responses
 * Provides detailed reasoning for each answer based on best practices
 */

const { chromium } = require('playwright');

// Comprehensive answer logic with detailed explanations
const questionAnalyzer = {
  analyzeQuestion(questionText) {
    const lower = questionText.toLowerCase();
    
    // Strategy & Planning
    if (lower.includes('business strategy') || lower.includes('strategic plan')) {
      return {
        answer: 'yes',
        confidence: 0.85,
        reasoning: 'A well-defined business strategy is fundamental for ERP success. It ensures the ERP system aligns with organizational goals.',
        recommendation: 'Document your strategy clearly before ERP implementation.'
      };
    }
    
    if (lower.includes('kpi') || lower.includes('performance indicator')) {
      return {
        answer: 'partial',
        confidence: 0.75,
        reasoning: 'Most organizations have some KPIs, but they often need refinement for ERP tracking and automation.',
        recommendation: 'Review and standardize KPIs across departments.'
      };
    }
    
    // Process Management
    if (lower.includes('process') && (lower.includes('documented') || lower.includes('document'))) {
      return {
        answer: 'partial',
        confidence: 0.80,
        reasoning: 'Organizations typically have partial documentation. Complete process documentation is rare but essential for ERP.',
        recommendation: 'Prioritize documenting core business processes.'
      };
    }
    
    if (lower.includes('standardized') || lower.includes('standard')) {
      return {
        answer: 'no',
        confidence: 0.70,
        reasoning: 'Process standardization is a common gap. ERP implementation provides an opportunity to standardize.',
        recommendation: 'Use ERP project to drive standardization initiatives.'
      };
    }
    
    // Technology Readiness
    if (lower.includes('integration') || lower.includes('integrate')) {
      return {
        answer: 'partial',
        confidence: 0.85,
        reasoning: 'Most organizations have some integration capabilities but lack comprehensive API strategies.',
        recommendation: 'Assess current integrations and plan for unified architecture.'
      };
    }
    
    if (lower.includes('cloud') || lower.includes('saas')) {
      return {
        answer: 'yes',
        confidence: 0.90,
        reasoning: 'Cloud adoption is essential for modern ERP. It provides scalability and reduces infrastructure burden.',
        recommendation: 'Ensure cloud security and compliance requirements are met.'
      };
    }
    
    if (lower.includes('security') || lower.includes('secure')) {
      return {
        answer: 'yes',
        confidence: 0.95,
        reasoning: 'Security is non-negotiable for ERP systems handling sensitive business data.',
        recommendation: 'Implement multi-layered security approach.'
      };
    }
    
    // Data Management
    if (lower.includes('data quality') || lower.includes('data accuracy')) {
      return {
        answer: 'partial',
        confidence: 0.75,
        reasoning: 'Data quality issues are universal. Most organizations need data cleanup before ERP go-live.',
        recommendation: 'Start data quality initiatives early in the project.'
      };
    }
    
    if (lower.includes('single source') || lower.includes('centralized')) {
      return {
        answer: 'no',
        confidence: 0.80,
        reasoning: 'Data silos are common. ERP provides the opportunity to create a single source of truth.',
        recommendation: 'Plan data migration and consolidation carefully.'
      };
    }
    
    if (lower.includes('real-time') || lower.includes('real time')) {
      return {
        answer: 'no',
        confidence: 0.85,
        reasoning: 'Real-time data access is a key ERP benefit that most organizations currently lack.',
        recommendation: 'Define real-time reporting requirements early.'
      };
    }
    
    // People & Change
    if (lower.includes('trained') || lower.includes('training')) {
      return {
        answer: 'partial',
        confidence: 0.70,
        reasoning: 'Training is always needed. Current system training doesn\'t translate directly to new ERP.',
        recommendation: 'Budget for comprehensive training programs.'
      };
    }
    
    if (lower.includes('change management')) {
      return {
        answer: 'no',
        confidence: 0.90,
        reasoning: 'Formal change management is often lacking but critical for ERP success.',
        recommendation: 'Establish change management team early.'
      };
    }
    
    if (lower.includes('executive') || lower.includes('leadership')) {
      return {
        answer: 'yes',
        confidence: 0.95,
        reasoning: 'Executive support is essential. Without it, ERP projects typically fail.',
        recommendation: 'Ensure ongoing executive engagement throughout project.'
      };
    }
    
    // Financial
    if (lower.includes('budget') || lower.includes('funding')) {
      return {
        answer: 'yes',
        confidence: 0.90,
        reasoning: 'Budget must be secured before starting ERP evaluation.',
        recommendation: 'Include contingency for unexpected costs.'
      };
    }
    
    if (lower.includes('roi') || lower.includes('return on investment')) {
      return {
        answer: 'partial',
        confidence: 0.80,
        reasoning: 'ROI models for ERP are complex. Initial estimates often need refinement.',
        recommendation: 'Focus on both tangible and intangible benefits.'
      };
    }
    
    // Default intelligent response
    return {
      answer: 'partial',
      confidence: 0.60,
      reasoning: 'This area requires detailed assessment specific to your organization.',
      recommendation: 'Conduct thorough evaluation with stakeholders.'
    };
  }
};

async function fillQuestionnaireAdvanced() {
  console.log('🤖 HERA ERP Readiness Assessment - Intelligent Automation\n');
  console.log('━'.repeat(60) + '\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 // Slower for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to questionnaire
    console.log('📍 Navigating to HERA Readiness Questionnaire...');
    await page.goto('http://localhost:3002/readiness-questionnaire', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // Start assessment if needed
    const startButton = await page.$('button:has-text("Start Assessment"), button:has-text("Begin Assessment")');
    if (startButton) {
      console.log('🚀 Initiating new readiness assessment...\n');
      await startButton.click();
      await page.waitForTimeout(1500);
    }
    
    let questionNumber = 0;
    let totalScore = 0;
    const categoryScores = {};
    
    // Main questionnaire loop
    while (true) {
      try {
        // Wait for question
        await page.waitForSelector('[class*="question"], p:has-text("?"), h3:has-text("?"), div:has-text("?")', {
          timeout: 5000
        });
        
        // Extract question text
        const questionElement = await page.$('[class*="question"], p:has-text("?"), h3:has-text("?"), div:has-text("?")');
        const questionText = await questionElement.textContent();
        
        if (!questionText || questionText.length < 10) continue;
        
        questionNumber++;
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`📋 Question ${questionNumber}:`);
        console.log(`   "${questionText.trim()}"\n`);
        
        // Analyze question
        const analysis = questionAnalyzer.analyzeQuestion(questionText);
        
        console.log(`🤔 Analysis:`);
        console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
        console.log(`   Answer: ${analysis.answer.toUpperCase()}`);
        console.log(`   Reasoning: ${analysis.reasoning}`);
        console.log(`   💡 Tip: ${analysis.recommendation}\n`);
        
        // Find and click answer button
        let answered = false;
        
        // Try multiple selectors
        const selectors = [
          `button:has-text("${analysis.answer.charAt(0).toUpperCase() + analysis.answer.slice(1)}")`,
          `button[aria-label*="${analysis.answer}"]`,
          `div[role="button"]:has-text("${analysis.answer}")`,
          `input[value="${analysis.answer}"] + label`
        ];
        
        for (const selector of selectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              answered = true;
              console.log(`   ✅ Selected: ${analysis.answer.toUpperCase()}`);
              
              // Track score
              const score = analysis.answer === 'yes' ? 100 : analysis.answer === 'partial' ? 50 : 0;
              totalScore += score;
              
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
        
        if (!answered) {
          // Fallback: click any button with the answer text
          const buttons = await page.$$('button, [role="button"]');
          for (const button of buttons) {
            const text = await button.textContent();
            if (text && text.toLowerCase().includes(analysis.answer)) {
              await button.click();
              answered = true;
              console.log(`   ✅ Selected: ${analysis.answer.toUpperCase()} (fallback method)`);
              break;
            }
          }
        }
        
        // Wait for next question
        await page.waitForTimeout(1000);
        
        // Check for completion
        const completed = await page.$('text=/complete|finished|thank you|results|score/i');
        if (completed) {
          console.log('\n' + '═'.repeat(60));
          console.log('🎉 Assessment Completed Successfully!');
          console.log('═'.repeat(60) + '\n');
          
          // Try to extract final score
          const scoreElement = await page.$('text=/%/');
          if (scoreElement) {
            const scoreText = await scoreElement.textContent();
            console.log(`📊 Final Readiness Score: ${scoreText}`);
          } else {
            const avgScore = Math.round(totalScore / questionNumber);
            console.log(`📊 Calculated Average Score: ${avgScore}%`);
          }
          
          console.log(`📝 Total Questions Answered: ${questionNumber}`);
          console.log('\n💡 Next Steps:');
          console.log('   1. Review detailed results in the dashboard');
          console.log('   2. Focus on areas marked as "No" or "Partial"');
          console.log('   3. Create action plan for improvement areas');
          console.log('   4. Schedule follow-up assessment in 3-6 months\n');
          
          break;
        }
        
      } catch (error) {
        // Check if we're at a results page
        const isComplete = await page.$('text=/results|score|complete/i');
        if (isComplete) {
          console.log('\n✅ Assessment flow completed');
          break;
        }
        
        console.log(`\n⚠️  Navigation issue: ${error.message}`);
        console.log('   Attempting to continue...');
        
        // Try to click next/continue
        const nextButton = await page.$('button:has-text("Next"), button:has-text("Continue")');
        if (nextButton) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        } else {
          break;
        }
      }
    }
    
    console.log('\n🔍 Viewing results page for 15 seconds...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('\n❌ Critical error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Automation session completed');
    console.log('📊 Check the Readiness Dashboard for detailed results\n');
  }
}

// Execute
if (require.main === module) {
  fillQuestionnaireAdvanced()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}