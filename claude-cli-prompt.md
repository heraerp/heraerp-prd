# HERA Authentication Components Implementation - Claude CLI Prompt

## Project Context
You are implementing a complete authentication system for HERA (Universal Business Platform) that connects to an existing API running on port 3001. The system uses a revolutionary 6-table universal database architecture and needs React components for user authentication, registration, and dashboard.

## Architecture Overview
- **Backend API**: Running on `http://localhost:3001/api/v1`
- **Database**: 6-table universal schema with multi-tenant isolation
- **Frontend**: React components with Tailwind CSS
- **Authentication**: JWT tokens with Supabase integration

## Required Implementation

### 1. File Structure to Create
```
src/
├── components/
│   └── auth/
│       ├── AuthProvider.jsx
│       ├── LoginForm.jsx
│       ├── RegistrationWizard.jsx
│       ├── Dashboard.jsx
│       └── index.js
├── hooks/
│   └── useAuth.js
└── App.jsx (updated)
```

### 2. API Endpoints to Integrate
The components must integrate with these existing endpoints:

**Authentication Endpoints:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login  
- `GET /api/v1/auth/me` - Get user context
- `GET /api/v1/auth/organization` - Get organization context

**Request/Response Formats:**

**Registration Request:**
```json
{
  "email": "mario@restaurant.com",
  "password": "securepass123",
  "full_name": "Mario Rossi",
  "business_name": "Mario's Italian Restaurant",
  "business_type": "restaurant"
}
```

**Login Request:**
```json
{
  "email": "mario@restaurant.com",
  "password": "securepass123"
}
```

**Expected Response Format:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "mario@restaurant.com",
    "full_name": "Mario Rossi",
    "role": "owner"
  },
  "organization": {
    "id": "uuid",
    "organization_name": "Mario's Italian Restaurant",
    "organization_type": "restaurant"
  }
}
```

### 3. Component Requirements

#### AuthProvider Component
- Create React Context for authentication state
- Manage JWT token in localStorage
- Provide login, register, logout functions
- Handle token validation and refresh
- Expose user and organization data

#### LoginForm Component
- Email and password input fields
- Form validation and error handling
- Loading states during authentication
- Link to registration
- Demo credentials display
- Responsive design with Tailwind CSS

#### RegistrationWizard Component
- 3-step registration process:
  1. Personal Information (name, email, password)
  2. Business Information (business name, type selection)
  3. Confirmation and submission
- Business type options:
  - 🍕 Restaurant & Food Service
  - 🏥 Healthcare & Medical
  - 🏭 Manufacturing & Production
  - 💼 Professional Services
  - 🛒 Retail & E-commerce
  - 🏢 Real Estate
- Progress indicator
- Form validation
- Error handling

#### Dashboard Component
- Welcome header with user name
- Organization information display
- Quick stats cards (entities, transactions, total value)
- Getting started guide
- API connection status
- Logout functionality
- Navigation structure

### 4. Technical Requirements

#### State Management
- Use React Context for global auth state
- localStorage for JWT token persistence
- Proper error handling and loading states

#### Styling
- Use Tailwind CSS classes
- Responsive design (mobile-first)
- Consistent color scheme:
  - Primary: Blue (#3b82f6) to Indigo (#6366f1)
  - Success: Green (#10b981)
  - Error: Red (#ef4444)
  - Warning: Amber (#f59e0b)

#### API Integration
- Use fetch API for HTTP requests
- Proper error handling for network failures
- JWT token in Authorization headers
- Handle 401 unauthorized responses

#### Form Validation
- Required field validation
- Email format validation
- Password confirmation matching
- Real-time validation feedback

### 5. Implementation Steps

#### Step 1: Create AuthProvider
```javascript
// Key functions needed:
- login(email, password)
- register(userData)
- logout()
- fetchUserContext()
- Token management
- Loading states
```

#### Step 2: Create LoginForm
```javascript
// Key features needed:
- Form state management
- Submit handler
- Error display
- Link to registration
- Demo credentials
- Loading spinner
```

#### Step 3: Create RegistrationWizard
```javascript
// Key features needed:
- Multi-step form logic
- Form data state
- Business type selection
- Progress indicator
- Validation per step
- Final submission
```

#### Step 4: Create Dashboard
```javascript
// Key features needed:
- User/organization display
- Stats cards
- Getting started section
- Navigation structure
- Logout handler
```

#### Step 5: Integration
```javascript
// Key integration points:
- Wrap App with AuthProvider
- Route protection
- Automatic token validation
- Error boundary handling
```

### 6. Testing Requirements

#### Manual Testing Checklist
- [ ] Registration flow works end-to-end
- [ ] Login with demo credentials: `mario@restaurant.com / securepass123`
- [ ] JWT token stored and retrieved correctly
- [ ] User context loaded on page refresh
- [ ] Organization data displayed properly
- [ ] Logout clears all data
- [ ] Error handling for invalid credentials
- [ ] Loading states display correctly
- [ ] Responsive design works on mobile

#### API Integration Testing
```bash
# Test registration
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test User","business_name":"Test Business","business_type":"restaurant"}'

