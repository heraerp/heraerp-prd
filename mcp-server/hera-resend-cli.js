#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const program = new Command();
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Helper function to make API calls
async function callAPI(endpoint, method = 'GET', body = null, headers = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Organization-Id': process.env.DEFAULT_ORGANIZATION_ID,
      ...headers
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
}

program
  .name('hera-resend')
  .description('HERA Resend Email Integration CLI')
  .version('1.0.0');

// Status command
program
  .command('status')
  .description('Check Resend connector status and configuration')
  .action(async () => {
    const spinner = ora('Checking Resend connector status...').start();
    
    try {
      const data = await callAPI('/api/integrations/resend/send', 'GET');
      spinner.succeed('Resend connector status retrieved');
      
      console.log('\n' + chalk.cyan('📧 Resend Connector Status'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.bold('Status:')} ${data.connector.status === 'connected' ? chalk.green('●') : chalk.red('●')} ${data.connector.status}`);
      console.log(`${chalk.bold('Provider:')} ${data.connector.provider}`);
      console.log(`${chalk.bold('From Email:')} ${data.connector.from_email}`);
      console.log(`${chalk.bold('API Key:')} ${data.connector.has_api_key ? chalk.green('Configured') : chalk.yellow('Not configured')}`);
      console.log(`${chalk.bold('Mode:')} ${data.connector.demo_mode ? chalk.yellow('Demo Mode') : chalk.green('Production')}`);
      
      if (data.templates && data.templates.length > 0) {
        console.log('\n' + chalk.cyan('Available Templates:'));
        data.templates.forEach(template => {
          console.log(`  • ${chalk.bold(template.id)} - Variables: ${template.variables.join(', ')}`);
        });
      }
      
    } catch (error) {
      spinner.fail(`Failed to check status: ${error.message}`);
      process.exit(1);
    }
  });

// Send command
program
  .command('send')
  .description('Send an email via Resend')
  .requiredOption('-t, --to <email>', 'Recipient email address')
  .requiredOption('-s, --subject <subject>', 'Email subject')
  .option('-c, --content <content>', 'Email content (text)')
  .option('-h, --html <html>', 'Email content (HTML)')
  .option('-f, --from <from>', 'From email address')
  .option('--cc <cc>', 'CC recipients (comma-separated)')
  .option('--bcc <bcc>', 'BCC recipients (comma-separated)')
  .option('--reply-to <replyTo>', 'Reply-to email address')
  .option('--org <organizationId>', 'Organization ID')
  .action(async (options) => {
    const spinner = ora('Sending email...').start();
    
    try {
      // Validate we have content
      if (!options.content && !options.html) {
        throw new Error('Either --content or --html must be provided');
      }
      
      // Prepare payload
      const payload = {
        to: options.to,
        subject: options.subject,
        text: options.content,
        html: options.html,
        from: options.from,
        replyTo: options.replyTo,
        cc: options.cc ? options.cc.split(',').map(e => e.trim()) : undefined,
        bcc: options.bcc ? options.bcc.split(',').map(e => e.trim()) : undefined
      };
      
      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      
      const headers = {};
      if (options.org) {
        headers['X-Organization-Id'] = options.org;
      }
      
      const result = await callAPI('/api/integrations/resend/send', 'POST', payload, headers);
      spinner.succeed('Email sent successfully!');
      
      console.log('\n' + chalk.green('✅ Email Details:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.bold('ID:')} ${result.result.id}`);
      console.log(`${chalk.bold('From:')} ${result.result.from}`);
      console.log(`${chalk.bold('To:')} ${Array.isArray(result.result.to) ? result.result.to.join(', ') : result.result.to}`);
      console.log(`${chalk.bold('Sent At:')} ${result.result.created_at}`);
      console.log(`${chalk.bold('Transaction ID:')} ${result.result.transaction_id}`);
      
    } catch (error) {
      spinner.fail(`Failed to send email: ${error.message}`);
      process.exit(1);
    }
  });

