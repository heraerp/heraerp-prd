#!/usr/bin/env ts-node

/**
 * HERA DNA SDK Generator
 * Generates type-safe SDK functions that only call MCP
 */

import * as fs from 'fs';
import * as path from 'path';

// const CONFIG = require('../hera.dna.json');

interface MCPTool {
  name: string;
  params: string[];
  returns: string;
}

// MCP tool definitions based on CLAUDE.md
const MCP_TOOLS: MCPTool[] = [
  {
    name: 'create-entity',
    params: ['entity_type', 'entity_name', 'smart_code', 'organization_id'],
    returns: 'CoreEntity'
  },
  {
    name: 'create-transaction',
    params: ['transaction_type', 'transaction_code', 'smart_code', 'organization_id', 'amount'],
    returns: 'UniversalTransaction'
  },
  {
    name: 'set-dynamic-field',
    params: ['entity_id', 'field_name', 'field_value', 'smart_code', 'organization_id'],
    returns: 'CoreDynamicData'
  },
  {
    name: 'create-relationship',
    params: ['from_entity_id', 'to_entity_id', 'relationship_type', 'smart_code', 'organization_id'],
    returns: 'CoreRelationship'
  },
  {
    name: 'query-universal',
    params: ['table', 'filters', 'organization_id', 'smart_code'],
    returns: 'Array<any>'
  }
];

function generateSDKFunctions(): string {
  // Determine which imports are needed
  const usedTypes = new Set<string>();
  usedTypes.add('OrganizationId');
  usedTypes.add('SmartCode');
  usedTypes.add('DNAResponse');
  
  MCP_TOOLS.forEach(tool => {
    tool.params.forEach(param => {
      const type = getParamType(param);
      if (type !== 'string' && type !== 'number' && !type.includes('Record')) {
        usedTypes.add(type);
      }
    });
    if (tool.returns && !tool.returns.includes('Array')) {
      usedTypes.add(tool.returns);
    }
  });

  const imports = `
/**
 * Generated HERA DNA SDK Functions
 * Auto-generated from MCP tools - DO NOT EDIT
 */

import {
  ${Array.from(usedTypes).sort().join(',\n  ')}
} from '../src/types';

// MCP client interface (to be implemented)
interface MCPClient {
  call<T>(tool: string, params: any): Promise<T>;
}

let mcpClient: MCPClient;

export function initializeMCP(client: MCPClient): void {
  mcpClient = client;
}
`;

  const functions = MCP_TOOLS.map(tool => {
    const funcName = tool.name.replace(/-/g, '_');
    const params = tool.params.map(p => {
      const type = getParamType(p);
      return `${p}: ${type}`;
    }).join(', ');

    return `
/**
 * ${tool.name} - MCP-backed SDK function
 */
export async function ${funcName}(${params}): Promise<DNAResponse<${tool.returns}>> {
  if (!mcpClient) {
    throw new Error('MCP client not initialized. Call initializeMCP first.');
  }

  // Validate inputs
  ${generateValidation(tool.params)}

  try {
    const result = await mcpClient.call<${tool.returns}>('${tool.name}', {
      ${tool.params.map(p => p).join(',\n      ')}
    });

    return {
      success: true,
      data: result,
      smartCode: smart_code as SmartCode,
      organizationId: organization_id as OrganizationId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      smartCode: smart_code as SmartCode,
      organizationId: organization_id as OrganizationId
    };
  }
}`;
  }).join('\n');

  return imports + functions;
}

function getParamType(param: string): string {
  switch (param) {
    case 'organization_id':
      return 'OrganizationId';
    case 'smart_code':
      return 'SmartCode';
    case 'entity_id':
    case 'from_entity_id':
    case 'to_entity_id':
      return 'EntityId';
    case 'transaction_id':
      return 'TransactionId';
    case 'table':
      return 'SacredTable';
    case 'amount':
    case 'field_value':
      return 'number';
    case 'filters':
      return 'Record<string, any>';
    default:
      return 'string';
  }
}

function generateValidation(params: string[]): string {
  return params.map(param => {
    switch (param) {
      case 'organization_id':
        return `if (!organization_id) throw new Error('Organization ID is required');`;
      case 'smart_code':
        return `if (!smart_code) throw new Error('Smart code is required');`;
      case 'entity_id':
      case 'from_entity_id':
      case 'to_entity_id':
        return `if (!${param}) throw new Error('${param} is required');`;
      default:
        return `if (!${param}) throw new Error('${param} is required');`;
    }
  }).join('\n  ');
}

// Generate the SDK
const outputDir = path.join(__dirname, '..', 'generated');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sdkContent = generateSDKFunctions();
fs.writeFileSync(path.join(outputDir, 'sdk-functions.ts'), sdkContent);

console.log('✅ HERA DNA SDK generated successfully');
console.log(`📁 Output: ${outputDir}/sdk-functions.ts`);
console.log(`🔧 Generated ${MCP_TOOLS.length} type-safe functions`);