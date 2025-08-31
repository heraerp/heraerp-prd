# HERA Analytics MCP - Quick Start Guide 🚀

## 1. Start the Analytics Chat

```bash
# Terminal 1: Start Next.js if not running
npm run dev

# Terminal 2: Open Analytics Chat
open http://localhost:3000/analytics-chat
```

## 2. Try These Queries

### 📊 Revenue Analysis
```
Show revenue this month
```
Expected: Revenue summary with transaction count and average

```
Why did revenue spike last week?
```
Expected: Weekly breakdown showing trends

### 👥 Customer Analytics
```
Find VIP customers
```
Expected: List of 3 VIP clients with loyalty tiers

```
Show customers who spent over $3000
```
Expected: High-value customer list

### 💰 Financial Queries
```
Calculate total sales by payment method
```
Expected: Breakdown of cash vs card vs mobile payments

```
Show transaction trends
```
Expected: Time-based aggregation of transactions

### 🔍 Smart Code Queries
```
Validate smart code HERA.SALON.CLIENT.PROFILE.v1
```
Expected: Shows code is valid, current version

```
Search for inventory smart codes
```
Expected: List of inventory-related codes

### 🚨 Test Guardrails
```
Query customers without organization
```
Expected: ORG_FILTER_MISSING error with correction

```
Create unbalanced journal entry
```
Expected: GL_UNBALANCED error with explanation

## 3. Understanding Responses

### Success Response Format:
```
💰 Revenue for this_month: $2,414.60
📊 Transactions: 13
💵 Average: $185.74
```

### Error Response Format:
```
❌ Organization ID is required for all queries
Guardrail: ORG_FILTER_MISSING
Correction: Add "organization_id" to your request
```

### Aggregated Data Display:
Results appear in tables with:
- Time periods
- Counts and sums
- Grouped metrics

## 4. Advanced Queries

### Multi-Dimensional Analysis:
```
Compare revenue by service type and staff member
```

### Time-Based Comparisons:
```
Show this month vs last month revenue
```

### Predictive Questions:
```
When should we reorder inventory based on usage patterns?
```

### Business Intelligence:
```
What's our customer retention rate?
```

## 5. Tips

1. **Be Specific**: "Show revenue" → "Show revenue this month by service"
2. **Use Time Frames**: Always specify periods (today, this week, last month)
3. **Ask Why**: The AI can analyze trends and suggest reasons
4. **Test Guardrails**: Try invalid queries to see security in action

## 6. Integration with Salon Chat

You can switch between:
- **Salon Chat** (`/salon-chat`): Operational queries (appointments, inventory)
- **Analytics Chat** (`/analytics-chat`): Business intelligence and analysis

Both use the same universal 6-table architecture! 🧠