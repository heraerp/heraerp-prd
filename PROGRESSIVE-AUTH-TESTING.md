# Progressive Authentication Testing Guide

## Overview

The HERA Progressive Authentication system allows users to start using the application immediately in anonymous mode and gradually upgrade their workspace by providing email and registration details.

## Testing Scenarios

### 1. Anonymous Mode Testing

**What to test:**
- User can access dashboard without any login
- Workspace is created with 30-day expiration
- Sample data is available
- User can create and modify data

**Steps:**
1. Clear browser storage (localStorage, cookies)
2. Navigate to http://localhost:3000
3. Should be redirected to dashboard automatically
4. Check for "Guest" user name in dashboard
5. Verify ProgressiveBanner shows "Try HERA free for 30 days"

### 2. Email Verification Testing

**What to test:**
- User can save workspace with email
- Workspace extends to 365 days
- Email verification process works
- User state changes to "identified"

**Steps:**
1. From anonymous mode, click "Save your work" in ProgressiveBanner
2. Enter email address
3. Submit form
4. Check that workspace is extended
5. Verify banner now shows "Complete registration"

### 3. Full Registration Testing

**What to test:**
- User can complete registration
- Supabase account is created
- Workspace migrates from temporary to permanent
- User state changes to "registered"

**Steps:**
1. From identified state, click "Complete registration"
2. Fill in:
   - Full name
   - Password
   - Business name
   - Business type
3. Submit registration
4. Check email for confirmation
5. Verify full access after email confirmation

### 4. Login Flow Testing

**What to test:**
- Existing users can login
- Progressive banner doesn't show for registered users
- Workspace data persists after login

**Steps:**
1. Navigate to /login
2. Enter registered user credentials
3. Submit login form
4. Verify redirect to dashboard
5. Check user name and organization display correctly

## Test Files

### 1. Browser-based Test Suite
**File:** `test-progressive-auth.html`
- Open in browser: `open test-progressive-auth.html`
- Interactive testing with visual feedback
- Tests all progressive auth endpoints

### 2. Node.js Test Script
**File:** `test-progressive-auth.js`
- Run: `node test-progressive-auth.js`
- Automated testing of API endpoints
- Requires development server running

### 3. Simple Logic Test
**File:** `test-progressive-auth-simple.js`
- Run: `node test-progressive-auth-simple.js`
- Tests auth logic without server
- Good for unit testing

## API Endpoints

### GET /api/v1/auth/progressive
Returns current workspace status

### POST /api/v1/auth/progressive
Actions:
- `initialize_anonymous` - Create anonymous workspace
- `save_with_email` - Save workspace with email
- `register` - Complete registration
- `login` - Login existing user

## Expected Behaviors

### Anonymous User
- Can access all features with sample data
- Sees "Guest" as username
- Gets 30-day workspace
- Sees upgrade prompts in banner

### Identified User (Email Only)
- Has 365-day workspace
- Email is saved but no password
- Can still use all features
- Sees "Complete registration" prompts

### Registered User
- Full Supabase authentication
- Permanent workspace
- No upgrade prompts
- Full business profile

## Common Issues & Solutions

### Issue: Workspace not persisting
**Solution:** Check localStorage for `hera_workspace` key

### Issue: Banner not showing
**Solution:** Verify ProgressiveBanner is in layout.tsx

### Issue: Can't create data in anonymous mode
**Solution:** Check that Universal API accepts workspace ID header

### Issue: Registration fails
**Solution:** Verify Supabase configuration in .env.local

## Testing Checklist

- [ ] Anonymous mode creates 30-day workspace
- [ ] Sample data loads for anonymous users
- [ ] Email save extends to 365 days
- [ ] Registration creates Supabase account
- [ ] Login works for existing users
- [ ] Progressive banner shows correct state
- [ ] Workspace data persists across sessions
- [ ] API endpoints return correct responses
- [ ] Error handling works properly
- [ ] Mobile responsive design works

## Manual Testing Steps

1. **Fresh Start Test**
   - Clear all browser data
   - Visit homepage
   - Verify anonymous workspace created
   - Check dashboard access

2. **Progressive Upgrade Test**
   - Start anonymous
   - Save with email
   - Complete registration
   - Verify each state transition

3. **Returning User Test**
   - Close browser after creating workspace
   - Reopen and visit site
   - Verify workspace restored
   - Check expiration date correct

4. **Error Handling Test**
   - Try invalid email formats
   - Test duplicate email registration
   - Verify error messages display

## Success Criteria

✅ Users can start using app immediately without registration
✅ Workspace persists across browser sessions
✅ Email verification extends workspace lifetime
✅ Full registration creates permanent account
✅ Progressive banner guides users through upgrade path
✅ All auth states handle correctly
✅ Error messages are user-friendly
✅ Mobile experience is smooth