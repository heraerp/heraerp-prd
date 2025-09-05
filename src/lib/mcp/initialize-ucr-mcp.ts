/**
 * Initialize UCR MCP Server
 * This ensures the MCP server is ready when the app starts
 */

import { ucrMCPServer } from './ucr-mcp-server'

let initialized = false

export function initializeUCRMCP() {
  if (initialized) {
    return
  }

  try {
    // The server is already instantiated, just mark as initialized
    console.log('[UCR MCP] Server initialized and ready')
    initialized = true
  } catch (error) {
    console.error('[UCR MCP] Failed to initialize:', error)
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  initializeUCRMCP()
}