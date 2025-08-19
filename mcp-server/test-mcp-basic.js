#!/usr/bin/env node

async function testBasicMCP() {
  try {
    console.log('Testing basic MCP setup...');
    
    // Dynamic imports for new SDK
    const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    const { z } = await import("zod");
    
    console.log('✅ MCP SDK imports successful');
    
    // Create MCP server with new API
    const server = new McpServer({
      name: "test-server",
      version: "1.0.0"
    });
    
    console.log('✅ Server instance created');
    
    // Register a basic tool
    server.registerTool("test-tool",
      {
        title: "Test Tool",
        description: "A test tool",
        inputSchema: { message: z.string() }
      },
      async ({ message }) => ({
        content: [{ type: "text", text: `Echo: ${message}` }]
      })
    );
    
    console.log('✅ Tool registered');
    
    // Try to create transport (this might be where the error occurs)
    const transport = new StdioServerTransport();
    console.log('✅ Transport created');
    
    // Don't actually connect - just test setup
    console.log('✅ All basic MCP components working with new SDK!');
    
  } catch (error) {
    console.error('❌ Error during MCP setup:', error);
    console.error('Stack trace:', error.stack);
  }
}

testBasicMCP();