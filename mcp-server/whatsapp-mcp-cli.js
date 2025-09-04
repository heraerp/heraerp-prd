#!/usr/bin/env node
/**
 * HERA WhatsApp MCP CLI
 * All WhatsApp operations through MCP to enforce guardrails
 * Usage: node whatsapp-mcp-cli.js <command> <args>
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase with service role key for MCP operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default organization ID for CLI operations
const DEFAULT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

/**
 * MCP Guardrails - Enforce HERA principles
 */
class MCPGuardrails {
  static validateOrganizationId(orgId) {
    if (!orgId || orgId === 'missing-org-id') {
      throw new Error('Organization ID is required for all operations');
    }
    return orgId;
  }

  static validateSmartCode(smartCode) {
    const pattern = /^HERA\.[A-Z]+(\.[A-Z0-9]+)*\.v\d+$/;
    if (!pattern.test(smartCode)) {
      throw new Error(`Invalid smart code format: ${smartCode}. Must match HERA.MODULE.FUNCTION.TYPE.v1`);
    }
    return smartCode;
  }

  static validateTableName(tableName) {
    const allowedTables = [
      'core_organizations',
      'core_entities',
      'core_dynamic_data',
      'core_relationships',
      'universal_transactions',
      'universal_transaction_lines'
    ];
    if (!allowedTables.includes(tableName)) {
      throw new Error(`Table ${tableName} not allowed. Only six sacred tables permitted.`);
    }
    return tableName;
  }
}

/**
 * WhatsApp Thread Operations
 */