// Send template command
program
  .command('send-template')
  .description('Send an email using a template')
  .requiredOption('-t, --to <email>', 'Recipient email address')
  .requiredOption('-T, --template <template>', 'Template name (WELCOME, NOTIFICATION, REPORT)')
  .requiredOption('-d, --data <data>', 'Template data as JSON string')
  .option('--cc <cc>', 'CC recipients (comma-separated)')
  .option('--bcc <bcc>', 'BCC recipients (comma-separated)')
  .option('--org <organizationId>', 'Organization ID')
  .action(async (options) => {
    const spinner = ora('Sending template email...').start();
    
    try {
      // Parse template data
      let templateData;
      try {
        templateData = JSON.parse(options.data);
      } catch (error) {
        throw new Error('Invalid JSON for template data');
      }
      
      // Prepare payload
      const payload = {
        to: options.to,
        template: options.template,
        templateData,
        cc: options.cc ? options.cc.split(',').map(e => e.trim()) : undefined,
        bcc: options.bcc ? options.bcc.split(',').map(e => e.trim()) : undefined
      };
      
      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      
      const headers = {};
      if (options.org) {
        headers['X-Organization-Id'] = options.org;
      }
      
      const result = await callAPI('/api/integrations/resend/send', 'POST', payload, headers);
      spinner.succeed('Template email sent successfully!');
      
      console.log('\n' + chalk.green('✅ Email Details:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.bold('ID:')} ${result.result.id}`);
      console.log(`${chalk.bold('Template:')} ${options.template}`);
      console.log(`${chalk.bold('To:')} ${Array.isArray(result.result.to) ? result.result.to.join(', ') : result.result.to}`);
      console.log(`${chalk.bold('Transaction ID:')} ${result.result.transaction_id}`);
      
    } catch (error) {
      spinner.fail(`Failed to send template email: ${error.message}`);
      process.exit(1);
    }
  });

// History command
program
  .command('history')
  .description('View email send history')
  .option('-l, --limit <limit>', 'Number of records to show', '10')
  .option('--status <status>', 'Filter by status (completed, failed, pending)')
  .option('--org <organizationId>', 'Organization ID')
  .action(async (options) => {
    console.log(chalk.yellow('Note: Use the HERA query tools to view email transaction history'));
    console.log('\nExample queries:');
    console.log(chalk.gray('─'.repeat(50)));
    console.log('node hera-query.js transactions --filter "smart_code:HERA.PUBLICSECTOR.CRM.COMM.MESSAGE"');
    console.log('node hera-query.js transactions --filter "transaction_type:communication"');
    console.log('\nOr use SQL:');
    console.log(`SELECT * FROM universal_transactions WHERE smart_code LIKE '%COMM.MESSAGE%' ORDER BY created_at DESC LIMIT ${options.limit};`);
  });

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.cyan('\n📧 HERA Resend CLI Examples\n'));
    
    console.log(chalk.bold('1. Check connector status:'));
    console.log(chalk.gray('   node hera-resend-cli.js status\n'));
    
    console.log(chalk.bold('2. Send a simple text email:'));
    console.log(chalk.gray('   node hera-resend-cli.js send \\'));
    console.log(chalk.gray('     --to user@example.com \\'));
    console.log(chalk.gray('     --subject "Test Email" \\'));
    console.log(chalk.gray('     --content "This is a test email from HERA"\n'));
    
    console.log(chalk.bold('3. Send an HTML email:'));
    console.log(chalk.gray('   node hera-resend-cli.js send \\'));
    console.log(chalk.gray('     --to user@example.com \\'));
    console.log(chalk.gray('     --subject "Welcome" \\'));
    console.log(chalk.gray('     --html "<h1>Welcome to HERA!</h1><p>We are glad to have you.</p>"\n'));
    
    console.log(chalk.bold('4. Send using a template:'));
    console.log(chalk.gray('   node hera-resend-cli.js send-template \\'));
    console.log(chalk.gray('     --to user@example.com \\'));
    console.log(chalk.gray('     --template WELCOME \\'));
    console.log(chalk.gray('     --data \'{"name":"John Doe","organization_name":"HERA Corp"}\'\n'));
    
    console.log(chalk.bold('5. Send with CC and BCC:'));
    console.log(chalk.gray('   node hera-resend-cli.js send \\'));
    console.log(chalk.gray('     --to primary@example.com \\'));
    console.log(chalk.gray('     --subject "Meeting Notes" \\'));
    console.log(chalk.gray('     --content "Please find the meeting notes attached" \\'));
    console.log(chalk.gray('     --cc "manager@example.com,team@example.com" \\'));
    console.log(chalk.gray('     --bcc admin@example.com\n'));
    
    console.log(chalk.bold('6. Send for specific organization:'));
    console.log(chalk.gray('   node hera-resend-cli.js send \\'));
    console.log(chalk.gray('     --to user@example.com \\'));
    console.log(chalk.gray('     --subject "Org Update" \\'));
    console.log(chalk.gray('     --content "Update from your organization" \\'));
    console.log(chalk.gray('     --org 8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77\n'));
    
    console.log(chalk.bold('7. View email history:'));
    console.log(chalk.gray('   node hera-resend-cli.js history --limit 20 --status completed\n'));
    
    console.log(chalk.cyan('Playbook Integration:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('In your playbooks, you can call the API directly:');
    console.log(chalk.gray('curl -X POST http://localhost:3000/api/integrations/resend/send \\'));
    console.log(chalk.gray('  -H "Content-Type: application/json" \\'));
    console.log(chalk.gray('  -H "X-Organization-Id: $ORG_ID" \\'));
    console.log(chalk.gray('  -d \'{"to":"user@example.com","subject":"Test","text":"Hello from playbook"}\''));
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}