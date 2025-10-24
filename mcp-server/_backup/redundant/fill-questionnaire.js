#!/usr/bin/env node

/**
 * HERA ERP Readiness Questionnaire Automation
 * Uses Playwright to intelligently fill out the questionnaire
 */

const { chromium } = require('playwright');

// Intelligent answer mapping based on question patterns
const intelligentAnswers = {
  // Strategy questions
  'defined business strategy': { answer: 'yes', reasoning: 'Essential for ERP success' },
  'clear vision': { answer: 'yes', reasoning: 'Required for organizational alignment' },
  'kpis': { answer: 'partial', reasoning: 'May need refinement for ERP tracking' },
  'strategic goals': { answer: 'yes', reasoning: 'Critical for measuring ERP ROI' },
  
  // Process questions
  'documented': { answer: 'partial', reasoning: 'Most orgs have partial documentation' },
  'standardized': { answer: 'no', reasoning: 'Common challenge before ERP' },
  'optimized': { answer: 'no', reasoning: 'ERP helps optimize processes' },
  'automated': { answer: 'partial', reasoning: 'Some automation likely exists' },
  
  // Technology questions
  'integration': { answer: 'partial', reasoning: 'Usually have some integrations' },
  'cloud': { answer: 'yes', reasoning: 'Modern approach recommended' },
  'security': { answer: 'yes', reasoning: 'Critical requirement' },
  'scalable': { answer: 'partial', reasoning: 'Growth considerations needed' },
  
  // Data questions
  'data quality': { answer: 'partial', reasoning: 'Common area for improvement' },
  'single source': { answer: 'no', reasoning: 'ERP provides this benefit' },
  'real-time': { answer: 'no', reasoning: 'Key ERP advantage' },
  'analytics': { answer: 'partial', reasoning: 'Basic reporting usually exists' },
  
  // People questions
  'trained': { answer: 'partial', reasoning: 'Training always needed' },
  'change management': { answer: 'no', reasoning: 'Critical success factor' },
  'executive support': { answer: 'yes', reasoning: 'Essential for ERP success' },
  'user adoption': { answer: 'partial', reasoning: 'Ongoing challenge' },
  
  // Financial questions
  'budget': { answer: 'yes', reasoning: 'Must have budget allocated' },
  'roi': { answer: 'partial', reasoning: 'ROI models being developed' },
  'cost control': { answer: 'partial', reasoning: 'ERP improves visibility' },
  
  // Default for unmatched questions
  'default': { answer: 'partial', reasoning: 'Requires assessment' }
};

// Function to determine best answer based on question text
function getIntelligentAnswer(questionText) {
  const lowerQuestion = questionText.toLowerCase();
  
  // Find the best matching pattern
  for (const [pattern, answerData] of Object.entries(intelligentAnswers)) {
    if (pattern !== 'default' && lowerQuestion.includes(pattern)) {
      console.log(`  📊 Matched pattern: "${pattern}"`);
      console.log(`  💡 Reasoning: ${answerData.reasoning}`);
      return answerData;
    }
  }
  
  // Default answer if no pattern matches
  console.log(`  📊 Using default answer`);
  return intelligentAnswers.default;
}

async function fillQuestionnaire() {
  console.log('🚀 Starting HERA Readiness Questionnaire Automation\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 500 // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to questionnaire
    console.log('📍 Navigating to questionnaire...');
    await page.goto('http://localhost:3002/readiness-questionnaire', {
      waitUntil: 'networkidle'
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we need to start the questionnaire
    const startButton = await page.$('button:has-text("Start Assessment")');
    if (startButton) {
      console.log('🏁 Starting new assessment...\n');
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Process questions
    let questionCount = 0;
    let continueProcessing = true;
    
    while (continueProcessing) {
      try {
        // Wait for question to be visible
        await page.waitForSelector('.question-text, p:has-text("?"), h3:has-text("?")', {
          timeout: 5000
        });
        
        // Get the question text
        const questionElement = await page.$('.question-text, p:has-text("?"), h3:has-text("?")');
        const questionText = await questionElement.textContent();
        
        questionCount++;
        console.log(`\n❓ Question ${questionCount}: ${questionText}`);
        
        // Get intelligent answer
        const answerData = getIntelligentAnswer(questionText);
        console.log(`  ✅ Answer: ${answerData.answer.toUpperCase()}`);
        
        // Click the appropriate answer button
        const answerButton = await page.$(`button:has-text("${answerData.answer.charAt(0).toUpperCase() + answerData.answer.slice(1)}")`);
        
        if (answerButton) {
          await answerButton.click();
          console.log(`  ✔️  Selected answer`);
          
          // Wait for next question or completion
          await page.waitForTimeout(1000);
          
          // Check if we're done
          const completionMessage = await page.$('text=/Questionnaire Complete|Assessment Complete|All questions answered/i');
          if (completionMessage) {
            console.log('\n🎉 Questionnaire completed!');
            continueProcessing = false;
          }
        } else {
          console.log('  ⚠️  Could not find answer button, trying alternative selectors...');
          
          // Try alternative button selectors
          const buttons = await page.$$('button');
          for (const button of buttons) {
            const text = await button.textContent();
            if (text.toLowerCase().includes(answerData.answer)) {
              await button.click();
              console.log(`  ✔️  Selected answer (alternative method)`);
              break;
            }
          }
          
          await page.waitForTimeout(1000);
        }
        
      } catch (error) {
        // Check if we've reached the end
        const isDone = await page.$('text=/Thank you|Completed|Results|Score/i');
        if (isDone) {
          console.log('\n🎉 Assessment completed successfully!');
          continueProcessing = false;
        } else {
          console.log('\n⚠️  No more questions found or error occurred:', error.message);
          continueProcessing = false;
        }
      }
    }
    
    // Check final results
    const scoreElement = await page.$('text=/%|Score/');
    if (scoreElement) {
      const scoreText = await scoreElement.textContent();
      console.log(`\n📊 Final Score: ${scoreText}`);
    }
    
    // Wait to see results
    console.log('\n⏸️  Keeping browser open for 10 seconds to view results...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error during questionnaire automation:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Automation complete!');
  }
}

// Run the automation
fillQuestionnaire().catch(console.error);