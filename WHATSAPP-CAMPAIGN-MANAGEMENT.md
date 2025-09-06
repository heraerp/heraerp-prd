# HERA WhatsApp Campaign Management Guide

## 🎯 Campaign Keywords System

HERA's WhatsApp integration now includes intelligent campaign keyword handling for customer acquisition from ads.

## Campaign Keywords

### Booking Keywords
- **BOOK** - General booking request
- **HAIR** - Hair service inquiry
- **NAILS** - Nail service inquiry  
- **APPOINTMENT** - Appointment booking

### Promotional Keywords
- **PROMO** - Current promotions
- **OFFER** - Special offers

## 📱 Customer Acquisition Flow

### 1. Ad Campaign Setup

Create ads with specific call-to-actions:

**Facebook/Instagram Ad Examples:**
```
💇‍♀️ Transform Your Look!
Send HAIR to WhatsApp: +971 50 123 4567
```

```
💅 Perfect Nails Await!
Text NAILS to get 20% off your first visit
WhatsApp: +971 50 123 4567
```

```
🎉 Limited Time Offer!
Send PROMO to see this week's specials
WhatsApp: +971 50 123 4567
```

### 2. Automatic Response System

#### HAIR Keyword Response:
```
Hi! Welcome to Hair Talkz! 💇‍♀️

I see you're interested in our hair services! I'd be happy to help you book an appointment. What service are you interested in?

✂️ Haircut
💆‍♀️ Hair Treatment
💅 Manicure/Pedicure
💄 Makeup

Please reply with your choice!
```

#### NAILS Keyword Response:
```
Hi! Welcome to Hair Talkz! 💇‍♀️

Looking for the perfect manicure? You've come to the right place! I'd be happy to help you book an appointment. What service are you interested in?

✂️ Haircut
💆‍♀️ Hair Treatment
💅 Manicure/Pedicure
💄 Makeup

Please reply with your choice!
```

#### PROMO/OFFER Response:
```
🎉 Special Offers at Hair Talkz!

💇‍♀️ 20% off on Hair Treatments this week
💅 Buy 2 Get 1 Free on Manicures
💄 Bridal Makeup Package at special rates

Would you like to book any of these services? Just reply with your choice!
```

### 3. Campaign Source Tracking

The system automatically tracks the campaign source in the database:

```typescript
// Stored in core_dynamic_data
{
  entity_id: conversationId,
  field_name: 'campaign_source',
  field_value_text: 'HAIR', // First keyword used
  smart_code: 'HERA.MARKETING.CAMPAIGN.SOURCE.v1'
}
```

## 📊 Campaign Analytics

### Track Campaign Performance

```sql
-- Campaign conversion report
SELECT 
  dd.field_value_text as campaign_keyword,
  COUNT(DISTINCT dd.entity_id) as total_conversations,
  COUNT(DISTINCT a.id) as appointments_booked,
  ROUND(COUNT(DISTINCT a.id)::numeric / COUNT(DISTINCT dd.entity_id) * 100, 2) as conversion_rate
FROM core_dynamic_data dd
LEFT JOIN core_entities c ON c.id = dd.entity_id
LEFT JOIN universal_transactions a ON a.metadata->>'conversation_id' = c.id 
  AND a.transaction_type = 'appointment'
WHERE dd.field_name = 'campaign_source'
  AND dd.created_at >= NOW() - INTERVAL '30 days'
GROUP BY dd.field_value_text
ORDER BY total_conversations DESC;
```

### Daily Campaign Report

```sql
-- Daily campaign activity
SELECT 
  DATE(dd.created_at) as date,
  dd.field_value_text as campaign,
  COUNT(*) as new_conversations
FROM core_dynamic_data dd
WHERE dd.field_name = 'campaign_source'
  AND dd.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(dd.created_at), dd.field_value_text
ORDER BY date DESC, new_conversations DESC;
```

## 🎯 Best Practices

### 1. Keyword Selection
- Use action words (BOOK, GET, SAVE)
- Keep keywords short and memorable
- Avoid similar keywords across campaigns
- Test keyword variations

### 2. Ad Creative Guidelines
- Make WhatsApp CTA prominent
- Show the keyword clearly
- Include the phone number
- Use emojis to draw attention

### 3. Response Optimization
- Personalize based on keyword
- Keep initial response under 160 characters
- Include clear next steps
- Use buttons/lists for choices

### 4. Follow-up Strategy
- Respond within 1 minute
- Use AI for conversational flow
- Track drop-off points
- A/B test response messages

## 🔧 Technical Implementation

### Adding New Keywords

Edit `/src/app/api/v1/whatsapp/webhook/route.ts`:

```typescript
// Add to booking keywords
if (upperText.includes('BOOK') || upperText.includes('HAIR') || 
    upperText.includes('NAILS') || upperText.includes('APPOINTMENT') ||
    upperText.includes('NEWKEYWORD')) {
  // Booking flow
}

// Add to promotional keywords  
if (upperText.includes('PROMO') || upperText.includes('OFFER') ||
    upperText.includes('DISCOUNT')) {
  // Promotional flow
}
```

