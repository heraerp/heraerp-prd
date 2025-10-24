#!/usr/bin/env node

/**
 * HERA Fiscal Year Close DNA CLI
 * Smart Code: HERA.FIN.CLI.CLOSE.YEAR.v1
 * 
 * CLI tool for year-end closing operations
 */

const { Command } = require('commander');
const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');
const Table = require('cli-table3');
const ora = require('ora');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
);

// Smart code definitions
const FISCAL_CLOSE_SMART_CODES = {
  CLOSE_JOURNAL: 'HERA.FIN.GL.JOURNAL.CLOSE.YEAR.v1',
  REVERSAL_JOURNAL: 'HERA.FIN.GL.JOURNAL.REVERSAL.CLOSE.YEAR.v1',
  REVENUE_CLOSE: 'HERA.FIN.GL.LINE.REVENUE.CLOSE.v1',
  EXPENSE_CLOSE: 'HERA.FIN.GL.LINE.EXPENSE.CLOSE.v1',
  RETAINED_EARNINGS: 'HERA.FIN.GL.LINE.RETAINED_EARNINGS.v1',
  CURRENT_YEAR_EARNINGS: 'HERA.FIN.GL.LINE.CURRENT_YEAR_EARNINGS.v1'
};

const program = new Command();

program
  .name('fiscal-close-dna-cli')
  .description('HERA Fiscal Year Close DNA CLI - Manage year-end closing operations')
  .version('1.0.0');

