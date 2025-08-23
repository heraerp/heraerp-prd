# HERA MCP Chat UI Deployment Guide

## Overview

HERA now includes a comprehensive ChatGPT-style chat interface for natural language interaction with your ERP system. The interface has two modes:
- **Customer Mode**: Simplified UI for business users
- **Internal Mode**: Debug interface for developers with full technical details

## Components Created

### 1. **HeraMCPChat** (`/src/components/chat/HeraMCPChat.tsx`)
Full-featured chat interface with:
- ChatGPT-style conversation UI
- Organization context switching
- Debug information panel
- Performance metrics
- Example prompts
- Copy functionality

### 2. **HeraChatWidget** (`/src/components/chat/HeraChatWidget.tsx`)
Floating chat widget that can be embedded on any page:
- Minimize/maximize functionality
- Configurable position
- Same powerful features in compact form

### 3. **MCP Chat Page** (`/src/app/mcp-chat`)
Dedicated testing page with:
- Tab switching between customer/internal modes
- Performance dashboard
- Command reference

## Quick Start

### 1. Set Environment Variable

Add your Railway MCP server URL to `.env.local`:

```env
NEXT_PUBLIC_MCP_API_URL=https://your-mcp-server.railway.app
```

For local development:
```env
NEXT_PUBLIC_MCP_API_URL=http://localhost:3000
```

### 2. Access the Chat Interface

- **Full Page**: Navigate to `/mcp-chat`
- **Widget Demo**: Navigate to `/demo/chat-widget`

### 3. Embed the Widget

Add to any page in your app:

```tsx
import { HeraChatWidget } from '@/components/chat/HeraChatWidget'

export default function MyPage() {
  return (
    <div>
      {/* Your page content */}
      
      {/* Add chat widget */}
      <HeraChatWidget />
    </div>
  )
}
```

## Configuration Options

### HeraMCPChat Props

```tsx
interface HeraMCPChatProps {
  apiUrl?: string              // MCP server URL
  mode?: 'internal' | 'customer'  // UI mode
  className?: string           // Additional CSS classes
  showDebugInfo?: boolean      // Show debug panel
}
```

### HeraChatWidget Props

```tsx
interface HeraChatWidgetProps {
  apiUrl?: string              // MCP server URL
  position?: 'bottom-right' | 'bottom-left'
  defaultOpen?: boolean        // Start open
  mode?: 'internal' | 'customer'
}
```

## Usage Examples

### Customer Mode
Perfect for business users:
- "Create a new customer named John Smith"
- "Show today's sales summary"
- "Book an appointment for tomorrow"
- "Generate monthly financial report"

### Internal Mode
For developers and testing:
- "Query core_entities where entity_type = 'customer'"
- "Create test transaction with debug info"
- "Show database statistics"
- "Test multi-tenant isolation"

## Features

### Natural Language Processing
- Pattern matching for common commands
- OpenAI integration (when available)
- Fallback to local processing
- Context-aware responses

### Multi-Tenant Support
- Organization context switching
- Perfect data isolation
- Organization ID in all requests

### Debug Information
- Command interpretation details
- Raw API responses
- Performance metrics
- Error details

### User Experience
- Real-time typing indicators
- Message timestamps
- Copy message content
- Keyboard shortcuts (Enter to send)
- Example prompts
- Responsive design

## Troubleshooting

### Chat not connecting?
1. Check MCP server is running
2. Verify `NEXT_PUBLIC_MCP_API_URL` is correct
3. Check browser console for errors
4. Ensure CORS is enabled on MCP server

### Organization not showing?
1. Ensure you're logged in
2. Check `useMultiOrgAuth` hook is working
3. Verify organization data in Supabase

### Commands not working?
1. Check MCP server logs
2. Verify organization ID is being sent
3. Check Supabase credentials in MCP server
4. Test with simple commands first

## Deployment

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy to your platform**:
   - Vercel: `vercel deploy`
   - Railway: Git push triggers auto-deploy
   - Self-hosted: Use PM2 or similar

3. **Verify chat works**:
   - Access `/mcp-chat`
   - Test a simple command
   - Check response times

## Security Notes

- All requests include organization ID for multi-tenant isolation
- MCP server validates all operations
- No direct database access from frontend
- JWT tokens used for authentication
- CORS configured for security

## Next Steps

1. Customize the UI to match your brand
2. Add more example prompts for your use case
3. Implement custom commands in MCP server
4. Add analytics tracking
5. Create user training materials

The HERA MCP Chat UI provides a powerful, user-friendly interface for natural language interaction with your ERP system, making complex operations accessible to all users!