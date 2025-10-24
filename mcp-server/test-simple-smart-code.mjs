#!/usr/bin/env node
/**
 * Simple test to isolate smart code validation issue
 */

// Test the actual regex pattern
const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;

const testCodes = [
  'HERA.SALON.SALE.TXN.RETAIL.v1',        // After SALON: 4 segments
  'HERA.FIN.GL.TXN.JOURNAL.v1',          // After FIN: 4 segments
  'HERA.SALON.SALE.TXN.v1',              // After SALON: 3 segments (minimum)
  'HERA.SALON.POS.CART.ACTIVE.v1',       // After SALON: 4 segments
  'HERA.SALON.SALE.v1',                  // After SALON: 2 segments (should fail - too few)
  'HERA.SALON.POS.SALE.TXN.v1',          // After SALON: 4 segments (POS, SALE, TXN)
];

console.log('🧪 Smart Code Regex Test\n');
console.log('Pattern:', pattern.source);
console.log('');

testCodes.forEach(code => {
  const matches = pattern.test(code);
  const segments = code.split('.');
  const nonVersionSegments = segments.slice(1, -1); // Exclude HERA and v1

  console.log(`${matches ? '✅' : '❌'} ${code}`);
  console.log(`   Segments between HERA and version: ${nonVersionSegments.length} (${nonVersionSegments.join(', ')})`);
  console.log('');
});
