#!/usr/bin/env node

/**
 * HERA DNA Contrast Validation Script
 * Automated AA/AAA compliance checking for CI/CD pipelines
 * Prevents deployment of designs with poor accessibility
 */

// Critical color pairs that MUST pass AA contrast requirements
const CRITICAL_PAIRS = [
  // Primary text combinations
  ['#0A0E14', '#FFFFFF', 'Text on background (light mode)'],
  ['#E8EDF5', '#0B0F17', 'Text on background (dark mode)'],

  // Primary button combinations  
  ['#FFFFFF', '#3B82F6', 'Primary button text (light mode)'],
  ['#0A0E14', '#60A5FA', 'Primary button text (dark mode)'],

  // Secondary button combinations
  ['#0A0E14', '#06B6D4', 'Secondary button text (light mode)'],
  ['#0A0E14', '#22D3EE', 'Secondary button text (dark mode)'],

  // Accent button combinations
  ['#0A0E14', '#10B981', 'Accent button text (light mode)'],
  ['#0A0E14', '#34D399', 'Accent button text (dark mode)'],

  // Status color combinations
  ['#FFFFFF', '#22C55E', 'Success message text (light mode)'],
  ['#FFFFFF', '#4ADE80', 'Success message text (dark mode)'],
  ['#FFFFFF', '#EF4444', 'Error message text (light mode)'],
  ['#FFFFFF', '#F87171', 'Error message text (dark mode)'],
  ['#FFFFFF', '#F59E0B', 'Warning message text (light mode)'],
  ['#FFFFFF', '#FBBF24', 'Warning message text (dark mode)'],

  // Muted text combinations
  ['#64748B', '#FFFFFF', 'Muted text on background (light mode)'],
  ['#94A3B8', '#0B0F17', 'Muted text on background (dark mode)'],

  // Surface combinations
  ['#0A0E14', '#F8FAFC', 'Text on surface (light mode)'],
  ['#E8EDF5', '#111725', 'Text on surface (dark mode)'],

  // Border visibility
  ['#E5E7EB', '#FFFFFF', 'Border on background (light mode)'],
  ['#27303B', '#0B0F17', 'Border on background (dark mode)']
];

/**
 * Convert hex color to sRGB values
 */
function hexToSrgb(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
  
  return [r, g, b].map(c => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
}

/**
 * Calculate relative luminance
 */
function getRelativeLuminance(hex) {
  const [R, G, B] = hexToSrgb(hex);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(foreground, background) {
  const L1 = getRelativeLuminance(foreground);
  const L2 = getRelativeLuminance(background);
  
  const [lighter, darker] = [Math.max(L1, L2), Math.min(L1, L2)];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get grade for contrast ratio
 */
function getContrastGrade(ratio) {
  if (ratio >= 7.0) return { grade: 'AAA', color: '\x1b[32m' }; // Green
  if (ratio >= 4.5) return { grade: 'AA', color: '\x1b[33m' }; // Yellow
  if (ratio >= 3.0) return { grade: 'A', color: '\x1b[36m' }; // Cyan
  return { grade: 'FAIL', color: '\x1b[31m' }; // Red
}

/**
 * Format color display with background
 */
function formatColorDisplay(color) {
  // Simple color representation for terminal
  return color;
}

/**
 * Main validation function
 */
function validateContrast() {
  console.log('\n🧬 HERA DNA Contrast Validation');
  console.log('================================\n');
  
  let totalPairs = 0;
  let passingPairs = 0;
  let failingPairs = 0;
  const results = [];
  
  for (const [foreground, background, label] of CRITICAL_PAIRS) {
    const ratio = calculateContrastRatio(foreground, background);
    const { grade, color } = getContrastGrade(ratio);
    const passes = ratio >= 4.5; // AA standard
    
    totalPairs++;
    if (passes) {
      passingPairs++;
    } else {
      failingPairs++;
    }
    
    const status = passes ? '\x1b[32m✅\x1b[0m' : '\x1b[31m❌\x1b[0m';
    const ratioText = ratio.toFixed(2);
    
    console.log(`${status} ${label}`);
    console.log(`   Ratio: ${color}${ratioText}:1 (${grade})\x1b[0m`);
    console.log(`   Colors: ${formatColorDisplay(foreground)} on ${formatColorDisplay(background)}`);
    console.log('');
    
    results.push({
      label,
      foreground,
      background,
      ratio,
      grade,
      passes
    });
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total pairs: ${totalPairs}`);
  console.log(`   \x1b[32mPassing: ${passingPairs}\x1b[0m`);
  console.log(`   \x1b[31mFailing: ${failingPairs}\x1b[0m`);
  
  if (failingPairs === 0) {
    console.log('\n\x1b[32m🎉 All contrast requirements met!\x1b[0m');
    console.log('\x1b[32m✅ Safe to deploy with excellent accessibility.\x1b[0m\n');
    return true;
  } else {
    console.log(`\n\x1b[31m⚠️  ${failingPairs} pairs need attention\x1b[0m`);
    console.log('\n🔧 Recommended Actions:');
    
    results
      .filter(r => !r.passes)
      .forEach(result => {
        console.log(`   • Fix "${result.label}" - needs ≥4.5:1 contrast ratio`);
        console.log(`     Current: ${result.ratio.toFixed(2)}:1, Required: 4.5:1`);
      });
    
    console.log('\n\x1b[31m❌ Contrast validation failed!\x1b[0m');
    console.log('\x1b[31mFix the failing contrast pairs before deploying.\x1b[0m\n');
    return false;
  }
}

/**
 * Enhanced validation with detailed analysis
 */
function validateWithAnalysis() {
  console.log('\n🔍 Detailed HERA DNA Contrast Analysis');
  console.log('======================================\n');
  
  const validationPassed = validateContrast();
  
  if (!validationPassed) {
    console.log('\n💡 Accessibility Impact:');
    console.log('   • Poor contrast affects 1 in 12 men and 1 in 200 women');
    console.log('   • Low vision users rely on high contrast for readability');
    console.log('   • WCAG AA compliance is legally required in many jurisdictions');
    console.log('   • Good contrast improves usability for ALL users\n');
    
    console.log('🛠️  How to Fix:');
    console.log('   1. Darken light text or lighten dark backgrounds');
    console.log('   2. Use our semantic color tokens (--color-text, --color-bg)');
    console.log('   3. Test with online contrast checkers');
    console.log('   4. Consider users with visual impairments\n');
  }
  
  return validationPassed;
}

/**
 * Run validation for CI/CD
 */
function runValidation() {
  const startTime = Date.now();
  const passed = process.argv.includes('--detailed') 
    ? validateWithAnalysis() 
    : validateContrast();
  
  const duration = Date.now() - startTime;
  console.log(`\n⏱️  Validation completed in ${duration}ms\n`);
  
  if (!passed) {
    process.exit(1);
  }
}

// Export for programmatic use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateContrast,
    validateWithAnalysis,
    calculateContrastRatio,
    CRITICAL_PAIRS
  };
}

// Run if called directly
if (require.main === module) {
  runValidation();
}