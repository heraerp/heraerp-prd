#!/usr/bin/env node

// HERA Salon MCP Server - Real Model Context Protocol Implementation
// Following the MCP specification for tool-based AI interactions

require('dotenv').config();
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Import our universal handlers
const universalHandler = require('./hera-universal-salon-handler');
const salonTools = require('./salon-tools');

class HeraSalonMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'hera-salon-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'check_inventory',
          description: 'Check salon product inventory levels',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization UUID'
              },
              productName: {
                type: 'string',
                description: 'Specific product name to check (optional)'
              }
            },
            required: ['organizationId']
          }
        },
        {
          name: 'book_appointment',
          description: 'Book a salon appointment for a client',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization UUID'
              },
              clientName: {
                type: 'string',
                description: 'Name of the client'
              },
              serviceName: {
                type: 'string',
                description: 'Service requested (e.g., haircut, highlights, color)'
              },
              dateTime: {
                type: 'string',
                description: 'Appointment date and time (ISO format)'
              }
            },
            required: ['organizationId', 'clientName', 'serviceName', 'dateTime']
          }
        },
        {
          name: 'check_staff_availability',
          description: 'Check which staff members are available',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization UUID'
              },
              dateTime: {
                type: 'string',
                description: 'Date/time to check availability (optional)'
              }
            },
            required: ['organizationId']
          }
        },
        {
          name: 'check_revenue',
          description: 'Calculate revenue for a specific time period',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization UUID'
              },
              period: {
                type: 'string',
                enum: ['today', 'this_week', 'this_month', 'last_month', 'custom'],
                description: 'Time period for revenue calculation'
              },
              startDate: {
                type: 'string',
                description: 'Start date for custom period (ISO format)'
              },
              endDate: {
                type: 'string',
                description: 'End date for custom period (ISO format)'
              }
            },
            required: ['organizationId', 'period']
          }
        },
        {
          name: 'analyze_services',
          description: 'Analyze service performance and popularity',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization UUID'
              },
              period: {
                type: 'string',
                enum: ['today', 'this_week', 'this_month'],
                description: 'Analysis period'
              }
            },
            required: ['organizationId', 'period']
          }
        },
        {
          name: 'staff_performance',
          description: 'Analyze staff performance metrics',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization UUID'
              },
              staffId: {
                type: 'string',
                description: 'Specific staff member ID (optional)'
              },
              period: {
                type: 'string',
                enum: ['today', 'this_week', 'this_month'],
                description: 'Performance period'
              }
            },
            required: ['organizationId', 'period']
          }
        },
        {
          name: 'find_quiet_times',
          description: 'Find quiet times for promotional opportunities',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization UUID'
              },
              daysAhead: {
                type: 'number',
                description: 'How many days ahead to check (default: 7)'
              }
            },
            required: ['organizationId']
          }
        },
        {
          name: 'natural_language_query',
          description: 'Process natural language salon requests',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization UUID'
              },
              query: {
                type: 'string',
                description: 'Natural language query'
              }
            },
            required: ['organizationId', 'query']
          }
        }
      ]
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        switch (name) {
          case 'check_inventory':
            result = await universalHandler.checkInventory(
              args.organizationId,
              args.productName
            );
            break;

          case 'book_appointment':
            result = await universalHandler.createAppointment(
              args.organizationId,
              {
                clientName: args.clientName,
                serviceName: args.serviceName,
                dateTime: new Date(args.dateTime)
              }
            );
            break;

          case 'check_staff_availability':
            const staff = await universalHandler.universalQuery(
              args.organizationId,
              universalHandler.SALON_ENTITY_TYPES.STAFF,
              { status: 'active' }
            );
            result = {
              success: true,
              staff: staff.map(s => ({
                id: s.id,
                name: s.entity_name,
                specialties: s.fields.specialties || 'All services'
              })),
              count: staff.length
            };
            break;

          case 'check_revenue':
            result = await salonTools.checkRevenue(args);
            break;

          case 'analyze_services':
            result = await salonTools.analyzeServices(args);
            break;

          case 'staff_performance':
            result = await salonTools.staffPerformance(args);
            break;

          case 'find_quiet_times':
            result = await salonTools.findQuietTimes(args);
            break;

          case 'natural_language_query':
            result = await universalHandler.handleSalonRequest(
              args.query,
              args.organizationId
            );
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error.message,
                tool: name
              })
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('HERA Salon MCP Server running...');
  }
}

// Start the server
if (require.main === module) {
  const server = new HeraSalonMCPServer();
  server.run().catch(console.error);
}

module.exports = HeraSalonMCPServer;