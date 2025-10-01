# LinkedIn Integration Quick Start

## Current Status: Demo Mode Ready ✅

The LinkedIn integration is fully implemented and works in demo mode without requiring real LinkedIn API credentials.

## How to Test

### Option 1: Using the UI (Recommended)

1. **Navigate to Integrations Page**
   ```
   http://localhost:3000/civicflow/communications/integrations
   ```

2. **Click "Connect" on LinkedIn Card**
   - The system will automatically create a demo connection
   - You'll see "Connected" status with a green badge

3. **Test Features**
   - Click "Sync Now" to simulate data sync
   - Click "Configure Mapping" to see field mappings
   - View sync status and history

### Option 2: Using Test Button (Development Only)

In development mode, you'll see a "Test LinkedIn Connection" button that:
- Verifies environment setup
- Creates a demo connector
- Shows detailed console logs

### Option 3: Direct API Testing

```bash
# Check your setup
curl http://localhost:3000/api/integrations/test-auth

# Create LinkedIn connection
curl -X POST http://localhost:3000/api/integrations/linkedin/auth/callback \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: 8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77" \
  -d '{"demo": true}'
```

## What Works in Demo Mode

✅ **OAuth Flow Simulation**
- Simulates the complete OAuth authentication process
- Creates connector entity with demo credentials

✅ **Organization Profile Sync**
- Demo organization: "CivicFlow Demo Organization"
- 15,000 followers, Dubai location
- Complete profile with logo and description

✅ **Events Management**
- 3 sample events with different formats (in-person, virtual, hybrid)
- Attendee tracking with RSVPs
- Event analytics

✅ **Social Posts**
- Create and manage social media posts
- Engagement metrics (likes, comments, shares)
- Post scheduling capabilities

✅ **Analytics Dashboard**
- Follower growth tracking
- Engagement rate metrics
- Post performance analytics

## Technical Implementation

### Smart Code Patterns
```
HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.CONNECTOR.v1    # Connector entity
HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.SYNC.v1     # Organization sync
HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.SYNC.v1   # Event sync
HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.CREATE.v1  # Post creation
```

### Data Storage (Sacred Six Tables)
- **core_entities**: Connectors, organizations, events, attendees
- **core_relationships**: Event→Attendee, Organization→Event links
- **core_dynamic_data**: OAuth tokens, custom fields, metadata
- **universal_transactions**: Sync operations, API calls
- **universal_transaction_lines**: Sync details, batch operations

### Field Mappings
All LinkedIn data fields are mapped to HERA's universal schema:
- Organization fields → core_dynamic_data
- Event details → core_entities + core_dynamic_data
- Attendee info → core_entities with relationships
- Posts → universal_transactions

## Troubleshooting

### Common Issues

1. **"Organization ID is null"**
   - The system automatically uses CivicFlow demo org
   - Check localStorage for `heraerp_org_id`

2. **"Failed to create connector entity"**
   - Check server logs for smart code validation errors
   - Ensure SUPABASE_SERVICE_ROLE_KEY is set

3. **500 Internal Server Error**
   - Open browser console for detailed error
   - Check Network tab for API response

### Environment Variables (Optional for Demo)
```bash
# Not required for demo mode, but needed for production
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/integrations/linkedin/auth/callback
```

## Next Steps

1. **Test Demo Mode First**
   - Verify everything works with simulated data
   - Understand the data flow and UI

2. **Production Setup** (When Ready)
   - Register LinkedIn app at https://www.linkedin.com/developers/apps
   - Add environment variables
   - Update callback route for real OAuth
   - Implement webhook handlers

3. **Extend Functionality**
   - Add more sync types (comments, reactions)
   - Implement real-time webhooks
   - Add advanced analytics

## Support

- Check `/docs/integrations/TROUBLESHOOTING.md` for detailed debugging
- View `/docs/integrations/LINKEDIN-SETUP.md` for production setup
- See `/docs/HERA-UNIVERSAL-SOCIAL-CONNECTOR-PATTERN.md` for architecture