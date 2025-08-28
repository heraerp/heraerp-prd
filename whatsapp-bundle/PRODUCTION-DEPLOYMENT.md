# WhatsApp Enterprise - Production Deployment Guide

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] All TypeScript errors resolved
- [x] Build passes without errors
- [x] No console.log statements in production code
- [x] Error handling implemented
- [x] Loading states for all async operations

### ✅ Security
- [x] Environment variables used for sensitive data
- [x] Multi-tenant isolation verified
- [x] Input sanitization implemented
- [x] CORS configuration ready
- [x] Rate limiting prepared

### ✅ Performance
- [x] Background refresh without UI blocking
- [x] Optimized re-renders
- [x] Lazy loading for components
- [x] Efficient data fetching
- [x] Proper pagination ready

## Environment Variables for Production

```env
# WhatsApp Business API (Required)
WHATSAPP_PHONE_NUMBER_ID=your_production_phone_id
WHATSAPP_ACCESS_TOKEN=your_production_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=secure_random_string

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Default Organization (Optional - for testing)
DEFAULT_ORGANIZATION_ID=your_default_org_id

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.heraerp.com
```

## Deployment Steps

### 1. Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add WHATSAPP_PHONE_NUMBER_ID production
vercel env add WHATSAPP_ACCESS_TOKEN production
vercel env add WHATSAPP_WEBHOOK_VERIFY_TOKEN production
```

### 2. Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### 3. Docker Deployment

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

## WhatsApp Business Configuration

### 1. Configure Webhook
- URL: `https://yourdomain.com/api/v1/whatsapp/webhook`
- Verify Token: Use the value from `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Subscribe to fields: `messages`, `message_status`

### 2. Configure Phone Number
- Set display name
- Upload profile picture
- Set business description
- Configure business hours

### 3. Create Message Templates
```javascript
// Appointment Confirmation
{
  "name": "appointment_confirmation",
  "language": "en",
  "category": "TRANSACTIONAL",
  "components": [{
    "type": "BODY",
    "text": "Hi {{1}}, your {{2}} appointment is confirmed for {{3}} at {{4}}."
  }]
}
```

## Production URLs

### Public Endpoints
- Landing: `https://app.heraerp.com`
- Auth: `https://app.heraerp.com/auth/login`

### WhatsApp Interfaces (Authenticated)
- Desktop: `https://app.heraerp.com/whatsapp-desktop`
- Enterprise: `https://app.heraerp.com/enterprise/whatsapp`
- API Base: `https://app.heraerp.com/api/v1/whatsapp`

### Webhook Endpoint
- Webhook: `https://app.heraerp.com/api/v1/whatsapp/webhook`

## Database Migrations

No database migrations required! HERA's universal 6-table architecture handles everything.

Ensure these tables exist:
- `core_organizations`
- `core_entities`
- `core_dynamic_data`
- `core_relationships`
- `universal_transactions`
- `universal_transaction_lines`

## Monitoring & Alerts

### 1. Set Up Monitoring
```javascript
// Monitor these metrics
- Message delivery rate
- Response time (< 2s target)
- Error rate (< 0.1% target)
- 24-hour window violations
- Webhook processing time
```

### 2. Configure Alerts
- Failed message delivery > 5%
- API response time > 3s
- Webhook failures
- Database connection errors

## Security Hardening

### 1. Webhook Verification
```typescript
// Verify webhook signatures
const signature = req.headers['x-hub-signature-256']
const expectedSignature = crypto
  .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex')
  
if (signature !== `sha256=${expectedSignature}`) {
  return res.status(401).json({ error: 'Invalid signature' })
}
```

### 2. Rate Limiting
```typescript
// Implement rate limiting
const rateLimit = {
  messages: '1000/hour/user',
  webhooks: '10000/hour',
  api: '100/minute/ip'
}
```

### 3. Input Validation
- Sanitize all message content
- Validate phone numbers
- Check file sizes and types
- Verify organization context

## Performance Optimization

### 1. Caching Strategy
- Cache conversation list (5 min)
- Cache user profiles (30 min)
- Cache message templates (1 hour)

### 2. Database Indexes
```sql
-- Already handled by Supabase RLS policies
-- Ensure these indexes exist:
CREATE INDEX idx_transactions_org_date ON universal_transactions(organization_id, transaction_date);
CREATE INDEX idx_entities_org_type ON core_entities(organization_id, entity_type);
```

### 3. CDN Configuration
- Static assets via Vercel CDN
- Image optimization enabled
- Gzip compression active

## Rollback Plan

### Quick Rollback
```bash
# Vercel
vercel rollback

# Manual
git checkout <previous-commit>
npm run build
npm start
```

### Data Recovery
- All messages stored in universal tables
- Point-in-time recovery available
- No data migration required

## Post-Deployment Verification

### 1. Functional Tests
- [ ] Send test message
- [ ] Receive message
- [ ] Check status updates
- [ ] Test template message
- [ ] Verify 24-hour window
- [ ] Test file upload

### 2. Performance Tests
- [ ] Page load < 2s
- [ ] Message send < 1s
- [ ] Search response < 500ms
- [ ] Auto-refresh smooth

### 3. Security Tests
- [ ] Multi-tenant isolation
- [ ] Webhook signature
- [ ] Rate limiting active
- [ ] HTTPS only

## Support Contacts

### Emergency Contacts
- DevOps: devops@heraerp.com
- Security: security@heraerp.com
- WhatsApp API: Use Meta Business Support

### Documentation
- HERA Docs: https://docs.heraerp.com
- WhatsApp API: https://developers.facebook.com/docs/whatsapp

## Final Notes

This WhatsApp implementation is production-ready with:
- ✅ Enterprise-grade security
- ✅ Multi-tenant architecture
- ✅ Real-time performance
- ✅ Complete audit trail
- ✅ HERA universal compliance

Deploy with confidence! 🚀