### Custom Response by Industry

```typescript
// Restaurant keywords
const restaurantKeywords = ['TABLE', 'RESERVATION', 'MENU', 'DELIVERY'];

// Healthcare keywords
const healthcareKeywords = ['DOCTOR', 'APPOINTMENT', 'CHECKUP', 'CONSULT'];

// Retail keywords
const retailKeywords = ['SHOP', 'BUY', 'SALE', 'CATALOG'];
```

## 📈 ROI Measurement

### Campaign Cost vs Revenue

```sql
-- Calculate ROI by campaign
WITH campaign_costs AS (
  SELECT 
    campaign_keyword,
    SUM(ad_spend) as total_spend
  FROM marketing_campaigns
  GROUP BY campaign_keyword
),
campaign_revenue AS (
  SELECT 
    dd.field_value_text as campaign_keyword,
    SUM(t.total_amount) as total_revenue
  FROM core_dynamic_data dd
  JOIN universal_transactions t ON t.metadata->>'conversation_id' = dd.entity_id
  WHERE dd.field_name = 'campaign_source'
    AND t.transaction_type = 'payment'
  GROUP BY dd.field_value_text
)
SELECT 
  c.campaign_keyword,
  c.total_spend,
  COALESCE(r.total_revenue, 0) as total_revenue,
  ROUND((COALESCE(r.total_revenue, 0) - c.total_spend) / c.total_spend * 100, 2) as roi_percentage
FROM campaign_costs c
LEFT JOIN campaign_revenue r ON c.campaign_keyword = r.campaign_keyword
ORDER BY roi_percentage DESC;
```

## 🚀 Advanced Features

### 1. Multi-Language Keywords

```typescript
const keywordMappings = {
  'BOOK': ['BOOK', 'RESERVAR', 'حجز', 'बुक'],
  'HAIR': ['HAIR', 'PELO', 'شعر', 'बाल'],
  'PROMO': ['PROMO', 'OFERTA', 'عرض', 'प्रस्ताव']
};
```

### 2. Time-Based Campaigns

```typescript
// Weekend special keywords
if (isWeekend() && upperText.includes('WEEKEND')) {
  responseMessage = "🎉 Weekend Special! 30% off all services...";
}

// Holiday campaigns
if (isHoliday() && upperText.includes('HOLIDAY')) {
  responseMessage = "🎄 Holiday Offer! Gift vouchers available...";
}
```

### 3. Location-Based Targeting

```typescript
// Check user's location from WhatsApp profile
if (userLocation.includes('Dubai') && upperText.includes('DUBAI')) {
  responseMessage = "Welcome to our Dubai branch! Special local offers...";
}
```

## 📱 Testing Campaigns

### Test Checklist
1. ✅ Send each keyword to verify response
2. ✅ Check campaign tracking in database
3. ✅ Verify conversation flow continues
4. ✅ Test appointment booking completion
5. ✅ Confirm analytics tracking
6. ✅ Check multi-language support

### Debug Commands

```bash
# Check recent campaign messages
curl https://heraerp.com/api/v1/whatsapp/test

# View campaign sources
SELECT * FROM core_dynamic_data 
WHERE field_name = 'campaign_source' 
ORDER BY created_at DESC LIMIT 10;
```

## 🎨 Campaign Templates

### Social Media Ad Template
```
[Eye-catching image]

🌟 Transform Your Look Today! 🌟

✨ Professional stylists
⏰ Flexible appointments  
💅 Premium products
📍 Prime location

💬 WhatsApp us now!
Send [KEYWORD] to +971 50 123 4567

#HairSalon #Beauty #Dubai
```

### Google Ads Template
```
Headline 1: Book Salon Appointment
Headline 2: WhatsApp Booking Available
Description: Send BOOK to our WhatsApp +971501234567 for instant appointment booking. Professional stylists, premium services.
```

## 📊 Success Metrics

### Key Performance Indicators
- **Response Rate**: % of keywords that get responses
- **Conversation Rate**: % that continue beyond first message
- **Booking Rate**: % that complete appointment booking
- **Revenue per Conversation**: Average transaction value
- **Customer Lifetime Value**: Tracked from first keyword

### Benchmark Targets
- Response Rate: >95%
- Conversation Rate: >60%
- Booking Rate: >25%
- ROI: >300%

## 🔮 Future Enhancements

1. **AI-Powered Keyword Suggestions**
   - Analyze successful campaigns
   - Suggest optimal keywords
   - Predict performance

2. **Dynamic Response Generation**
   - Personalize based on time of day
   - Adjust for inventory/availability
   - Include user history

3. **Cross-Channel Attribution**
   - Track customer journey across channels
   - Unified campaign reporting
   - Multi-touch attribution

---

**Last Updated**: December 2024
**Version**: 1.0
**Smart Code**: HERA.DOCS.WHATSAPP.CAMPAIGN.v1