#!/usr/bin/env node

/**
 * HERA ERP Readiness Questionnaire - Production Testing
 * Tests against the live production site at https://heraerp.com
 */

const { chromium } = require('playwright');

// Use the same intelligent answer logic
const questionAnalyzer = {
  analyzeQuestion(questionText) {
    const lower = questionText.toLowerCase();
    
    // Strategy & Planning
    if (lower.includes('business strategy') || lower.includes('strategic plan')) {
      return {
        answer: 'yes',
        confidence: 0.85,
        reasoning: 'A well-defined business strategy is fundamental for ERP success.',
        recommendation: 'Document your strategy clearly before ERP implementation.'
      };
    }
    
    if (lower.includes('kpi') || lower.includes('performance indicator')) {
      return {
        answer: 'partial',
        confidence: 0.75,
        reasoning: 'Most organizations have some KPIs, but they often need refinement.',
        recommendation: 'Review and standardize KPIs across departments.'
      };
    }
    
    // Process Management
    if (lower.includes('process') && (lower.includes('documented') || lower.includes('document'))) {
      return {
        answer: 'partial',
        confidence: 0.80,
        reasoning: 'Organizations typically have partial documentation.',
        recommendation: 'Prioritize documenting core business processes.'
      };
    }
    
    if (lower.includes('standardized') || lower.includes('standard')) {
      return {
        answer: 'no',
        confidence: 0.70,
        reasoning: 'Process standardization is a common gap.',
        recommendation: 'Use ERP project to drive standardization initiatives.'
      };
    }
    
    // Technology Readiness
    if (lower.includes('cloud') || lower.includes('saas')) {
      return {
        answer: 'yes',
        confidence: 0.90,
        reasoning: 'Cloud adoption is essential for modern ERP.',
        recommendation: 'Ensure cloud security and compliance requirements are met.'
      };
    }
    
    if (lower.includes('security') || lower.includes('secure')) {
      return {
        answer: 'yes',
        confidence: 0.95,
        reasoning: 'Security is non-negotiable for ERP systems.',
        recommendation: 'Implement multi-layered security approach.'
      };
    }
    
    // People & Change
    if (lower.includes('change management')) {
      return {
        answer: 'no',
        confidence: 0.90,
        reasoning: 'Formal change management is often lacking but critical.',
        recommendation: 'Establish change management team early.'
      };
    }
    
    if (lower.includes('executive') || lower.includes('leadership')) {
      return {
        answer: 'yes',
        confidence: 0.95,
        reasoning: 'Executive support is essential for ERP success.',
        recommendation: 'Ensure ongoing executive engagement throughout project.'
      };
    }
    
    // Default
    return {
      answer: 'partial',
      confidence: 0.60,
      reasoning: 'This area requires detailed assessment.',
      recommendation: 'Conduct thorough evaluation with stakeholders.'
    };
  }
};

