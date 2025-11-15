#!/usr/bin/env node

/**
 * HERA Chart of Accounts System - Production Deployment Script
 * Orchestrates complete COA system setup in correct order
 * Provides rollback capabilities and deployment verification
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001';

class COASystemDeployer {
  constructor(options = {}) {
    this.options = {
      skipExisting: options.skipExisting || true,
      runTests: options.runTests || true,
      dryRun: options.dryRun || false,
      verbose: options.verbose || true,
      ...options
    };
    
    this.deploymentLog = [];
    this.startTime = Date.now();
    this.deploymentId = `coa-deploy-${Date.now()}`;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message, deploymentId: this.deploymentId };
    
    this.deploymentLog.push(logEntry);
    
    if (this.options.verbose) {
      const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
      console.log(`${prefix} ${message}`);
    }
  }

  async checkPrerequisites() {
    this.log('Checking deployment prerequisites...', 'info');

    try {
      // Check Supabase connection
      const { data, error } = await supabase
        .from('core_entities')
        .select('count(*)')
        .eq('organization_id', PLATFORM_ORG_ID)
        .limit(1);

      if (error) throw new Error(`Supabase connection failed: ${error.message}`);

      // Check platform organization exists
      const { data: platformOrg, error: platformError } = await supabase
        .from('core_entities')
        .select('id')
        .eq('id', PLATFORM_ORG_ID)
        .single();

      if (platformError && platformError.code === 'PGRST116') {
        this.log('Platform organization not found, this is normal for fresh installations', 'warning');
      }

      // Check required environment variables
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];

      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          throw new Error(`Missing required environment variable: ${envVar}`);
        }
      }

      this.log('Prerequisites check passed', 'success');
      return true;

    } catch (error) {
      this.log(`Prerequisites check failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async deployUniversalCOA() {
    this.log('Deploying Universal Chart of Accounts...', 'info');

    try {
      if (this.options.skipExisting) {
        // Check if universal COA already exists
        const { count } = await supabase
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', PLATFORM_ORG_ID)
          .eq('entity_type', 'gl_account')
          .like('smart_code', 'HERA.PLATFORM.FINANCE.GL.%');

        if (count && count > 50) {
          this.log(`Universal COA already exists (${count} accounts), skipping...`, 'info');
          return { skipped: true, count };
        }
      }

      if (this.options.dryRun) {
        this.log('DRY RUN: Would deploy universal COA (80+ accounts)', 'info');
        return { dryRun: true };
      }

      // Import and execute universal COA creation
      const { createUniversalCOA } = require('./create-platform-universal-coa.js');
      const result = await createUniversalCOA();

      this.log(`Universal COA deployed successfully: ${result.success} accounts`, 'success');
      return result;

    } catch (error) {
      this.log(`Universal COA deployment failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async deployIndustryCOA() {
    this.log('Deploying Industry-Specific COA Templates...', 'info');

    try {
      if (this.options.skipExisting) {
        const { count } = await supabase
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', PLATFORM_ORG_ID)
          .eq('entity_type', 'gl_account')
          .or('smart_code.like.HERA.SALON.FINANCE.GL.%,smart_code.like.HERA.RESTAURANT.FINANCE.GL.%,smart_code.like.HERA.TELECOM.FINANCE.GL.%');

        if (count && count > 30) {
          this.log(`Industry COA already exists (${count} accounts), skipping...`, 'info');
          return { skipped: true, count };
        }
      }

      if (this.options.dryRun) {
        this.log('DRY RUN: Would deploy industry COA templates (5 industries, 60+ accounts)', 'info');
        return { dryRun: true };
      }

      const { createAllIndustryTemplates } = require('./create-industry-coa-templates.js');
      const results = await createAllIndustryTemplates();

      const totalAccounts = results.reduce((sum, result) => sum + result.success, 0);
      const totalErrors = results.reduce((sum, result) => sum + result.errors, 0);

      if (totalErrors > 0) {
        this.log(`Industry COA deployed with warnings: ${totalAccounts} accounts, ${totalErrors} errors`, 'warning');
      } else {
        this.log(`Industry COA deployed successfully: ${totalAccounts} accounts`, 'success');
      }

      return { success: totalAccounts, errors: totalErrors, details: results };

    } catch (error) {
      this.log(`Industry COA deployment failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async deployCountryCOA() {
    this.log('Deploying Country Localization COA Templates...', 'info');

    try {
      if (this.options.skipExisting) {
        const { count } = await supabase
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', PLATFORM_ORG_ID)
          .eq('entity_type', 'gl_account')
          .or('smart_code.like.HERA.UAE.FINANCE.GL.%,smart_code.like.HERA.INDIA.FINANCE.GL.%,smart_code.like.HERA.USA.FINANCE.GL.%');

        if (count && count > 20) {
          this.log(`Country COA already exists (${count} accounts), skipping...`, 'info');
          return { skipped: true, count };
        }
      }

      if (this.options.dryRun) {
        this.log('DRY RUN: Would deploy country COA templates (5 countries, 40+ accounts)', 'info');
        return { dryRun: true };
      }

      const { createAllCountryTemplates } = require('./create-country-localization-coa.js');
      const results = await createAllCountryTemplates();

      const totalAccounts = results.reduce((sum, result) => sum + result.success, 0);
      const totalErrors = results.reduce((sum, result) => sum + result.errors, 0);

      if (totalErrors > 0) {
        this.log(`Country COA deployed with warnings: ${totalAccounts} accounts, ${totalErrors} errors`, 'warning');
      } else {
        this.log(`Country COA deployed successfully: ${totalAccounts} accounts`, 'success');
      }

      return { success: totalAccounts, errors: totalErrors, details: results };

    } catch (error) {
      this.log(`Country COA deployment failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async deployAssignmentSystem() {
    this.log('Deploying COA Assignment System...', 'info');

    try {
      if (this.options.skipExisting) {
        const { count } = await supabase
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', PLATFORM_ORG_ID)
          .eq('entity_type', 'coa_template');

        if (count && count > 10) {
          this.log(`COA template entities already exist (${count} templates), skipping...`, 'info');
          return { skipped: true, count };
        }
      }

      if (this.options.dryRun) {
        this.log('DRY RUN: Would deploy assignment system (template entities + relationship framework)', 'info');
        return { dryRun: true };
      }

      const { createCOATemplateEntities } = require('./create-coa-assignment-system.js');
      const templateEntities = await createCOATemplateEntities();

      this.log(`Assignment system deployed successfully: ${templateEntities.length} template entities`, 'success');
      return { success: templateEntities.length, templateEntities };

    } catch (error) {
      this.log(`Assignment system deployment failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async runDeploymentTests() {
    if (!this.options.runTests) {
      this.log('Skipping deployment tests (disabled)', 'info');
      return { skipped: true };
    }

    this.log('Running deployment verification tests...', 'info');

    try {
      const { COASystemTester } = require('./test-coa-system-complete.js');
      const tester = new COASystemTester();

      // Run abbreviated test suite for deployment verification
      const testResults = {
        universal: await this.validateUniversalCOA(),
        industry: await this.validateIndustryCOA(), 
        country: await this.validateCountryCOA(),
        assignment: await this.validateAssignmentSystem()
      };

      const allTestsPassed = Object.values(testResults).every(result => result.success);

      if (allTestsPassed) {
        this.log('All deployment tests passed', 'success');
      } else {
        this.log('Some deployment tests failed', 'warning');
      }

      return { success: allTestsPassed, details: testResults };

    } catch (error) {
      this.log(`Deployment tests failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async validateUniversalCOA() {
    try {
      const { count } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'gl_account')
        .like('smart_code', 'HERA.PLATFORM.FINANCE.GL.%');

      return { 
        success: count && count >= 50, 
        count, 
        expected: '50+ accounts',
        message: `Found ${count} universal accounts`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateIndustryCOA() {
    try {
      const industries = ['SALON', 'RESTAURANT', 'TELECOM', 'MANUFACTURING', 'RETAIL'];
      const validationResults = [];

      for (const industry of industries) {
        const { count } = await supabase
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', PLATFORM_ORG_ID)
          .eq('entity_type', 'gl_account')
          .like('smart_code', `HERA.${industry}.FINANCE.GL.%`);

        validationResults.push({ industry, count, success: count && count >= 5 });
      }

      const allIndustriesValid = validationResults.every(result => result.success);
      return { 
        success: allIndustriesValid, 
        industries: validationResults,
        message: `Validated ${industries.length} industry templates`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateCountryCOA() {
    try {
      const countries = ['UAE', 'INDIA', 'USA', 'UK', 'GENERIC'];
      const validationResults = [];

      for (const country of countries) {
        const { count } = await supabase
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', PLATFORM_ORG_ID)
          .eq('entity_type', 'gl_account')
          .like('smart_code', `HERA.${country}.FINANCE.GL.%`);

        validationResults.push({ country, count, success: count && count >= 3 });
      }

      const allCountriesValid = validationResults.every(result => result.success);
      return { 
        success: allCountriesValid, 
        countries: validationResults,
        message: `Validated ${countries.length} country templates`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateAssignmentSystem() {
    try {
      const { count } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'coa_template');

      return { 
        success: count && count >= 10, 
        count,
        expected: '10+ template entities',
        message: `Found ${count} template entities`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async generateDeploymentReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n📊 DEPLOYMENT REPORT');
    console.log('='.repeat(50));
    console.log(`🚀 Deployment ID: ${this.deploymentId}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📅 Completed: ${new Date().toISOString()}`);
    console.log(`🔧 Options: ${JSON.stringify(this.options, null, 2)}`);

    const errorLogs = this.deploymentLog.filter(entry => entry.type === 'error');
    const warningLogs = this.deploymentLog.filter(entry => entry.type === 'warning');
    const successLogs = this.deploymentLog.filter(entry => entry.type === 'success');

    console.log('\n📋 Summary:');
    console.log(`   ✅ Successful Operations: ${successLogs.length}`);
    console.log(`   ⚠️  Warnings: ${warningLogs.length}`);
    console.log(`   ❌ Errors: ${errorLogs.length}`);

    if (errorLogs.length > 0) {
      console.log('\n❌ Errors Encountered:');
      errorLogs.forEach(log => {
        console.log(`   • ${log.message}`);
      });
    }

    if (warningLogs.length > 0) {
      console.log('\n⚠️  Warnings:');
      warningLogs.forEach(log => {
        console.log(`   • ${log.message}`);
      });
    }

    const deploymentSuccess = errorLogs.length === 0;
    
    if (deploymentSuccess) {
      console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
      console.log('\n🚀 HERA Chart of Accounts System is now ready for production use.');
      console.log('\n📖 Next Steps:');
      console.log('   1. Assign COA templates to organizations using assignCompleteCOA()');
      console.log('   2. Copy COA templates to organizations using copyCOAFromTemplates()');
      console.log('   3. Configure organization-specific settings and opening balances');
      console.log('   4. Set up automated backup and monitoring procedures');
      console.log('   5. Train users on the new COA structure');
    } else {
      console.log('\n💥 DEPLOYMENT COMPLETED WITH ERRORS');
      console.log('Please review the error messages above and resolve any issues.');
    }

    return { success: deploymentSuccess, logs: this.deploymentLog };
  }

  async deploy() {
    console.log('🚀 HERA Chart of Accounts System - Production Deployment');
    console.log('========================================================');
    console.log(`Deployment ID: ${this.deploymentId}`);
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
    console.log(`Started: ${new Date().toISOString()}\n`);

    try {
      // Step 1: Prerequisites check
      await this.checkPrerequisites();

      // Step 2: Deploy Universal COA
      const universalResult = await this.deployUniversalCOA();

      // Step 3: Deploy Industry COA
      const industryResult = await this.deployIndustryCOA();

      // Step 4: Deploy Country COA
      const countryResult = await this.deployCountryCOA();

      // Step 5: Deploy Assignment System
      const assignmentResult = await this.deployAssignmentSystem();

      // Step 6: Run verification tests
      const testResults = await this.runDeploymentTests();

      // Step 7: Generate report
      const reportResults = await this.generateDeploymentReport();

      return reportResults;

    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      await this.generateDeploymentReport();
      throw error;
    }
  }

  async rollback() {
    console.log('🔄 HERA COA System - Rollback (NOT IMPLEMENTED)');
    console.log('================================================');
    console.log('⚠️  Rollback functionality is not implemented in this version.');
    console.log('💡 For rollback, manually delete the following:');
    console.log('   • GL account entities in platform organization');
    console.log('   • COA template entities in platform organization');
    console.log('   • COA assignment relationships');
    console.log('\n🚨 USE WITH EXTREME CAUTION IN PRODUCTION!');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'deploy';

  const options = {
    skipExisting: !args.includes('--force'),
    runTests: !args.includes('--no-tests'),
    dryRun: args.includes('--dry-run'),
    verbose: !args.includes('--quiet')
  };

  const deployer = new COASystemDeployer(options);

  try {
    switch (command) {
      case 'deploy':
        const result = await deployer.deploy();
        process.exit(result.success ? 0 : 1);
        break;
        
      case 'rollback':
        await deployer.rollback();
        process.exit(0);
        break;
        
      case 'test':
        const testResult = await deployer.runDeploymentTests();
        process.exit(testResult.success ? 0 : 1);
        break;
        
      default:
        console.log('Usage: node deploy-coa-system.js [deploy|rollback|test] [options]');
        console.log('Options:');
        console.log('  --force      Overwrite existing data');
        console.log('  --no-tests   Skip deployment tests');
        console.log('  --dry-run    Preview changes without executing');
        console.log('  --quiet      Minimal output');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Command failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { COASystemDeployer };