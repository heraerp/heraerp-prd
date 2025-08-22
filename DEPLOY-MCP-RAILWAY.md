# Deploy HERA MCP Server on Railway - Complete Guide

## 🚀 Overview

Deploy a 24/7 AI chatbot server on Railway that:
- Connects to your Supabase-hosted HERA database
- Uses OpenAI for natural language understanding
- Provides REST API for chatbot integration
- Auto-restarts and scales as needed

## 📋 What We've Created

### 1. **MCP Server with REST API** (`mcp-server/hera-mcp-server-api.js`)
- Express.js server with health checks
- OpenAI integration for natural language
- Direct Supabase connection
- CORS enabled for frontend access

### 2. **Docker Configuration** (`mcp-server/Dockerfile`)
- Production-ready Node.js image
- Health check endpoint
- Auto-restart on failure

### 3. **Railway Config** (`mcp-server/railway.toml`)
- Automatic deployment settings
- Health monitoring
- Restart policies

### 4. **React Chatbot Component** (`src/components/chat/HeraChatbot.tsx`)
- Beautiful floating chat widget
- Real-time AI responses
- Multi-tenant aware
- Light/dark theme support

## 🛠️ Step-by-Step Deployment

### Step 1: Prepare Your Code

```bash
# Commit all changes
git add -A
git commit -m "Add MCP server with REST API for Railway deployment"
git push origin main
```

### Step 2: Set Up Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your `heraerp-prd` repository

3. **Configure Service**
   - Railway will detect the Dockerfile
   - Set root directory to `/mcp-server`

### Step 3: Add Environment Variables

In Railway dashboard, add these variables:

```env
# Required - From Supabase
SUPABASE_URL=https://xkqnjzqhzxgrjjgljtxb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-key

# Required - From OpenAI
OPENAI_API_KEY=sk-proj-...your-openai-key

# Optional
DEFAULT_ORGANIZATION_ID=550e8400-e29b-41d4-a716-446655440000
NODE_ENV=production
PORT=3000
```

### Step 4: Deploy

1. Click "Deploy" in Railway
2. Wait for build to complete (~2-3 minutes)
3. Railway will provide a URL like:
   ```
   https://hera-mcp-server-production.up.railway.app
   ```

4. Test the deployment:
   ```bash
   curl https://your-app.up.railway.app/health
   ```

### Step 5: Update Frontend Environment

Add to your `.env.local`:
```env
NEXT_PUBLIC_MCP_API_URL=https://your-app.up.railway.app
```

### Step 6: Add Chatbot to Your App

In any layout or page:
```tsx
import { HeraChatbot } from '@/components/chat/HeraChatbot'

export default function SalonLayout({ children }) {
  return (
    <>
      {children}
      <HeraChatbot 
        position="bottom-right"
        theme="light"
      />
    </>
  )
}
```

## 💬 Natural Language Examples

Your users can now type commands like:

### Customer Management
- "Create a new customer named Sarah Johnson"
- "Show me all VIP customers"
- "Find customer with phone 0501234567"

### Appointments (Salon)
- "Book appointment for Sarah tomorrow at 2pm with Maria"
- "Show today's appointments"
- "Cancel appointment for John Smith"

### Inventory
- "Check stock levels for hair color"
- "Add 10 units of shampoo to inventory"
- "What products are low in stock?"

### Reports
- "Show me today's revenue"
- "What's my best selling service?"
- "Generate monthly report"

## 🔧 Advanced Configuration

### Custom Domain (Optional)
In Railway settings:
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records

### Scaling
Railway auto-scales, but you can:
1. Set min/max instances
2. Configure memory limits
3. Set up horizontal scaling

### Monitoring
1. Railway provides built-in logs
2. Add external monitoring (optional):
   ```javascript
   // In hera-mcp-server-api.js
   app.get('/metrics', (req, res) => {
     res.json({
       uptime: process.uptime(),
       memory: process.memoryUsage(),
       // Add custom metrics
     })
   })
   ```

## 🔒 Security Best Practices

1. **API Key Authentication** (Optional but recommended):
   ```javascript
   // Add to hera-mcp-server-api.js
   const apiKey = req.headers['x-api-key'];
   if (apiKey !== process.env.API_KEY) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

2. **Rate Limiting**:
   ```bash
   npm install express-rate-limit
   ```
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests
   });
   app.use('/api/', limiter);
   ```

3. **CORS Configuration**:
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || '*',
     credentials: true
   }));
   ```

## 🐛 Troubleshooting

### Server Not Starting
- Check logs in Railway dashboard
- Verify all environment variables
- Ensure Dockerfile is correct

### Database Connection Issues
- Verify Supabase URL and key
- Check if service role key (not anon key)
- Test connection locally first

### OpenAI Errors
- Verify API key is active
- Check OpenAI credits/billing
- Monitor rate limits

### CORS Issues
- Update CORS origin in server
- Check frontend API URL
- Use HTTPS in production

## 📊 Cost Estimation

### Railway Pricing
- **Hobby Plan**: $5/month (includes $5 credits)
- **Usage**: ~$0.01/GB RAM/hour
- **Estimated**: $5-10/month for typical usage

### OpenAI Costs
- **GPT-4**: ~$0.03/1K tokens
- **Estimated**: $10-50/month depending on usage

### Total: ~$15-60/month for 24/7 AI chatbot

## 🎉 Success!

You now have:
1. ✅ 24/7 MCP server running on Railway
2. ✅ AI chatbot integrated with OpenAI
3. ✅ Direct connection to Supabase HERA
4. ✅ Beautiful chat UI in your app
5. ✅ Natural language database control

Your users can now interact with HERA using natural language, making complex ERP operations as simple as having a conversation!

## 🚀 Next Steps

1. **Customize AI Responses**: Modify the system prompt in `interpretCommand()`
2. **Add More Operations**: Extend `executeOperation()` with business logic
3. **Train on Your Data**: Fine-tune responses based on your business
4. **Add Voice**: Integrate speech-to-text for voice commands
5. **Multi-language**: Add translation for global users

---

**Remember**: The MCP server respects all SACRED RULES - organization isolation, 6-table architecture, and no dummy data!