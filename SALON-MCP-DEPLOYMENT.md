# HERA Salon MCP - Production Deployment Guide

## 🚀 Railway Deployment Instructions

### Overview
HERA Salon MCP is a web-based Model Context Protocol implementation that provides intelligent salon management capabilities through natural language processing and tool-based AI interactions.

### Architecture
- **Web API Integration**: MCP tools exposed through `/api/v1/salon/mcp` endpoint
- **Claude AI Integration**: Natural language understanding with tool selection
- **Universal HERA Architecture**: Leverages 6-table system for all operations
- **Real-time Analytics**: Revenue, inventory, and performance tracking

### Deployment Steps

#### 1. Environment Variables (Set in Railway Dashboard)
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Optional (for AI fallback)
OPENAI_API_KEY=your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key

# Organization
DEFAULT_ORGANIZATION_ID=550e8400-e29b-41d4-a716-446655440000
```

#### 2. Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Deploy
railway up
```

#### 3. Database Setup
Run these scripts after deployment to set up salon data:
```bash
# SSH into Railway instance or run locally with production env
node mcp-server/setup-salon-data.js
node mcp-server/create-test-transactions.js  # Optional: for demo data
```

### Available MCP Tools

#### 1. **check_inventory**
- Check product stock levels
- Identify low stock items
- Filter by product name

#### 2. **book_appointment**
- Create appointments with natural language
- Automatic staff assignment
- Smart scheduling

#### 3. **check_revenue**
- Revenue analytics by period (today, week, month)
- Service breakdown
- Transaction insights

#### 4. **staff_performance**
- Commission calculations
- Performance metrics
- Top performer identification

#### 5. **find_quiet_times**
- Identify promotional opportunities
- Analyze booking patterns
- Optimize scheduling

### API Endpoints

#### Web MCP Endpoint
```typescript
POST /api/v1/salon/mcp
{
  "message": "show revenue this month",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "useClaude": true  // Enable AI understanding
}
```

#### Direct Tool Execution (Optional)
```typescript
POST /api/v1/salon/tools/execute
{
  "tool": "check_revenue",
  "args": { "period": "this_month" },
  "organizationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Frontend Integration

#### Salon Chat Interface
- Located at `/salon-chat`
- Real-time conversation with MCP backend
- Automatic tool selection based on queries

#### Example Usage
```javascript
// In your React component
const response = await fetch('/api/v1/salon/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userInput,
    organizationId: currentOrg.id,
    useClaude: true
  })
})

const data = await response.json()
// Display data.message to user
```

### Natural Language Examples

Users can interact naturally:
- "Check hair color stock" → Inventory tool
- "Show revenue this month" → Revenue analytics
- "Book Emma for highlights tomorrow at 2pm" → Appointment booking
- "Calculate commission this week" → Staff performance
- "Find quiet times for promotions" → Marketing opportunities

### Production Considerations

#### 1. **Rate Limiting**
- Implement rate limiting for AI calls
- Cache common queries
- Use pattern matching fallback when AI quota exceeded

#### 2. **Security**
- Always validate organization_id
- Use Row Level Security (RLS)
- Sanitize user inputs
- Validate tool parameters

#### 3. **Performance**
- Use database indexes on frequently queried fields
- Implement response caching for analytics
- Batch similar requests
- Use connection pooling

#### 4. **Monitoring**
- Track tool usage metrics
- Monitor AI API costs
- Log error rates
- Set up alerts for failures

### Troubleshooting

#### Common Issues

1. **"Organization not found"**
   - Verify DEFAULT_ORGANIZATION_ID is set
   - Check organization exists in database

2. **"AI not responding"**
   - Check ANTHROPIC_API_KEY is valid
   - Verify API quota available
   - Fallback to pattern matching

3. **"No inventory data"**
   - Run setup-salon-data.js
   - Verify products have stock levels in dynamic data

4. **"Revenue shows $0"**
   - Create test transactions
   - Check transaction dates are in query period
   - Verify transaction_status is 'completed' or 'paid'

### Cost Optimization

1. **AI Usage**
   - Use pattern matching for common queries
   - Cache AI responses for similar questions
   - Batch tool calls when possible

2. **Database**
   - Use proper indexes
   - Optimize queries with pagination
   - Archive old transactions

3. **Hosting**
   - Use Railway's autoscaling
   - Configure health checks
   - Set resource limits

### Future Enhancements

1. **Additional Tools**
   - SMS/email notifications
   - Automated marketing campaigns
   - Loyalty program management
   - Advanced analytics

2. **AI Improvements**
   - Multi-language support
   - Voice input/output
   - Predictive analytics
   - Custom model fine-tuning

3. **Integration Options**
   - WhatsApp Business API
   - Google Calendar sync
   - Payment gateway integration
   - CRM synchronization

### Support

For issues or questions:
1. Check logs in Railway dashboard
2. Review HERA documentation in `/docs`
3. Test tools individually via API
4. Verify database schema matches HERA universal architecture

---

## Success Metrics

After deployment, you should see:
- ✅ Revenue tracking working with real transactions
- ✅ Inventory management with stock alerts
- ✅ Natural language appointment booking
- ✅ Staff performance analytics
- ✅ AI-powered responses to queries

The system is designed to handle thousands of queries per day with proper caching and optimization.