#!/usr/bin/env node
/**
 * HERA MCP Terminal Client
 * Direct terminal access to HERA MCP Server
 */

const readline = require('readline');

async function startClient() {
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
  const { spawn } = await import('child_process');

  console.log('🚀 Starting HERA MCP Client...\n');

  // Spawn the server process
  const serverProcess = spawn('node', ['hera-mcp-server-v2.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      DEFAULT_ORGANIZATION_ID: process.env.DEFAULT_ORGANIZATION_ID || 'hera_software_inc'
    }
  });

  // Create transport
  const transport = new StdioClientTransport({
    command: serverProcess.command,
    args: serverProcess.args,
    spawn: false, // We already spawned it
    child: serverProcess
  });

  // Create client
  const client = new Client({
    name: "hera-terminal-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  // Connect to server
  await client.connect(transport);

  console.log('✅ Connected to HERA MCP Server\n');

  // List available tools
  const toolsList = await client.listTools();
  console.log('📋 Available Tools:');
  toolsList.tools.forEach(tool => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });
  console.log();

  // Create readline interface for interactive mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'HERA MCP> '
  });

  console.log('💡 Usage Examples:');
  console.log('  query-universal core_entities');
  console.log('  create-entity customer "Acme Corp"');
  console.log('  set-dynamic-field <entity_id> email "test@example.com"');
  console.log('  help - Show all commands');
  console.log('  exit - Quit the client\n');

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (input === 'exit' || input === 'quit') {
      console.log('👋 Goodbye!');
      rl.close();
      process.exit(0);
    }

    if (input === 'help') {
      showHelp();
      rl.prompt();
      return;
    }

    if (input === '') {
      rl.prompt();
      return;
    }

    try {
      const result = await processCommand(client, input);
      console.log(result);
    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

async function processCommand(client, input) {
  const parts = input.split(' ');
  const command = parts[0];

  switch (command) {
    case 'query-universal':
    case 'query': {
      const table = parts[1];
      const filters = parts.length > 2 ? parseFilters(parts.slice(2).join(' ')) : {};
      
      const result = await client.callTool("query-universal", {
        table: table,
        filters: filters,
        limit: 50
      });
      
      return formatResult(result);
    }

    case 'create-entity':
    case 'create': {
      const entityType = parts[1];
      const entityName = parts.slice(2).join(' ').replace(/"/g, '');
      
      const result = await client.callTool("create-entity", {
        entity_type: entityType,
        entity_name: entityName
      });
      
      return formatResult(result);
    }

    case 'set-dynamic-field':
    case 'set-field': {
      const entityId = parts[1];
      const fieldName = parts[2];
      const fieldValue = parts.slice(3).join(' ').replace(/"/g, '');
      
      const result = await client.callTool("set-dynamic-field", {
        entity_id: entityId,
        field_name: fieldName,
        field_value: fieldValue
      });
      
      return formatResult(result);
    }

    case 'create-transaction':
    case 'transaction': {
      const txType = parts[1];
      const amount = parseFloat(parts[2]) || 0;
      
      const result = await client.callTool("create-transaction", {
        transaction_type: txType,
        total_amount: amount
      });
      
      return formatResult(result);
    }

    case 'create-relationship':
    case 'relate': {
      const parentId = parts[1];
      const childId = parts[2];
      const relType = parts[3] || 'related_to';
      
      const result = await client.callTool("create-relationship", {
        parent_entity_id: parentId,
        child_entity_id: childId,
        relationship_type: relType
      });
      
      return formatResult(result);
    }

    case 'list-tools':
      const tools = await client.listTools();
      return '📋 Available Tools:\n' + tools.tools.map(t => 
        `  - ${t.name}: ${t.description}`
      ).join('\n');

    case 'list-resources':
      const resources = await client.listResources();
      return '📚 Available Resources:\n' + resources.resources.map(r => 
        `  - ${r.uri}: ${r.description}`
      ).join('\n');

    case 'read-resource': {
      const uri = parts[1];
      const resource = await client.readResource(uri);
      return formatResult({ content: [{ type: "text", text: resource.contents[0].text }] });
    }

    default:
      return `❓ Unknown command: ${command}. Type 'help' for available commands.`;
  }
}

function parseFilters(filterString) {
  try {
    // Try to parse as JSON first
    if (filterString.startsWith('{')) {
      return JSON.parse(filterString);
    }
    
    // Otherwise parse key:value pairs
    const filters = {};
    const pairs = filterString.split(',');
    pairs.forEach(pair => {
      const [key, value] = pair.split(':').map(s => s.trim());
      if (key && value) {
        filters[key] = value.replace(/"/g, '');
      }
    });
    return filters;
  } catch {
    return {};
  }
}

function formatResult(result) {
  if (!result || !result.content || !result.content[0]) {
    return '⚠️ No result returned';
  }

  const content = result.content[0];
  if (content.type === 'text') {
    try {
      const parsed = JSON.parse(content.text);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content.text;
    }
  }

  return JSON.stringify(content, null, 2);
}

function showHelp() {
  console.log('\n📚 HERA MCP Terminal Commands:');
  console.log('\nQuery Commands:');
  console.log('  query-universal <table> [filters]    - Query any of the 6 sacred tables');
  console.log('    Example: query-universal core_entities entity_type:customer');
  console.log('    Tables: core_organizations, core_entities, core_dynamic_data,');
  console.log('            core_relationships, universal_transactions, universal_transaction_lines');
  
  console.log('\nEntity Commands:');
  console.log('  create-entity <type> <name>          - Create a new entity');
  console.log('    Example: create-entity customer "Acme Corporation"');
  
  console.log('\nField Commands:');
  console.log('  set-dynamic-field <entity_id> <field> <value> - Set a dynamic field');
  console.log('    Example: set-field abc123 email "contact@acme.com"');
  
  console.log('\nTransaction Commands:');
  console.log('  create-transaction <type> <amount>   - Create a transaction');
  console.log('    Example: create-transaction sale 1500.00');
  
  console.log('\nRelationship Commands:');
  console.log('  create-relationship <parent_id> <child_id> <type> - Create relationship');
  console.log('    Example: create-relationship abc123 xyz789 manages');
  
  console.log('\nSystem Commands:');
  console.log('  list-tools                           - List all available MCP tools');
  console.log('  list-resources                       - List all available resources');
  console.log('  read-resource <uri>                  - Read a specific resource');
  console.log('  help                                 - Show this help message');
  console.log('  exit                                 - Exit the client\n');
}

// Start the client
startClient().catch(error => {
  console.error('🔥 Failed to start client:', error);
  process.exit(1);
});