const threadOperations = {
  async create(args) {
    const { organizationId, customerEntityId, phoneNumber, agentQueueEntityId, metadata = {} } = args;
    
    MCPGuardrails.validateOrganizationId(organizationId);
    MCPGuardrails.validateSmartCode('HERA.WHATSAPP.INBOX.THREAD.v1');
    
    const { data, error } = await supabase
      .from('universal_transactions')
      .insert({
        id: uuidv4(),
        organization_id: organizationId,
        transaction_type: 'MESSAGE_THREAD',
        smart_code: 'HERA.WHATSAPP.INBOX.THREAD.v1',
        transaction_date: new Date().toISOString(),
        source_entity_id: customerEntityId,
        target_entity_id: agentQueueEntityId,
        metadata: {
          channel: 'whatsapp',
          phone_number: phoneNumber,
          status: 'open',
          created_at: new Date().toISOString(),
          ...metadata
        }
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, thread_id: data.id, data };
  },

  async update(args) {
    const { organizationId, threadId, metadata } = args;
    
    MCPGuardrails.validateOrganizationId(organizationId);
    
    // Get existing metadata
    const { data: thread, error: fetchError } = await supabase
      .from('universal_transactions')
      .select('metadata')
      .eq('id', threadId)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    // Merge metadata
    const updatedMetadata = { ...thread.metadata, ...metadata };

    const { error } = await supabase
      .from('universal_transactions')
      .update({ metadata: updatedMetadata })
      .eq('id', threadId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return { success: true, thread_id: threadId };
  }
};

/**
 * WhatsApp Message Operations
 */
const messageOperations = {
  async send(args) {
    const { organizationId, threadId, direction, text, media, interactive, channelMsgId, cost = 0 } = args;
    
    MCPGuardrails.validateOrganizationId(organizationId);
    
    // Determine smart code
    let smartCode = 'HERA.WHATSAPP.MESSAGE.TEXT.v1';
    if (media) smartCode = 'HERA.WHATSAPP.MESSAGE.MEDIA.v1';
    if (interactive) smartCode = 'HERA.WHATSAPP.MESSAGE.INTERACTIVE.v1';
    
    MCPGuardrails.validateSmartCode(smartCode);

    // Get next line number with proper locking
    // In production, this should use a transaction with SELECT FOR UPDATE
    const { data: lines } = await supabase
      .from('universal_transaction_lines')
      .select('line_number')
      .eq('organization_id', organizationId)
      .eq('transaction_id', threadId)
      .order('line_number', { ascending: false })
      .limit(1);

    const lastLine = lines && lines.length > 0 ? lines[0] : null;
    const nextLineNumber = lastLine ? (lastLine.line_number + 1) : 1;

    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .insert({
        id: uuidv4(),
        organization_id: organizationId,
        transaction_id: threadId,
        line_number: nextLineNumber,
        line_type: 'MESSAGE',
        description: text ? text.substring(0, 255) : 'WhatsApp Message',
        line_amount: cost,
        smart_code: smartCode,
        line_data: {
          direction,
          channel_msg_id: channelMsgId || `wamid.${Date.now()}`,
          text,
          media,
          interactive,
          status: direction === 'outbound' ? 'sent' : 'received',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, message_id: data.id, data };
  },

  async addNote(args) {
    const { organizationId, threadId, noteText, authorEntityId } = args;
    
    MCPGuardrails.validateOrganizationId(organizationId);
    MCPGuardrails.validateSmartCode('HERA.WHATSAPP.NOTE.INTERNAL.v1');

    // Get next line number with proper locking
    // In production, this should use a transaction with SELECT FOR UPDATE
    const { data: lines } = await supabase
      .from('universal_transaction_lines')
      .select('line_number')
      .eq('organization_id', organizationId)
      .eq('transaction_id', threadId)
      .order('line_number', { ascending: false })
      .limit(1);

    const lastLine = lines && lines.length > 0 ? lines[0] : null;
    const nextLineNumber = lastLine ? (lastLine.line_number + 1) : 1;

    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .insert({
        id: uuidv4(),
        organization_id: organizationId,
        transaction_id: threadId,
        line_number: nextLineNumber,
        line_type: 'INTERNAL_NOTE',
        description: noteText.substring(0, 255),
        smart_code: 'HERA.WHATSAPP.NOTE.INTERNAL.v1',
        line_data: {
          text: noteText,
          author_entity_id: authorEntityId,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, note_id: data.id, data };
  }
};

/**
 * Main CLI Handler
 */
async function main() {
  const [,, command, ...args] = process.argv;
  
  if (!command) {
    console.log('Usage: node whatsapp-mcp-cli.js <command> <json-args>');
    console.log('Commands:');
    console.log('  thread.create - Create WhatsApp conversation thread');
    console.log('  thread.update - Update thread metadata');
    console.log('  message.send - Send WhatsApp message');
    console.log('  message.addNote - Add internal note');
    console.log('  query - Query WhatsApp data');
    process.exit(1);
  }

  try {
    // Parse JSON arguments
    const jsonArgs = args[0] ? JSON.parse(args[0]) : {};
    
    // Add default organization ID if not provided
    if (!jsonArgs.organizationId && !jsonArgs.organization_id) {
      jsonArgs.organizationId = DEFAULT_ORG_ID;
    }

    let result;
    
    switch (command) {
      case 'thread.create':
        result = await threadOperations.create(jsonArgs);
        break;
      
      case 'thread.update':
        result = await threadOperations.update(jsonArgs);
        break;
      
      case 'message.send':
        result = await messageOperations.send(jsonArgs);
        break;
      
      case 'message.addNote':
        result = await messageOperations.addNote(jsonArgs);
        break;
      
      case 'query':
        // Safe read operation
        const { table, filters = {}, includeLines = false } = jsonArgs;
        MCPGuardrails.validateTableName(table);
        
        let query = supabase.from(table).select(includeLines ? '*, universal_transaction_lines(*)' : '*');
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        
        const { data, error } = await query;
        if (error) throw error;
        
        result = { success: true, data };
        break;
      
      default:
        throw new Error(`Unknown command: ${command}`);
    }
    
    // Output JSON result
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  threadOperations,
  messageOperations,
  MCPGuardrails
};