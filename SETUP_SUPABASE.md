# Setting up Supabase for HERA Tender Management

## Quick Setup Guide

The tender management system requires a real Supabase connection to work. Follow these steps:

### 1. Create a Supabase Project (if you don't have one)
- Go to https://app.supabase.com
- Create a new project
- Wait for the project to be ready (takes ~2 minutes)

### 2. Get Your API Keys
- Go to Settings → API in your Supabase dashboard
- Copy the following values:
  - **Project URL**: Something like `https://your-project-id.supabase.co`
  - **Anon/Public Key**: A long string starting with `eyJ...`

### 3. Update Your .env File
Replace the dummy values in your `.env` file with your actual Supabase credentials:

```bash
# Replace these with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 4. Restart Your Development Server
```bash
npm run dev
```

### 5. Test the Connection
Visit: http://localhost:3000/api/v1/tender/test-connection

You should see:
```json
{
  "success": true,
  "tests": {
    "supabase_configured": true,
    "query_success": true
  }
}
```

## Troubleshooting

### "TypeError: Failed to fetch" or Service Worker Issues
If you see network errors, it might be due to service workers interfering:

**Quick Fix:**
1. Visit http://localhost:3000/unregister-sw.html
2. This will automatically clean up service workers
3. You'll be redirected to the tender management page

**Manual Fix:**
1. Open Chrome DevTools (F12)
2. Go to Application → Service Workers
3. Click "Unregister" on any service workers
4. Clear site data: Application → Storage → Clear site data

### "Supabase not configured"
This error means Supabase is not properly configured. Check:
1. Your .env file has real values (not dummy/placeholder values)
2. The development server was restarted after updating .env
3. Your Supabase project is active and running

### "Supabase not configured" Error
This means the Universal API detected dummy values. Update your .env file with real credentials.

## Alternative: Use MCP Server
If you prefer to use the MCP server approach mentioned in CLAUDE.md:
```bash
cd mcp-server
npm install
npm start
```
Then use the CLI tools directly without needing the web UI.