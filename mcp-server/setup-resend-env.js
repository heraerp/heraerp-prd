#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function setupResendEnvironment() {
  console.log(chalk.cyan('\n🔧 HERA Resend Setup Helper\n'));

  // Check Supabase connection
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(chalk.red('❌ Supabase configuration missing in .env file'));
    console.log(chalk.yellow('\nRequired variables:'));
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  // Check Resend API key
  if (!process.env.RESEND_API_KEY) {
    console.log(chalk.yellow('⚠️  RESEND_API_KEY not found in .env file'));
    console.log(chalk.gray('The Resend integration will work in demo mode (emails will be logged but not sent)'));
    console.log(chalk.gray('To send real emails, add your Resend API key to .env file\n'));
  } else {
    console.log(chalk.green('✅ Resend API key found'));
  }

  // Get or create a default organization
  try {
    console.log(chalk.cyan('\n📋 Finding organizations...'));
    
    const { data: orgs, error } = await supabase
      .from('core_organizations')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(5);

    if (error) {
      console.log(chalk.red(`❌ Error fetching organizations: ${error.message}`));
      return;
    }

    if (!orgs || orgs.length === 0) {
      console.log(chalk.yellow('⚠️  No organizations found in the database'));
      console.log(chalk.gray('Run the organization seeder first or create one manually'));
      return;
    }

    console.log(chalk.green(`\n✅ Found ${orgs.length} organization(s):\n`));
    
    orgs.forEach((org, index) => {
      const name = org.metadata?.name || org.organization_name || org.id;
      console.log(`  ${index + 1}. ${chalk.bold(name)}`);
      console.log(`     ID: ${chalk.gray(org.id)}`);
      console.log('');
    });

    const defaultOrg = orgs[0];
    
    if (!process.env.DEFAULT_ORGANIZATION_ID) {
      console.log(chalk.yellow('\n📝 Add this to your .env file:'));
      console.log(chalk.white(`DEFAULT_ORGANIZATION_ID=${defaultOrg.id}`));
    } else {
      console.log(chalk.green(`\n✅ DEFAULT_ORGANIZATION_ID is set to: ${process.env.DEFAULT_ORGANIZATION_ID}`));
    }

    console.log(chalk.cyan('\n📧 Resend CLI Usage Examples:\n'));
    
    console.log(chalk.white('Check status:'));
    console.log(chalk.gray(`  node hera-resend-cli.js status --org ${defaultOrg.id}`));
    
    console.log(chalk.white('\nSend a test email:'));
    console.log(chalk.gray(`  node hera-resend-cli.js send --to your@email.com --subject "Test from HERA" --content "Hello from HERA!" --org ${defaultOrg.id}`));
    
    console.log(chalk.white('\nSend with HTML:'));
    console.log(chalk.gray(`  node hera-resend-cli.js send --to your@email.com --subject "Welcome" --html "<h1>Welcome to HERA!</h1>" --org ${defaultOrg.id}`));

  } catch (error) {
    console.log(chalk.red(`\n❌ Error: ${error.message}`));
  }
}

// Run the setup
setupResendEnvironment();