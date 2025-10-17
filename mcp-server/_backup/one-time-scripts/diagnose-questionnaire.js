#!/usr/bin/env node

/**
 * Diagnostic script to understand the questionnaire page structure
 */

const { chromium } = require('playwright');

async function diagnoseQuestionnaire() {
  console.log('🔍 Diagnosing HERA Readiness Questionnaire Page\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newContext().then(context => context.newPage());
  
  try {
    console.log('📍 Navigating to questionnaire...');
    await page.goto('http://localhost:3002/readiness-questionnaire', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // Take a screenshot
    await page.screenshot({ path: 'questionnaire-page.png' });
    console.log('📸 Screenshot saved as questionnaire-page.png\n');
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    
    // Check for various elements
    console.log('\n🔎 Checking for common elements:');
    
    const elements = [
      { selector: 'button', name: 'Buttons' },
      { selector: 'h1', name: 'H1 Headers' },
      { selector: 'h2', name: 'H2 Headers' },
      { selector: 'h3', name: 'H3 Headers' },
      { selector: 'p', name: 'Paragraphs' },
      { selector: '[class*="card"]', name: 'Card elements' },
      { selector: '[class*="question"]', name: 'Question elements' },
      { selector: 'input', name: 'Input fields' },
      { selector: 'form', name: 'Forms' },
      { selector: '[class*="wizard"]', name: 'Wizard elements' },
      { selector: '[class*="assessment"]', name: 'Assessment elements' }
    ];
    
    for (const { selector, name } of elements) {
      const count = await page.$$eval(selector, els => els.length);
      if (count > 0) {
        console.log(`   ✅ ${name}: ${count} found`);
        
        // Get first few text contents
        const texts = await page.$$eval(selector, els => 
          els.slice(0, 3).map(el => el.textContent?.trim()).filter(t => t && t.length > 0)
        );
        if (texts.length > 0) {
          texts.forEach(text => {
            if (text && text.length < 100) {
              console.log(`      → "${text}"`);
            }
          });
        }
      }
    }
    
    // Check for specific button texts
    console.log('\n🔘 Checking for action buttons:');
    const buttonTexts = await page.$$eval('button', buttons => 
      buttons.map(btn => btn.textContent?.trim()).filter(text => text)
    );
    
    buttonTexts.forEach(text => {
      console.log(`   → Button: "${text}"`);
    });
    
    // Check page content
    console.log('\n📝 Page text content preview:');
    const bodyText = await page.$eval('body', el => el.innerText);
    const lines = bodyText.split('\n').filter(line => line.trim().length > 0).slice(0, 10);
    lines.forEach(line => {
      console.log(`   ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
    });
    
    // Check for error messages
    const errorElements = await page.$$('[class*="error"], [class*="alert"], [class*="warning"]');
    if (errorElements.length > 0) {
      console.log('\n⚠️  Found potential error/alert elements:');
      for (const el of errorElements) {
        const text = await el.textContent();
        console.log(`   → ${text}`);
      }
    }
    
    console.log('\n⏸️  Keeping browser open for manual inspection...');
    console.log('   Press Ctrl+C to close when done.');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

diagnoseQuestionnaire().catch(console.error);