async function fillQuestionnaireProduction() {
  console.log('🌐 HERA ERP Readiness Assessment - Production Testing\n');
  console.log('🔗 Testing against: https://heraerp.com/readiness-questionnaire\n');
  console.log('━'.repeat(60) + '\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    // Set user agent to avoid bot detection
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to production questionnaire
    console.log('📍 Navigating to HERA Production Questionnaire...');
    await page.goto('https://heraerp.com/readiness-questionnaire', {
      waitUntil: 'networkidle',
      timeout: 30000 // 30 second timeout for production
    });
    
    console.log('✅ Page loaded successfully\n');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'production-questionnaire-initial.png' });
    console.log('📸 Initial screenshot saved\n');
    
    // Start assessment if needed
    const startSelectors = [
      'button:has-text("Start Assessment")',
      'button:has-text("Begin Assessment")',
      'button:has-text("Get Started")',
      'button:has-text("Start")',
      'a:has-text("Start Assessment")'
    ];
    
    let started = false;
    for (const selector of startSelectors) {
      const startButton = await page.$(selector);
      if (startButton) {
        console.log('🚀 Found start button, initiating assessment...\n');
        await startButton.click();
        started = true;
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    if (!started) {
      console.log('ℹ️  No start button found, checking if questionnaire is already active...\n');
    }
    
    let questionNumber = 0;
    let totalScore = 0;
    
    // Main questionnaire loop
    while (true) {
      try {
        // Multiple selectors for questions
        const questionSelectors = [
          '[class*="question"]',
          'h2:has-text("?")',
          'h3:has-text("?")',
          'p:has-text("?")',
          'div[role="heading"]:has-text("?")',
          '.card-body:has-text("?")'
        ];
        
        let questionElement = null;
        let questionText = '';
        
        for (const selector of questionSelectors) {
          questionElement = await page.$(selector);
          if (questionElement) {
            questionText = await questionElement.textContent();
            if (questionText && questionText.includes('?')) {
              break;
            }
          }
        }
        
        if (!questionText || questionText.length < 10) {
          console.log('🔍 No question found, checking for completion...');
          break;
        }
        
        questionNumber++;
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`📋 Question ${questionNumber}:`);
        console.log(`   "${questionText.trim()}"\n`);
        
        // Analyze question
        const analysis = questionAnalyzer.analyzeQuestion(questionText);
        
        console.log(`🤔 Analysis:`);
        console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
        console.log(`   Answer: ${analysis.answer.toUpperCase()}`);
        console.log(`   Reasoning: ${analysis.reasoning}\n`);
        
        // Find answer buttons with multiple strategies
        let answered = false;
        
        // Strategy 1: Direct button text match
        const buttonSelectors = [
          `button:has-text("${analysis.answer}")`,
          `button:has-text("${analysis.answer.charAt(0).toUpperCase() + analysis.answer.slice(1)}")`,
          `button:has-text("${analysis.answer.toUpperCase()}")`,
          `input[value="${analysis.answer}"] + label`,
          `label:has-text("${analysis.answer}")`,
          `div[role="button"]:has-text("${analysis.answer}")`
        ];
        
        for (const selector of buttonSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              answered = true;
              console.log(`   ✅ Selected: ${analysis.answer.toUpperCase()}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Strategy 2: Find all buttons and match text
        if (!answered) {
          const buttons = await page.$$('button, [role="button"], label');
          for (const button of buttons) {
            const text = await button.textContent();
            if (text && text.toLowerCase().trim() === analysis.answer.toLowerCase()) {
              await button.click();
              answered = true;
              console.log(`   ✅ Selected: ${analysis.answer.toUpperCase()} (text match)`);
              break;
            }
          }
        }
        
        if (!answered) {
          console.log(`   ⚠️  Could not find answer button for "${analysis.answer}"`);
          console.log(`   📸 Taking debug screenshot...`);
          await page.screenshot({ path: `production-question-${questionNumber}-debug.png` });
        }
        
        // Track score
        const score = analysis.answer === 'yes' ? 100 : analysis.answer === 'partial' ? 50 : 0;
        totalScore += score;
        
        // Wait for next question
        await page.waitForTimeout(1500);
        
        // Check for completion indicators
        const completionSelectors = [
          'text=/complete/i',
          'text=/finished/i',
          'text=/thank you/i',
          'text=/results/i',
          'text=/score/i',
          'h1:has-text("Results")',
          'h2:has-text("Complete")'
        ];
        
        for (const selector of completionSelectors) {
          const completed = await page.$(selector);
          if (completed) {
            console.log('\n' + '═'.repeat(60));
            console.log('🎉 Assessment Completed Successfully!');
            console.log('═'.repeat(60) + '\n');
            
            // Take final screenshot
            await page.screenshot({ path: 'production-questionnaire-complete.png' });
            console.log('📸 Final screenshot saved\n');
            
            // Look for score
            const scoreElement = await page.$('text=/%/');
            if (scoreElement) {
              const scoreText = await scoreElement.textContent();
              console.log(`📊 Final Readiness Score: ${scoreText}`);
            } else {
              const avgScore = Math.round(totalScore / questionNumber);
              console.log(`📊 Calculated Average Score: ${avgScore}%`);
            }
            
            console.log(`📝 Total Questions Answered: ${questionNumber}`);
            
            await page.waitForTimeout(5000);
            await browser.close();
            return;
          }
        }
        
      } catch (error) {
        console.log(`\n⚠️  Error during question processing: ${error.message}`);
        
        // Try to find a next/continue button
        const nextButton = await page.$('button:has-text("Next"), button:has-text("Continue")');
        if (nextButton) {
          console.log('   Found navigation button, clicking...');
          await nextButton.click();
          await page.waitForTimeout(1000);
        } else {
          // Take debug screenshot
          await page.screenshot({ path: 'production-error-state.png' });
          console.log('   📸 Error state screenshot saved');
          break;
        }
      }
    }
    
    console.log('\n🔍 Final page inspection...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ Critical error:', error.message);
    await page.screenshot({ path: 'production-critical-error.png' });
    console.log('📸 Error screenshot saved');
  } finally {
    await browser.close();
    console.log('\n✅ Production testing completed');
  }
}

// Execute
if (require.main === module) {
  fillQuestionnaireProduction()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}