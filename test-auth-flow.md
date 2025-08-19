# Test Authentication Flow

## 1. Access Protected Route
Navigate to: http://localhost:3007/salon/customers

Expected: Should redirect to login page

## 2. Login Page
URL: http://localhost:3007/auth/login

Use demo credentials:
- Email: demo@hera.com
- Password: demo123

Expected: Should login and redirect to salon dashboard

## 3. Customer Page with User Context
After login, go to: http://localhost:3007/salon/customers

Expected:
- Page should load without authentication error
- Header should show "Demo User" and "HERA Software Inc"
- Customer data should load using the organization ID from user context
- Should see 8 test customers with all their data

## 4. Verify Organization Context
The page should:
- Use organization ID from logged-in user (44d2d8f8-167d-46a7-a704-c0e5435863d6)
- Show only data for that organization
- Display user name and organization in header

## Key Implementation Details

### Authentication Flow:
1. Middleware checks for Supabase session
2. Redirects to login if not authenticated
3. Login creates Supabase session
4. User context hook fetches organization from user entity
5. Customer page uses organization ID for all API calls

### User Entity Structure:
```json
{
  "entity_type": "user",
  "entity_name": "Demo User",
  "entity_code": "USER-demo@hera.com",
  "metadata": {
    "supabase_id": "12807b35-2e87-455e-8273-f8995d48f033",
    "organization_id": "44d2d8f8-167d-46a7-a704-c0e5435863d6",
    "organization_name": "HERA Software Inc"
  }
}
```

### Dynamic User Fields:
- role: admin
- department: Management
- phone: (555) 100-0001
- timezone: America/New_York