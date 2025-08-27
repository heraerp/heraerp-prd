# 📋 WhatsApp Integration - Production Deployment Checklist

## 🔐 Security & Authentication

- [ ] **Generate Permanent Access Token**
  - Go to Meta App Dashboard > WhatsApp > Permanent Token
  - Store securely in environment variables
  - Never commit to version control

- [ ] **Configure Webhook Signature Validation**
  ```typescript
  // Add to webhook route.ts
  const signature = request.headers.get('x-hub-signature-256')
  const isValid = validateWebhookSignature(body, signature, APP_SECRET)
  ```

- [ ] **Set Up Rate Limiting**
  - Implement request throttling
  - Handle WhatsApp rate limits (1000 msgs/sec)

## 🌐 Infrastructure

- [ ] **Production URL Setup**
  - Configure HTTPS with valid SSL certificate
  - Update `NEXT_PUBLIC_SITE_URL` in production
  - Ensure webhook URL is publicly accessible

- [ ] **Database Optimization**
  - Add indexes on frequently queried fields:
    ```sql
    CREATE INDEX idx_whatsapp_conversations ON core_entities(entity_type, entity_code) 
    WHERE entity_type = 'whatsapp_conversation';
    
    CREATE INDEX idx_whatsapp_messages ON universal_transactions(transaction_type, created_at) 
    WHERE transaction_type = 'whatsapp_message';
    ```

- [ ] **Monitoring & Logging**
  - Set up error tracking (Sentry/Rollbar)
  - Configure webhook failure alerts
  - Monitor message delivery rates

## 📱 WhatsApp Configuration

- [ ] **Verify Business Account**
  - Complete Meta Business verification
  - Submit display name for approval
  - Upload business documents if required

- [ ] **Phone Number Setup**
  - Migrate from test to production number
  - Verify number ownership
  - Set up two-step verification

- [ ] **Message Templates**
  ```bash
  # Create production templates
  - appointment_reminder_24h
  - appointment_reminder_2h
  - appointment_confirmation
  - welcome_message
  - service_menu
  ```

## 🚀 Deployment Steps

### 1. Pre-Deployment
- [ ] Run all tests: `npm test`
- [ ] Test webhook locally: `node test-whatsapp-webhook.js`
- [ ] Backup existing data
- [ ] Review security configurations

### 2. Deploy Application
```bash
# Example for Vercel
vercel --prod

# Example for custom server
git push production main
npm run build
pm2 restart salon-app
```

### 3. Update Webhook URL
- [ ] Go to Meta App Dashboard
- [ ] Update webhook URL to production
- [ ] Verify webhook with new URL
- [ ] Test with real message

### 4. Configure Automation
```bash
# Set up cron jobs for reminders
crontab -e

# Add reminder job (every 30 minutes)
*/30 * * * * cd /app && node mcp-server/send-whatsapp-reminders.js >> /logs/reminders.log 2>&1
```

## ✅ Post-Deployment Verification

### Functionality Tests
- [ ] Send test message from customer number
- [ ] Book appointment via WhatsApp
- [ ] Check reminder system
- [ ] Test staff commands
- [ ] Verify dashboard updates

### Performance Tests
- [ ] Message response time < 2 seconds
- [ ] Webhook processing < 500ms
- [ ] Dashboard loads < 3 seconds
- [ ] Concurrent message handling

### Business Tests
- [ ] Greeting messages work
- [ ] Quick replies respond correctly
- [ ] Booking flow completes
- [ ] Cancellation works
- [ ] Staff can check in clients

## 📊 Monitoring Setup

### Key Metrics to Track
```javascript
// Add to monitoring dashboard
const metrics = {
  totalMessages: 'COUNT(whatsapp_messages)',
  bookingConversion: 'bookings / total_conversations',
  responseTime: 'AVG(response_time)',
  deliveryRate: 'delivered / sent',
  activeConversations: 'COUNT(DISTINCT conversation_id)'
}
```

### Alerts to Configure
- [ ] Webhook failures > 5 in 5 minutes
- [ ] API rate limit approaching
- [ ] Message delivery < 90%
- [ ] Response time > 5 seconds
- [ ] Error rate > 1%

## 🔧 Maintenance Plan

### Daily
- Check message delivery rates
- Monitor active conversations
- Review error logs

### Weekly
- Analyze booking conversion
- Review customer feedback
- Update quick replies
- Check staff usage

### Monthly
- Review conversation analytics
- Update greeting messages
- Optimize response templates
- Train staff on new features

## 📱 Customer Communication

### Launch Announcement Template
```
🎉 Exciting News!

You can now book appointments via WhatsApp!

Simply send us a message:
📱 +971 XX XXX XXXX

You can:
✅ Book appointments
✅ Check availability
✅ View services & prices
✅ Manage your bookings
✅ Get instant confirmations

Save our number and say "Hi" to get started!
```

### Staff Training Guide
```
WhatsApp Commands for Staff:

📅 "schedule" - View your appointments
✅ "check in [name]" - Mark client arrived
☕ "break" - Mark yourself unavailable
📊 "stats" - See your performance
❓ "help" - List all commands

Try it now by sending "schedule" to our WhatsApp!
```

## 🚨 Rollback Plan

If issues occur:
1. Revert webhook URL to previous version
2. Disable WhatsApp integration in admin
3. Restore from backup if needed
4. Notify team via emergency channel

## ✅ Sign-Off

- [ ] Technical Lead Approval
- [ ] Business Owner Approval
- [ ] Customer Support Briefed
- [ ] Staff Training Complete
- [ ] Documentation Updated

---

**Launch Date**: ___________
**Launched By**: ___________
**Version**: 1.0.0