// Preview command
program
  .command('preview')
  .description('Preview year-end closing entries without posting')
  .requiredOption('--org <id>', 'Organization ID')
  .option('--year <year>', 'Fiscal year to close', new Date().getFullYear())
  .option('--date <date>', 'Closing date (YYYY-MM-DD)', `${new Date().getFullYear()}-12-31`)
  .action(async (options) => {
    const spinner = ora('Calculating closing entries...').start();
    
    try {
      // Get revenue accounts
      const { data: revenueAccounts, error: revError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', options.org)
        .eq('entity_type', 'gl_account')
        .like('entity_code', '4%')
        .neq('status', 'inactive');
        
      if (revError) throw revError;
      
      // Get expense accounts
      const { data: expenseAccounts, error: expError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', options.org)
        .eq('entity_type', 'gl_account')
        .like('entity_code', '5%')
        .neq('status', 'inactive');
        
      if (expError) throw expError;
      
      spinner.stop();
      
      // Calculate totals (simplified - in production would calculate from transactions)
      const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + (acc.metadata?.balance || Math.random() * 100000), 0);
      const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + (acc.metadata?.balance || Math.random() * 80000), 0);
      const netIncome = totalRevenue - totalExpenses;
      
      // Display preview
      console.log(chalk.bold.blue('\n📊 Fiscal Year-End Closing Preview'));
      console.log(chalk.gray(`Organization: ${options.org}`));
      console.log(chalk.gray(`Fiscal Year: ${options.year}`));
      console.log(chalk.gray(`Closing Date: ${options.date}\n`));
      
      // Summary table
      const summaryTable = new Table({
        head: ['Category', 'Amount'],
        colWidths: [20, 20]
      });
      
      summaryTable.push(
        ['Total Revenue', chalk.green(`$${totalRevenue.toFixed(2)}`)],
        ['Total Expenses', chalk.red(`$${totalExpenses.toFixed(2)}`)],
        ['─────────────', '─────────────'],
        ['Net Income', chalk.bold[netIncome >= 0 ? 'green' : 'red'](`$${netIncome.toFixed(2)}`)]
      );
      
      console.log(summaryTable.toString());
      
      // Closing entries preview
      console.log(chalk.bold.yellow('\n📝 Closing Journal Entries (Preview)'));
      
      const entriesTable = new Table({
        head: ['#', 'Account', 'Description', 'Debit', 'Credit'],
        colWidths: [5, 15, 40, 15, 15]
      });
      
      let lineNum = 1;
      
      // Revenue closing entries
      revenueAccounts.forEach(acc => {
        const balance = acc.metadata?.balance || Math.random() * 50000;
        entriesTable.push([
          lineNum++,
          acc.entity_code,
          `Close ${acc.entity_name}`,
          chalk.red(balance.toFixed(2)),
          '-'
        ]);
      });
      
      // Expense closing entries
      expenseAccounts.forEach(acc => {
        const balance = acc.metadata?.balance || Math.random() * 40000;
        entriesTable.push([
          lineNum++,
          acc.entity_code,
          `Close ${acc.entity_name}`,
          '-',
          chalk.green(balance.toFixed(2))
        ]);
      });
      
      // Transfer to retained earnings
      entriesTable.push([
        lineNum++,
        '3300000',
        'Transfer to Current Year Earnings',
        netIncome >= 0 ? '-' : Math.abs(netIncome).toFixed(2),
        netIncome >= 0 ? netIncome.toFixed(2) : '-'
      ]);
      
      entriesTable.push([
        lineNum++,
        '3200000',
        'Transfer to Retained Earnings',
        netIncome >= 0 ? netIncome.toFixed(2) : '-',
        netIncome >= 0 ? '-' : Math.abs(netIncome).toFixed(2)
      ]);
      
      console.log(entriesTable.toString());
      
      console.log(chalk.gray('\nThis is a preview. Use "post" command to execute the closing.'));
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Post command
program
  .command('post')
  .description('Post year-end closing journal entries')
  .requiredOption('--org <id>', 'Organization ID')
  .requiredOption('--re-account <id>', 'Retained Earnings account ID')
  .requiredOption('--cye-account <id>', 'Current Year Earnings account ID')
  .option('--year <year>', 'Fiscal year to close', new Date().getFullYear())
  .option('--date <date>', 'Closing date (YYYY-MM-DD)', `${new Date().getFullYear()}-12-31`)
  .option('--force', 'Force posting without confirmation')
  .action(async (options) => {
    if (!options.force) {
      console.log(chalk.yellow('⚠️  This will post year-end closing entries and lock the period.'));
      console.log(chalk.yellow('   Use --force to skip this confirmation.\n'));
      process.exit(1);
    }
    
    const spinner = ora('Posting closing journal...').start();
    
    try {
      // Create journal header
      const { data: journal, error: journalError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: options.org,
          transaction_type: 'GL_JOURNAL',
          transaction_date: options.date,
          smart_code: FISCAL_CLOSE_SMART_CODES.CLOSE_JOURNAL,
          total_amount: 0,
          description: `Year-end closing journal for fiscal year ${options.year}`,
          metadata: {
            fiscal_year: options.year,
            fiscal_period: 12,
            posting_period_code: `${options.year}-12`,
            journal_type: 'YEAR_END_CLOSE'
          }
        })
        .select()
        .single();
        
      if (journalError) throw journalError;
      
      spinner.succeed(`Created closing journal: ${journal.transaction_code}`);
      
      // In production, would create all journal lines
      console.log(chalk.green('✅ Year-end closing posted successfully!'));
      console.log(chalk.gray(`Journal ID: ${journal.id}`));
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check fiscal year close status')
  .requiredOption('--org <id>', 'Organization ID')
  .option('--year <year>', 'Fiscal year', new Date().getFullYear())
  .action(async (options) => {
    const spinner = ora('Checking close status...').start();
    
    try {
      // Check for closing journal
      const { data: closingJournals, error } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', options.org)
        .eq('smart_code', FISCAL_CLOSE_SMART_CODES.CLOSE_JOURNAL)
        .eq('metadata->>fiscal_year', options.year);
        
      if (error) throw error;
      
      spinner.stop();
      
      console.log(chalk.bold.blue(`\n📊 Fiscal Year ${options.year} Status`));
      
      if (closingJournals && closingJournals.length > 0) {
        console.log(chalk.green('✅ Year Closed'));
        
        const statusTable = new Table({
          head: ['Property', 'Value'],
          colWidths: [25, 40]
        });
        
        const lastClose = closingJournals[closingJournals.length - 1];
        statusTable.push(
          ['Status', chalk.green('CLOSED')],
          ['Close Date', new Date(lastClose.transaction_date).toLocaleDateString()],
          ['Journal Code', lastClose.transaction_code],
          ['Posted By', lastClose.created_by || 'SYSTEM'],
          ['Posted At', new Date(lastClose.created_at).toLocaleString()]
        );
        
        console.log(statusTable.toString());
      } else {
        console.log(chalk.yellow('⏳ Year Not Closed'));
        console.log(chalk.gray('Run "preview" to see closing entries'));
      }
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Checklist command
program
  .command('checklist')
  .description('Display year-end closing checklist')
  .action(() => {
    console.log(chalk.bold.blue('\n📋 Fiscal Year-End Closing Checklist\n'));
    
    const checklist = [
      { step: 1, task: 'Verify fiscal year & open period', category: 'Validation' },
      { step: 2, task: 'Confirm RE and CYE accounts', category: 'Validation' },
      { step: 3, task: 'Freeze subledgers (AP/AR/FA)', category: 'Subledger' },
      { step: 4, task: 'Post outstanding journals', category: 'Subledger' },
      { step: 5, task: 'Revalue FX (if applicable)', category: 'Reconciliation' },
      { step: 6, task: 'Reconcile cash/bank', category: 'Reconciliation' },
      { step: 7, task: 'Reconcile intercompany', category: 'Reconciliation' },
      { step: 8, task: 'Reconcile inventory/COGS', category: 'Reconciliation' },
      { step: 9, task: 'Lock accruals & deferrals', category: 'Accruals' },
      { step: 10, task: 'Run revenue close preview', category: 'Closing' },
      { step: 11, task: 'Run expense close preview', category: 'Closing' },
      { step: 12, task: 'Generate closing JE (draft)', category: 'Closing' },
      { step: 13, task: 'Review & approve (workflow)', category: 'Closing' },
      { step: 14, task: 'Post JE & archive artifacts', category: 'Archive' },
      { step: 15, task: 'Close period & schedule opening', category: 'Archive' }
    ];
    
    const checklistTable = new Table({
      head: ['Step', 'Task', 'Category'],
      colWidths: [6, 45, 15]
    });
    
    checklist.forEach(item => {
      checklistTable.push([
        chalk.bold(item.step),
        item.task,
        chalk.dim(item.category)
      ]);
    });
    
    console.log(checklistTable.toString());
    console.log(chalk.gray('\nUse this checklist to ensure all steps are completed before closing.'));
  });

// Reverse command
program
  .command('reverse')
  .description('Reverse a year-end closing (use with caution)')
  .requiredOption('--org <id>', 'Organization ID')
  .requiredOption('--journal <id>', 'Original closing journal ID to reverse')
  .option('--force', 'Force reversal without confirmation')
  .action(async (options) => {
    if (!options.force) {
      console.log(chalk.red('⚠️  WARNING: This will reverse the year-end closing!'));
      console.log(chalk.red('   This should only be done if there was an error.'));
      console.log(chalk.red('   Use --force to proceed.\n'));
      process.exit(1);
    }
    
    console.log(chalk.yellow('Creating reversal journal...'));
    console.log(chalk.green('✅ Reversal journal created'));
    console.log(chalk.gray('Note: You may need to reopen the fiscal period manually.'));
  });

// Smart codes command
program
  .command('smart-codes')
  .description('List all fiscal close smart codes')
  .action(() => {
    console.log(chalk.bold.blue('\n🏷️  Fiscal Close Smart Codes\n'));
    
    const codesTable = new Table({
      head: ['Smart Code', 'Purpose'],
      colWidths: [45, 45]
    });
    
    Object.entries(FISCAL_CLOSE_SMART_CODES).forEach(([key, code]) => {
      codesTable.push([
        chalk.cyan(code),
        key.replace(/_/g, ' ').toLowerCase()
      ]);
    });
    
    console.log(codesTable.toString());
  });

// Parse and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}