# Test login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test protected endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/v1/auth/me
```

### 7. Error Handling Requirements

#### Network Errors
- Display user-friendly messages
- Handle connection failures
- Retry mechanisms where appropriate

#### API Errors
- Parse and display server error messages
- Handle validation errors
- 401/403 permission errors

#### Form Errors
- Real-time field validation
- Clear error messages
- Error state styling

### 8. Performance Requirements

#### Optimization
- Minimize re-renders with proper dependency arrays
- Lazy load components where possible
- Efficient token validation

#### User Experience
- Loading states for all async operations
- Smooth transitions between steps
- Proper focus management

### 9. Security Requirements

#### Token Management
- Secure localStorage usage
- Automatic token cleanup on logout
- Handle expired tokens gracefully

#### Form Security
- No sensitive data in logs
- Proper password field handling
- CSRF protection awareness

### 10. Success Criteria

#### Functional Requirements
- ✅ User can register new business account
- ✅ User can login with credentials
- ✅ JWT token properly managed
- ✅ Dashboard shows user/organization context
- ✅ All forms validate properly
- ✅ Error states handled gracefully

#### Technical Requirements
- ✅ Components are reusable and modular
- ✅ Code follows React best practices
- ✅ Responsive design works across devices
- ✅ API integration follows REST conventions
- ✅ Error handling is comprehensive

#### Integration Requirements
- ✅ Works with existing HERA API on port 3001
- ✅ Respects multi-tenant architecture
- ✅ Maintains JWT token security
- ✅ Integrates with 6-table universal schema

## Implementation Notes

### Environment Variables
Ensure these are set:
```
REACT_APP_API_URL=http://localhost:3001/api/v1
```

### Dependencies to Install
```bash
npm install
# No additional dependencies needed - using built-in fetch and React hooks
```

### File Organization
- Keep components focused and single-responsibility
- Extract custom hooks for reusable logic
- Use proper TypeScript if project uses it
- Follow existing project structure

### Code Quality
- Use meaningful variable names
- Add proper comments for complex logic
- Follow consistent formatting
- Handle edge cases properly

## Deliverables

1. **Complete Auth Components** - All components working with API
2. **Integration Guide** - How to integrate into existing app
3. **Testing Report** - Verification that all features work
4. **Documentation** - Usage examples and API integration notes

## Getting Started Command

```bash
# 1. Ensure HERA API is running on port 3001
curl http://localhost:3001/health

# 2. Create the component files in your React project
# 3. Import and integrate into your App.jsx
# 4. Test the complete authentication flow
# 5. Verify API integration works correctly
```

This implementation should provide a complete, production-ready authentication system that seamlessly integrates with the HERA Universal API architecture.