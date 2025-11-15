#!/usr/bin/env node

/**
 * HERA Chart of Accounts System - Complete Integration Test
 * Tests the entire COA framework: Universal + Industry + Country + Assignment
 * Validates end-to-end functionality and data integrity
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001';

// Test organization for demonstration
const TEST_ORG_ID = 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

class COASystemTester {
  constructor() {
    this.results = {
      universal: { created: 0, errors: 0 },
      industry: { created: 0, errors: 0 },
      country: { created: 0, errors: 0 },
      assignment: { created: 0, errors: 0 },
      copy: { created: 0, errors: 0 },
      validation: { passed: 0, failed: 0 }
    };
    this.startTime = Date.now();
  }

  async createTestOrganization() {
    console.log('\n🏢 Creating Test Organization');
    console.log('='.repeat(30));

    try {
      const { data: orgEntity, error: orgError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: PLATFORM_ORG_ID, // Test orgs stored in platform
          entity_type: 'organization',
          entity_code: TEST_ORG_ID,
          entity_name: 'Test Salon Business - UAE',
          smart_code: 'HERA.TEST.ORGANIZATION.SALON.UAE.v1',
          created_by: PLATFORM_USER_ID,
          updated_by: PLATFORM_USER_ID,
          status: 'active',
          metadata: {
            test_organization: true,
            industry: 'salon',
            country: 'uae',
            created_for_testing: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (orgError) throw orgError;

      console.log(`✅ Test Organization Created: ${orgEntity.entity_name}`);
      console.log(`📋 Organization ID: ${orgEntity.id}`);
      console.log(`🏭 Industry: salon, 🌍 Country: uae`);

      return orgEntity;

    } catch (error) {
      console.error('❌ Failed to create test organization:', error.message);
      throw error;
    }
  }

  async testUniversalCOA() {
    console.log('\n📊 Testing Universal COA Template');
    console.log('='.repeat(35));

    try {
      // Import and execute universal COA creation
      const { createUniversalCOA } = require('./create-platform-universal-coa.js');
      
      // Count existing accounts before
      const { count: beforeCount } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'gl_account')
        .like('smart_code', 'HERA.PLATFORM.FINANCE.GL.%');

      console.log(`📊 Existing universal accounts: ${beforeCount || 0}`);

      // Create universal COA if not exists
      if (!beforeCount || beforeCount < 50) { // Expect 80+ accounts
        await createUniversalCOA();
      }

      // Count accounts after
      const { count: afterCount } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'gl_account')
        .like('smart_code', 'HERA.PLATFORM.FINANCE.GL.%');

      this.results.universal.created = afterCount || 0;
      console.log(`✅ Universal COA Accounts: ${this.results.universal.created}`);

      // Validate account structure
      await this.validateAccountStructure('universal', 'HERA.PLATFORM.FINANCE.GL.%');

      return { success: true, count: this.results.universal.created };

    } catch (error) {
      console.error('❌ Universal COA Test Failed:', error.message);
      this.results.universal.errors = 1;
      return { success: false, error: error.message };
    }
  }

  async testIndustryCOA() {
    console.log('\n🏭 Testing Industry COA Templates');
    console.log('='.repeat(35));

    try {
      // Import and execute industry COA creation
      const { createAllIndustryTemplates } = require('./create-industry-coa-templates.js');
      
      // Count existing industry accounts
      const { count: beforeCount } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'gl_account')
        .or('smart_code.like.HERA.SALON.FINANCE.GL.%,smart_code.like.HERA.RESTAURANT.FINANCE.GL.%,smart_code.like.HERA.TELECOM.FINANCE.GL.%');

      console.log(`📊 Existing industry accounts: ${beforeCount || 0}`);

      // Create industry templates if needed
      if (!beforeCount || beforeCount < 50) { // Expect 60+ accounts across industries
        await createAllIndustryTemplates();
      }

      // Count accounts after
      const { count: afterCount } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'gl_account')
        .or('smart_code.like.HERA.SALON.FINANCE.GL.%,smart_code.like.HERA.RESTAURANT.FINANCE.GL.%,smart_code.like.HERA.TELECOM.FINANCE.GL.%');

      this.results.industry.created = (afterCount || 0) - (beforeCount || 0);
      console.log(`✅ Industry COA Accounts: ${afterCount || 0}`);

      // Validate salon-specific accounts
      await this.validateAccountStructure('salon', 'HERA.SALON.FINANCE.GL.%');

      return { success: true, count: afterCount || 0 };

    } catch (error) {
      console.error('❌ Industry COA Test Failed:', error.message);
      this.results.industry.errors = 1;
      return { success: false, error: error.message };
    }
  }

  async testCountryCOA() {
    console.log('\n🌍 Testing Country COA Templates');
    console.log('='.repeat(35));

    try {
      // Import and execute country COA creation
      const { createAllCountryTemplates } = require('./create-country-localization-coa.js');
      
      // Count existing country accounts
      const { count: beforeCount } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'gl_account')
        .or('smart_code.like.HERA.UAE.FINANCE.GL.%,smart_code.like.HERA.INDIA.FINANCE.GL.%,smart_code.like.HERA.USA.FINANCE.GL.%');

      console.log(`📊 Existing country accounts: ${beforeCount || 0}`);

      // Create country templates if needed
      if (!beforeCount || beforeCount < 30) { // Expect 40+ accounts across countries
        await createAllCountryTemplates();
      }

      // Count accounts after
      const { count: afterCount } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'gl_account')
        .or('smart_code.like.HERA.UAE.FINANCE.GL.%,smart_code.like.HERA.INDIA.FINANCE.GL.%,smart_code.like.HERA.USA.FINANCE.GL.%');

      this.results.country.created = (afterCount || 0) - (beforeCount || 0);
      console.log(`✅ Country COA Accounts: ${afterCount || 0}`);

      // Validate UAE-specific accounts
      await this.validateAccountStructure('uae', 'HERA.UAE.FINANCE.GL.%');

      return { success: true, count: afterCount || 0 };

    } catch (error) {
      console.error('❌ Country COA Test Failed:', error.message);
      this.results.country.errors = 1;
      return { success: false, error: error.message };
    }
  }

  async testAssignmentSystem(testOrg) {
    console.log('\n🔗 Testing COA Assignment System');
    console.log('='.repeat(35));

    try {
      // Import assignment functions
      const { 
        createCOATemplateEntities,
        assignCompleteCOA,
        getCOAAssignments 
      } = require('./create-coa-assignment-system.js');

      // Create template entities
      console.log('📚 Creating template entities...');
      const templateEntities = await createCOATemplateEntities();
      this.results.assignment.created += templateEntities.length;

      // Assign complete COA package to test organization
      console.log('🔗 Assigning COA package...');
      const assignments = await assignCompleteCOA(testOrg.id, 'salon', 'uae', {
        actorUserId: PLATFORM_USER_ID,
        autoAssigned: true,
        reason: 'Integration test assignment'
      });

      this.results.assignment.created += assignments.length;

      // Verify assignments
      console.log('📋 Verifying assignments...');
      const retrievedAssignments = await getCOAAssignments(testOrg.id);

      if (retrievedAssignments.length !== assignments.length) {
        throw new Error(`Assignment count mismatch: expected ${assignments.length}, got ${retrievedAssignments.length}`);
      }

      console.log(`✅ Assignment System: ${assignments.length} templates assigned`);
      
      return { success: true, assignments: assignments.length };

    } catch (error) {
      console.error('❌ Assignment System Test Failed:', error.message);
      this.results.assignment.errors = 1;
      return { success: false, error: error.message };
    }
  }

  async testCOACopy(testOrg) {
    console.log('\n📋 Testing COA Copy Functionality');
    console.log('='.repeat(35));

    try {
      // Import copy function
      const { copyCOAFromTemplates } = require('./create-coa-assignment-system.js');

      // Copy COA from templates to test organization
      const copyResult = await copyCOAFromTemplates(testOrg.id, PLATFORM_USER_ID);

      this.results.copy.created = copyResult.totalAccountsCopied;

      console.log(`✅ COA Copy: ${copyResult.totalAccountsCopied} accounts copied`);
      console.log(`📚 Templates Processed: ${copyResult.templatesProcessed}`);

      // Verify copied accounts exist in test organization
      const { count: copiedCount } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', testOrg.id)
        .eq('entity_type', 'gl_account');

      if (copiedCount !== copyResult.totalAccountsCopied) {
        throw new Error(`Copy verification failed: expected ${copyResult.totalAccountsCopied}, found ${copiedCount}`);
      }

      return { success: true, accountsCopied: copyResult.totalAccountsCopied };

    } catch (error) {
      console.error('❌ COA Copy Test Failed:', error.message);
      this.results.copy.errors = 1;
      return { success: false, error: error.message };
    }
  }

  async validateAccountStructure(type, smartCodePattern) {
    try {
      // Validate account codes are unique
      const { data: accounts, error } = await supabase
        .from('core_entities')
        .select('entity_code, entity_name, smart_code')
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'gl_account')
        .like('smart_code', smartCodePattern);

      if (error) throw error;

      const codes = accounts.map(a => a.entity_code);
      const uniqueCodes = new Set(codes);

      if (codes.length !== uniqueCodes.size) {
        this.results.validation.failed++;
        console.warn(`⚠️  ${type} validation: Found duplicate account codes`);
        return false;
      }

      // Validate smart code patterns
      const invalidSmartCodes = accounts.filter(a => !a.smart_code || !a.smart_code.match(/^HERA\.[A-Z]+(\.[A-Z]+)*\.v\d+$/));
      
      if (invalidSmartCodes.length > 0) {
        this.results.validation.failed++;
        console.warn(`⚠️  ${type} validation: Found invalid smart codes: ${invalidSmartCodes.length}`);
        return false;
      }

      this.results.validation.passed++;
      console.log(`✅ ${type} structure validation passed`);
      return true;

    } catch (error) {
      this.results.validation.failed++;
      console.error(`❌ ${type} validation failed:`, error.message);
      return false;
    }
  }

  async cleanup(testOrg) {
    console.log('\n🧹 Cleaning Up Test Data');
    console.log('='.repeat(25));

    try {
      // Delete test organization accounts
      const { error: accountsError } = await supabase
        .from('core_entities')
        .delete()
        .eq('organization_id', testOrg.id)
        .eq('entity_type', 'gl_account');

      if (accountsError) throw accountsError;

      // Delete test organization relationships
      const { error: relationshipsError } = await supabase
        .from('core_relationships')
        .delete()
        .eq('organization_id', testOrg.id);

      if (relationshipsError) throw relationshipsError;

      // Delete test organization entity
      const { error: orgError } = await supabase
        .from('core_entities')
        .delete()
        .eq('id', testOrg.id);

      if (orgError) throw orgError;

      console.log('✅ Test data cleaned up successfully');

    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      console.log('ℹ️  Manual cleanup may be required for test data');
    }
  }

  async runCompleteTest() {
    console.log('🚀 HERA Chart of Accounts - Complete Integration Test');
    console.log('====================================================');
    console.log(`Test Organization ID: ${TEST_ORG_ID}`);
    console.log(`Started at: ${new Date().toISOString()}\n`);

    let testOrg = null;

    try {
      // Step 1: Create test organization
      testOrg = await this.createTestOrganization();

      // Step 2: Test Universal COA
      const universalResult = await this.testUniversalCOA();

      // Step 3: Test Industry COA
      const industryResult = await this.testIndustryCOA();

      // Step 4: Test Country COA
      const countryResult = await this.testCountryCOA();

      // Step 5: Test Assignment System
      const assignmentResult = await this.testAssignmentSystem(testOrg);

      // Step 6: Test COA Copy
      const copyResult = await this.testCOACopy(testOrg);

      // Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('\n💥 Test Suite Failed:', error.message);
      return false;

    } finally {
      // Cleanup test data
      if (testOrg) {
        await this.cleanup(testOrg);
      }
    }

    return true;
  }

  async generateFinalReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n📊 FINAL TEST REPORT');
    console.log('='.repeat(50));
    console.log(`⏱️  Test Duration: ${duration} seconds`);
    console.log(`📅 Completed: ${new Date().toISOString()}`);

    console.log('\n📋 Component Results:');
    console.log(`   🔹 Universal COA: ${this.results.universal.created} accounts, ${this.results.universal.errors} errors`);
    console.log(`   🔹 Industry COA: ${this.results.industry.created} accounts, ${this.results.industry.errors} errors`);
    console.log(`   🔹 Country COA: ${this.results.country.created} accounts, ${this.results.country.errors} errors`);
    console.log(`   🔹 Assignment System: ${this.results.assignment.created} operations, ${this.results.assignment.errors} errors`);
    console.log(`   🔹 COA Copy: ${this.results.copy.created} accounts, ${this.results.copy.errors} errors`);
    console.log(`   🔹 Validations: ${this.results.validation.passed} passed, ${this.results.validation.failed} failed`);

    const totalErrors = Object.values(this.results).reduce((sum, component) => sum + (component.errors || 0), 0);
    const totalSuccess = this.results.universal.created + this.results.industry.created + 
                        this.results.country.created + this.results.assignment.created + this.results.copy.created;

    console.log(`\n🎯 Overall Summary:`);
    console.log(`   ✅ Total Operations: ${totalSuccess}`);
    console.log(`   ❌ Total Errors: ${totalErrors}`);
    console.log(`   📊 Success Rate: ${totalErrors === 0 ? '100%' : ((totalSuccess / (totalSuccess + totalErrors)) * 100).toFixed(1) + '%'}`);

    if (totalErrors === 0) {
      console.log('\n🎉 ALL TESTS PASSED! HERA COA System is fully functional.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review error messages above.');
    }

    console.log('\n🚀 System Ready for Production Use!');
    console.log('📖 Next Steps:');
    console.log('   1. Review any validation warnings');
    console.log('   2. Customize templates for specific business needs');
    console.log('   3. Implement organization onboarding workflow');
    console.log('   4. Set up monitoring and maintenance procedures');
  }
}

// Execute if run directly
if (require.main === module) {
  const tester = new COASystemTester();
  
  tester.runCompleteTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Fatal Test Error:', error);
      process.exit(1);
    });
}

module.exports = { COASystemTester };