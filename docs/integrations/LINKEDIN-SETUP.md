# LinkedIn Integration Setup Guide

## Where to Add LinkedIn API Credentials

### 1. Environment Variables (.env.local)

Add these LinkedIn API credentials to your `.env.local` file:

```bash
# LinkedIn OAuth App Credentials
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/integrations/linkedin/auth/callback

# Optional: LinkedIn API Version
LINKEDIN_API_VERSION=v2
```

### 2. LinkedIn App Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app or select existing app
3. Configure OAuth 2.0 settings:
   - Redirect URLs: Add `http://localhost:3000/api/integrations/linkedin/auth/callback`
   - OAuth 2.0 scopes needed:
     - `r_organization_social` - Read organization data
     - `w_organization_social` - Write organization posts
     - `rw_organization_admin` - Manage organization events
     - `r_events` - Read events data

### 3. Update LinkedIn Adapter Configuration

The LinkedIn adapter is already configured in `/src/lib/integration/vendors/linkedin.ts` but you need to update the OAuth URLs if using production:

```typescript
// For production OAuth (currently demo mode only)
private getOAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID || '',
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI || '',
    state: this.generateState(),
    scope: 'r_organization_social w_organization_social rw_organization_admin r_events'
  })
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`
}
```

### 4. Testing the Integration

The LinkedIn integration currently works in **demo mode** without real API credentials:

1. Navigate to: http://localhost:3000/civicflow/communications/integrations
2. Click "Connect" on the LinkedIn card
3. The demo mode will create a simulated connection with sample data

### 5. Production Implementation

To enable real LinkedIn API integration, you'll need to:

1. **Update the auth callback** (`/src/app/api/integrations/linkedin/auth/callback/route.ts`):
   - Remove the automatic demo mode redirect
   - Implement the OAuth token exchange
   - Store real tokens securely

2. **Update the adapter** (`/src/lib/integration/vendors/linkedin.ts`):
   - Remove demo mode checks in API methods
   - Use real LinkedIn API endpoints
   - Implement proper authentication headers

3. **Add API rate limiting**:
   - LinkedIn has strict rate limits
   - Implement exponential backoff
   - Cache responses where appropriate

### 6. Current Demo Mode Features

The LinkedIn integration in demo mode provides:
- ✅ OAuth flow simulation
- ✅ Organization profile sync
- ✅ Events sync (sample data)
- ✅ Attendees management
- ✅ Social posts creation
- ✅ Analytics dashboard

### 7. Security Considerations

- Never commit API credentials to version control
- Use environment variables for all secrets
- Implement token refresh logic for OAuth
- Encrypt stored tokens in database
- Use HTTPS in production

### 8. Troubleshooting

If you see a 500 error:
1. Check the browser console for detailed errors
2. Verify all smart codes match the HERA pattern
3. Ensure organization_id is properly set
4. Check that all required fields are present in API calls

### 9. Next Steps

To complete the production LinkedIn integration:
1. Register your app with LinkedIn
2. Add environment variables
3. Update the callback route for production OAuth
4. Test with real LinkedIn account
5. Implement webhook handlers for real-time updates