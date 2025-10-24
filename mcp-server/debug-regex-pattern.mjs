#!/usr/bin/env node
/**
 * Debug the regex pattern segment by segment
 */

const testCode = 'HERA.SALON.SALE.TXN.v1';

console.log('🔍 Regex Pattern Analysis\n');
console.log('Test code:', testCode);
console.log('');

// Break down the regex
const patterns = {
  'Full pattern': /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/,
  'Starts with HERA': /^HERA/,
  'Industry segment': /^HERA\.[A-Z0-9]{3,15}/,
  'Industry + 3 segments': /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3}/,
  'Industry + 3 segments + version': /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3}\.v[0-9]+$/,
  'Industry + 4 segments + version': /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){4}\.v[0-9]+$/,
};

Object.entries(patterns).forEach(([name, pattern]) => {
  const matches = pattern.test(testCode);
  console.log(`${matches ? '✅' : '❌'} ${name}`);
  console.log(`   Pattern: ${pattern.source}`);
  console.log('');
});

// Now test what the regex ACTUALLY captures
console.log('📊 Breakdown of HERA.SALON.SALE.TXN.v1:');
console.log('   HERA - prefix ✅');
console.log('   SALON - industry segment (5 chars) ✅');
console.log('   SALE - module segment (4 chars) ✅');
console.log('   TXN - type segment (3 chars) ✅');
console.log('   v1 - version ✅');
console.log('');
console.log('The {3,8} means: repeat the segment pattern 3-8 times AFTER the industry');
console.log('Pattern structure: HERA . INDUSTRY {3-15 chars} ( . SEGMENT {2-30 chars} ){3-8 times} . v[0-9]+');
console.log('');
console.log('For HERA.SALON.SALE.TXN.v1:');
console.log('  - HERA = prefix');
console.log('  - SALON = industry (first segment, matched by [A-Z0-9]{3,15})');
console.log('  - SALE, TXN = 2 additional segments (but pattern requires {3,8})');
console.log('  - v1 = version');
console.log('');
console.log('❌ ISSUE: Only 2 segments after industry, but {3,8} requires at least 3!');
