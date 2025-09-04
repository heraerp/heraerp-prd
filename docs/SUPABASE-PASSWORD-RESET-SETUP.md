# Supabase Password Reset Setup Guide

This guide explains how to configure password reset functionality in your Supabase project for HERA ERP.

## Prerequisites

1. A Supabase project with authentication enabled
2. Environment variables configured:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Configuration Steps

### 1. Email Templates (Supabase Dashboard)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select **Reset Password** template
4. Update the template with:

```html
<h2>Reset Your Password</h2>
<p>Hello,</p>
<p>You requested to reset your password for your HERA ERP account.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br>The HERA Team</p>
```

### 2. Redirect URLs (Supabase Dashboard)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/reset-password`
   - `https://yourdomain.com/auth/reset-password`
   - `https://*.heraerp.com/auth/reset-password` (for subdomains)

### 3. Email Settings (Optional)

For production, configure custom SMTP:

1. Go to **Project Settings** → **Auth**
2. Under **SMTP Settings**, enable "Custom SMTP"
3. Configure your email provider settings

## How It Works

### User Flow

1. User clicks "Forgot Password" on login page
2. User enters their email address
3. System sends reset email via Supabase
4. User clicks link in email
5. User is redirected to `/auth/reset-password` with recovery token
6. User enters new password
7. Password is updated in Supabase
8. User is redirected to login page

### Technical Flow

```typescript
// 1. Send reset email
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`
})

// 2. Handle password update (on reset page)
await supabase.auth.updateUser({
  password: newPassword
})
```

## Security Considerations

1. **Token Expiry**: Reset links expire after 1 hour
2. **One-Time Use**: Each reset link can only be used once
3. **Session Management**: After password reset, user must log in again
4. **Password Requirements**: Minimum 6 characters (configurable in Supabase)

## Testing

### Local Testing

1. Start your development server: `npm run dev`
2. Navigate to `/auth/forgot-password`
3. Enter a registered email address
4. Check email for reset link
5. Click link and reset password

### Using Supabase Email Logs

1. In Supabase Dashboard, go to **Authentication** → **Logs**
2. Filter by "Email Sent" events
3. You can see all password reset emails sent

## Troubleshooting

### Common Issues

1. **Email not received**
   - Check spam folder
   - Verify email is registered in Supabase
   - Check Supabase email logs

2. **Invalid or expired link**
   - Links expire after 1 hour
   - Ensure redirect URL is correctly configured
   - Check that URL includes proper hash parameters

3. **Password update fails**
   - Ensure password meets requirements (min 6 chars)
   - Check Supabase auth logs for errors
   - Verify user session is valid

### Debug Mode

Add this to your reset password page for debugging:

```typescript
// Log URL parameters
console.log('URL:', window.location.href)
console.log('Hash:', window.location.hash)

// Check session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

## Production Checklist

- [ ] Configure production redirect URLs in Supabase
- [ ] Set up custom SMTP for reliable email delivery
- [ ] Customize email templates with your branding
- [ ] Test the full flow in production environment
- [ ] Monitor Supabase auth logs for issues
- [ ] Set up email delivery monitoring

## Related Files

- `/src/app/auth/forgot-password/page.tsx` - Forgot password form
- `/src/app/auth/reset-password/page.tsx` - Password reset form
- `/src/lib/supabase.ts` - Supabase client configuration