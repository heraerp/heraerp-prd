#!/usr/bin/env tsx

import { executePlaybook } from '../packages/hera-playbooks/src/core/executor';
import { PRODUCT_PLAYBOOK_V1 } from '../packages/hera-playbooks/src/salon/product.v1';
import { GRADING_JOB_PLAYBOOK_V1 } from '../packages/hera-playbooks/src/jewelry/grading_job.v1';
import { playbookRegistry, resolvePlaybook } from '../packages/hera-playbooks/src/registry';

// Mock adapter for testing
const mockAdapter = {
  setDynamic: (ctx: any, field: any) => {
    console.log(`  📝 SET: ${field.name} = ${field.value}`);
    ctx.out.dynamicFields ??= [];
    ctx.out.dynamicFields.push(field);
  },
  
  link: (ctx: any, rel: any) => {
    console.log(`  🔗 LINK: ${rel.type}`);
    ctx.out.relationships ??= [];
    ctx.out.relationships.push(rel);
  },
  
  persist: async (ctx: any) => {
    console.log(`  💾 PERSIST: ${Object.keys(ctx.out).filter(k => ctx.out[k]?.length > 0 || Object.keys(ctx.out[k] || {}).length > 0).length} changes`);
    
    // Simulate certificate creation
    if (ctx.out.headers?.entity_type === 'CERTIFICATE') {
      ctx.state.createdCertificateId = 'cert_' + Date.now();
      console.log(`     → Created certificate: ${ctx.state.createdCertificateId}`);
    }
  },
  
  audit: (ctx: any, event: string, payload: any) => {
    console.log(`  📋 AUDIT: ${event}`);
  },
  
  tx: async (fn: () => Promise<void>) => {
    console.log(`  🔄 TX: Starting transaction`);
    try {
      await fn();
      console.log(`  ✅ TX: Committed`);
    } catch (e) {
      console.log(`  ❌ TX: Rolled back`);
      throw e;
    }
  },
  
  fetchEntityById: async (id: string, opts: any) => {
    console.log(`  🔍 FETCH: ${id}`);
    return { id, ...opts };
  },
};

async function testSalonProduct() {
  console.log('\n🧪 Testing Salon Product Playbook\n' + '='.repeat(50));
  
  const product = {
    id: 'prod_123',
    entity_type: 'SALON_PRODUCT',
    entity_name: 'Premium Hair Mask',
    dynamic_data: [
      { field_name: 'brand', field_value: 'HERA Pro' },
      { field_name: 'category', field_value: 'hair_treatment' },
      { field_name: 'price_cost', field_value: 35.00 },
      { field_name: 'price_market', field_value: 120.00 },
    ],
  };
  
  const result = await executePlaybook(PRODUCT_PLAYBOOK_V1, product, {
    organizationId: 'org_test',
    actorId: 'user_test',
    actorRole: 'admin',
    adapters: mockAdapter,
  });
  
  console.log(`\n📊 Results: ${result.steps.filter(s => s.status === 'ok').length}/${result.steps.length} steps succeeded`);
  console.log(`   Margin: $${result.state.margin}`);
  console.log(`   Final Price: $${result.state.price}`);
  
  return result.steps.every(s => s.status === 'ok');
}

async function testJewelryGrading() {
  console.log('\n\n🧪 Testing Jewelry Grading Job Playbook\n' + '='.repeat(50));
  
  const gradingJob = {
    id: 'job_456',
    entity_type: 'GRADING_JOB',
    entity_name: '5ct Diamond Grading',
    dynamic_data: [
      { field_name: 'status', field_value: 'GRADED' },
      { field_name: 'certificate_number', field_value: 'GIA-2024-12345' },
    ],
    metadata: {
      issue_certificate: true,
    },
  };
  
  const result = await executePlaybook(GRADING_JOB_PLAYBOOK_V1, gradingJob, {
    organizationId: 'org_test',
    actorId: 'user_test', 
    actorRole: 'grader',
    adapters: mockAdapter,
  });
  
  console.log(`\n📊 Results: ${result.steps.filter(s => s.status === 'ok').length}/${result.steps.length} steps succeeded`);
  console.log(`   Certificate Created: ${result.state.createdCertificateId ? '✅' : '❌'}`);
  
  return result.steps.every(s => s.status === 'ok' || s.status === 'rolled_back');
}

async function testPlaybookResolution() {
  console.log('\n\n🧪 Testing Playbook Resolution\n' + '='.repeat(50));
  
  const testCases = [
    { smartCode: 'HERA.SALON.PRODUCT.ENTITY.ITEM.v1', expected: 'HERA.SALON.PRODUCT.PLAYBOOK.v1' },
    { smartCode: 'HERA.JEWELRY.GRADING.ENTITY.JOB.v1', expected: 'HERA.JEWELRY.GRADING.PLAYBOOK.v1' },
    { smartCode: 'HERA.UNKNOWN.ENTITY.TYPE.v1', expected: undefined },
  ];
  
  let passed = 0;
  for (const test of testCases) {
    const playbook = resolvePlaybook(test.smartCode);
    const result = playbook?.id === test.expected;
    console.log(`  ${result ? '✅' : '❌'} ${test.smartCode} → ${playbook?.id || 'NOT FOUND'}`);
    if (result) passed++;
  }
  
  console.log(`\n📊 Resolution: ${passed}/${testCases.length} tests passed`);
  
  return passed === testCases.length;
}

async function main() {
  console.log('🚀 HERA Playbook Integration Test Suite\n');
  
  console.log(`📚 Registry contains ${Object.keys(playbookRegistry).length} playbooks:`);
  Object.keys(playbookRegistry).forEach(id => {
    console.log(`   - ${id}`);
  });
  
  const results = await Promise.all([
    testSalonProduct(),
    testJewelryGrading(),
    testPlaybookResolution(),
  ]);
  
  const allPassed = results.every(r => r);
  
  console.log('\n' + '='.repeat(60));
  console.log(allPassed ? '\n✅ All integration tests passed!\n' : '\n❌ Some tests failed!\n');
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);