# Supabase Redirect URLs Configuration

## Required Redirect URLs for Password Reset

### For Local Development
Add these URLs in your Supabase Dashboard under **Authentication → URL Configuration → Redirect URLs**:

```
http://localhost:3000/auth/reset-password
http://localhost:3000/auth/reset-password#
http://localhost:3000/auth/callback
http://localhost:3000
```

### For Production
Add these URLs (replace `yourdomain.com` with your actual domain):

```
https://yourdomain.com/auth/reset-password
https://yourdomain.com/auth/reset-password#
https://yourdomain.com/auth/callback
https://yourdomain.com
https://app.heraerp.com/auth/reset-password
https://app.heraerp.com/auth/reset-password#
https://*.heraerp.com/auth/reset-password
```

## Why These URLs?

1. **`/auth/reset-password`** - The main reset password page
2. **`/auth/reset-password#`** - Supabase appends parameters after the hash
3. **`/auth/callback`** - General auth callback handler
4. **Root URL** - For general redirects

## How to Add Redirect URLs in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** in the left sidebar
4. Click on **URL Configuration**
5. In the **Redirect URLs** section, add each URL on a new line
6. Click **Save**

## Testing Email Links Locally

### Option 1: Using Supabase Email Previews (Recommended for Testing)

1. In Supabase Dashboard, go to **Authentication → Logs**
2. Find the "Email Sent" event for your password reset
3. Click on the event to see details
4. Look for the `html_body` field and find the reset link
5. Copy the full URL including all parameters after the `#`

### Option 2: Using a Local Email Service

1. Install [MailHog](https://github.com/mailhog/MailHog) or similar:
   ```bash
   # Mac
   brew install mailhog
   brew services start mailhog
   
   # Or using Docker
   docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```

2. Configure Supabase to use local SMTP (in Supabase Dashboard):
   - SMTP Host: `localhost`
   - SMTP Port: `1025`
   - SMTP User: (leave empty)
   - SMTP Pass: (leave empty)

3. Access MailHog UI at `http://localhost:8025`

### Option 3: Using Inbucket (Alternative)

1. Run Inbucket using Docker:
   ```bash
   docker run -p 2500:2500 -p 1100:1100 -p 9000:9000 inbucket/inbucket
   ```

2. Configure SMTP in Supabase:
   - SMTP Host: `localhost`
   - SMTP Port: `2500`

3. View emails at `http://localhost:9000`

## Example Reset Link Format

A typical Supabase password reset link looks like this:

```
http://localhost:3000/auth/reset-password#access_token=eyJhbGciOiJ...&refresh_token=v6BOXn...&expires_in=3600&token_type=bearer&type=recovery
```

The important parameters after the `#`:
- `access_token` - The recovery token
- `refresh_token` - For session refresh
- `type=recovery` - Indicates this is a password recovery link
- `expires_in` - Token expiration time in seconds

## Troubleshooting

### "Invalid or expired reset link" Error

1. **Check Redirect URLs**: Ensure all URLs above are added in Supabase
2. **Token Expiry**: Links expire after 1 hour
3. **URL Format**: Make sure the full URL with hash parameters is used
4. **Browser Issues**: Try copying the link to a different browser

### Email Not Received

1. Check spam/junk folder
2. Verify email exists in Supabase Auth Users
3. Check Supabase email logs for errors
4. For production, ensure SMTP is properly configured

### Testing Tips

1. **Quick Test**: Use Supabase Logs to get the reset link directly
2. **Full Test**: Use a local email catcher like MailHog
3. **Debug Mode**: Check browser console for URL parsing logs

## Security Note

Never share or log the actual access tokens. The debug logs in the code only show if tokens are present, not their values.