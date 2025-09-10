#!/usr/bin/env node

/**
 * HERA Universal Report Pattern CLI
 * Smart Code: HERA.CLI.URP.v1
 * 
 * Command-line interface for URP operations
 */

const { program } = require('commander');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const fs = require('fs').promises;
require('dotenv').config();

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const DEFAULT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID;

// Helper to get auth token
async function getAuthToken() {
  // In production, this would get a proper JWT token
  // For now, using a placeholder
  return 'dev-token';
}

// List available report recipes
async function listRecipes() {
  const spinner = ora('Loading report recipes...').start();
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/urp`,
      { action: 'list' },
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    spinner.succeed('Report recipes loaded');
    
    const recipes = response.data.recipes || [];
    
    if (recipes.length === 0) {
      console.log(chalk.yellow('No report recipes available'));
      return;
    }
    
    // Group by category
    const categories = {};
    recipes.forEach(recipe => {
      if (!categories[recipe.category]) {
        categories[recipe.category] = [];
      }
      categories[recipe.category].push(recipe);
    });
    
    // Display recipes
    console.log(chalk.bold('\nAvailable Report Recipes:'));
    
    Object.entries(categories).forEach(([category, categoryRecipes]) => {
      console.log(chalk.blue(`\n${category.toUpperCase()}:`));
      
      const table = new Table({
        head: ['Recipe Name', 'Description', 'Parameters'],
        colWidths: [40, 50, 40],
        wordWrap: true
      });
      
      categoryRecipes.forEach(recipe => {
        const params = recipe.parameters
          .map(p => `${p.name}${p.required ? '*' : ''} (${p.type})`)
          .join(', ');
        
        table.push([
          chalk.green(recipe.name),
          recipe.description,
          params || 'None'
        ]);
      });
      
      console.log(table.toString());
    });
    
  } catch (error) {
    spinner.fail('Failed to load recipes');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Execute a report recipe
async function executeRecipe(recipeName, options) {
  const spinner = ora(`Executing report: ${recipeName}`).start();
  
  try {
    // Parse parameters from CLI options
    const parameters = {};
    if (options.params) {
      const paramPairs = options.params.split(',');
      paramPairs.forEach(pair => {
        const [key, value] = pair.split('=');
        // Try to parse as number or boolean
        if (value === 'true') parameters[key] = true;
        else if (value === 'false') parameters[key] = false;
        else if (!isNaN(value)) parameters[key] = parseFloat(value);
        else parameters[key] = value;
      });
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/urp`,
      {
        action: 'execute',
        recipe: recipeName,
        parameters,
        format: options.format || 'json',
        useCache: !options.noCache,
        refreshCache: options.refresh
      },
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    spinner.succeed(`Report executed: ${recipeName}`);
    
    // Display results based on format
    if (options.format === 'json' || !options.format) {
      console.log(JSON.stringify(response.data.data, null, 2));
    } else {
      console.log(response.data.data);
    }
    
    // Save to file if requested
    if (options.output) {
      await fs.writeFile(
        options.output,
        JSON.stringify(response.data.data, null, 2),
        'utf8'
      );
      console.log(chalk.green(`\nReport saved to: ${options.output}`));
    }
    
  } catch (error) {
    spinner.fail('Failed to execute report');
    console.error(chalk.red(error.response?.data?.message || error.message));
    process.exit(1);
  }
}

// Clear cache
async function clearCache(recipeName) {
  const spinner = ora(
    recipeName 
      ? `Clearing cache for recipe: ${recipeName}`
      : 'Clearing all report cache'
  ).start();
  
  try {
    await axios.post(
      `${API_BASE_URL}/api/v1/urp`,
      {
        action: 'clearCache',
        recipeName
      },
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    spinner.succeed(
      recipeName 
        ? `Cache cleared for recipe: ${recipeName}`
        : 'All report cache cleared'
    );
    
  } catch (error) {
    spinner.fail('Failed to clear cache');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Test URP primitives
async function testPrimitives() {
  console.log(chalk.bold('\nTesting URP Primitives:\n'));
  
  const primitives = [
    {
      name: 'Entity Resolver',
      primitive: 'entityResolver',
      config: {
        entityType: 'gl_account',
        limit: 5
      }
    },
    {
      name: 'Transaction Facts',
      primitive: 'transactionFacts',
      config: {
        groupBy: 'month',
        aggregations: ['sum', 'count']
      }
    },
    {
      name: 'Hierarchy Builder',
      primitive: 'hierarchyBuilder',
      config: {
        entities: [],
        relationshipType: 'parent_of'
      }
    }
  ];
  
  for (const test of primitives) {
    const spinner = ora(`Testing ${test.name}...`).start();
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/urp`,
        {
          action: 'primitive',
          primitive: test.primitive,
          config: test.config
        },
        {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      spinner.succeed(`${test.name}: ${chalk.green('PASSED')}`);
      console.log(chalk.gray(`  Result: ${JSON.stringify(response.data.data).slice(0, 100)}...`));
      
    } catch (error) {
      spinner.fail(`${test.name}: ${chalk.red('FAILED')}`);
      console.log(chalk.gray(`  Error: ${error.message}`));
    }
  }
  
  console.log(chalk.bold('\nPrimitive tests complete'));
}

// CLI program setup
program
  .name('urp-cli')
  .description('HERA Universal Report Pattern CLI')
  .version('1.0.0');

program
  .command('list')
  .description('List available report recipes')
  .action(listRecipes);

program
  .command('execute')
  .description('Execute a report recipe')
  .argument('<recipe>', 'Recipe name (e.g., HERA.URP.RECIPE.FINANCE.COA.v1)')
  .option('-p, --params <params>', 'Parameters as key=value pairs (e.g., fiscalYear=2024,includeInactive=true)')
  .option('-f, --format <format>', 'Output format (json, table, csv)', 'json')
  .option('-o, --output <file>', 'Save output to file')
  .option('--no-cache', 'Disable cache for this request')
  .option('--refresh', 'Force refresh cache')
  .action(executeRecipe);

program
  .command('cache')
  .description('Manage report cache')
  .argument('<action>', 'Cache action (clear)')
  .argument('[recipe]', 'Recipe name (optional, clears all if not specified)')
  .action((action, recipe) => {
    if (action === 'clear') {
      clearCache(recipe);
    } else {
      console.error(chalk.red(`Unknown cache action: ${action}`));
      process.exit(1);
    }
  });

program
  .command('test-primitives')
  .description('Test URP primitives')
  .action(testPrimitives);

// Example usage
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ urp-cli list');
  console.log('  $ urp-cli execute HERA.URP.RECIPE.FINANCE.COA.v1 -p fiscalYear=2024');
  console.log('  $ urp-cli execute HERA.URP.RECIPE.FINANCE.TRIAL.BALANCE.v1 -f table -o report.json');
  console.log('  $ urp-cli cache clear');
  console.log('  $ urp-cli cache clear HERA.URP.RECIPE.FINANCE.COA.v1');
  console.log('  $ urp-cli test-primitives');
});

program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}