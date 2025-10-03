# HERA DNA SECURITY Testing Guide 🧬🛡️🧪

**Complete guide for testing the HERA DNA SECURITY framework with the salon module demo users.**

## 🚀 Quick Setup

### 1. Create Demo Users
```bash
# Run the demo user creation script
node scripts/create-salon-demo-users.js
```

This creates 6 demo users with different roles and permissions:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Owner** | michele@hairtalkz.com | HairTalkz2024! | Full system access |
| **Manager** | manager@hairtalkz.com | Manager2024! | Operational management |
| **Receptionist** | receptionist@hairtalkz.com | Reception2024! | Front desk operations |
| **Stylist** | stylist@hairtalkz.com | Stylist2024! | Own appointments only |
| **Accountant** | accountant@hairtalkz.com | Accounts2024! | Financial data only |
| **Admin** | admin@hairtalkz.com | Admin2024! | System administration |

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access Salon Module
```
http://localhost:3000/salon/auth
```

## 🧪 Comprehensive Testing Scenarios

### **Scenario 1: Owner Access (Full Permissions)**
**Login:** michele@hairtalkz.com / HairTalkz2024!

**Expected Behavior:**
- ✅ Access to all dashboard widgets (revenue, expenses, profit, staff)
- ✅ Full financial data visibility 
- ✅ POS system access with all features
- ✅ Staff management capabilities
- ✅ Export functionality available
- ✅ All navigation menu items visible

**Test Steps:**
1. Login and verify dashboard shows all financial metrics
2. Navigate to `/salon/finance` - should see all financial data
3. Navigate to `/salon/pos` - should have full POS access
4. Check export buttons are visible and functional
5. Verify audit logs capture all actions

### **Scenario 2: Receptionist Access (Limited Permissions)**
**Login:** receptionist@hairtalkz.com / Reception2024!

**Expected Behavior:**
- ✅ Dashboard shows appointment-focused widgets only
- ❌ Financial data should be hidden or masked (`***`)
- ✅ POS access for customer check-in and basic sales
- ❌ No access to financial reports
- ✅ Customer management features
- ❌ Export functionality not available

**Test Steps:**
1. Login and verify dashboard hides financial widgets
2. Navigate to `/salon/finance` - should show access denied
3. Navigate to `/salon/pos` - should have limited POS features
4. Verify financial data shows `***` instead of actual amounts
5. Check navigation menu shows limited options

### **Scenario 3: Accountant Access (Financial Only)**
**Login:** accountant@hairtalkz.com / Accounts2024!

**Expected Behavior:**
- ✅ Full access to financial dashboard widgets
- ✅ Complete financial data visibility
- ❌ No POS access
- ❌ Limited customer/appointment access
- ✅ Export functionality available
- ✅ VAT and compliance features

**Test Steps:**
1. Login and verify dashboard shows financial-focused widgets
2. Navigate to `/salon/finance` - should see all financial data
3. Navigate to `/salon/pos` - should show access denied
4. Verify export buttons are available
5. Check VAT reports and compliance features work

### **Scenario 4: Stylist Access (Own Data Only)**
**Login:** stylist@hairtalkz.com / Stylist2024!

**Expected Behavior:**
- ✅ Dashboard shows personal appointment widgets only
- ❌ Financial data completely hidden
- ❌ No POS access
- ✅ Own appointments and assigned customers only
- ❌ No staff management access
- ❌ No export functionality

**Test Steps:**
1. Login and verify dashboard shows personal widgets only
2. Navigate to `/salon/finance` - should show access denied
3. Navigate to `/salon/pos` - should show access denied
4. Verify can only see own appointments/customers
5. Check navigation menu is minimal

### **Scenario 5: Security Violation Testing**
**Test unauthorized access attempts across all roles:**

**Test Steps:**
1. **URL Manipulation Test:**
   - Login as Stylist
   - Try to access `/salon/finance` directly
   - Should redirect or show access denied

2. **API Endpoint Testing:**
   - Use browser dev tools to call financial APIs
   - Should receive 403 Forbidden responses

3. **Component Permission Testing:**
   - Inspect React components for hidden elements
   - Financial data should not be present in DOM

4. **Session Hijacking Test:**
   - Login as Owner, copy session token
   - Try to use token from different organization context
   - Should fail with organization mismatch

## 🔒 Security Verification Checklist

### **Multi-Tenant Isolation**
- [ ] Users can only see Hair Talkz salon data
- [ ] No data leakage between organizations
- [ ] Organization ID filtering enforced on all queries
- [ ] Session tokens contain correct organization context

### **Role-Based Access Control (RBAC)**
- [ ] Dashboard widgets filtered by role
- [ ] Navigation menu items filtered by role  
- [ ] API endpoints enforce role permissions
- [ ] Financial data masked for unauthorized roles

### **Audit Trail Verification**
- [ ] All login attempts logged
- [ ] Permission checks logged with smart codes
- [ ] Financial data access logged
- [ ] Failed access attempts logged
- [ ] Audit logs contain confidence scores

### **Real-Time Security Monitoring**
- [ ] Security events appear in real-time
- [ ] Failed login attempts trigger alerts
- [ ] Unauthorized access attempts flagged
- [ ] Session management working correctly

## 🧬 DNA Component Testing

### **Database Context Testing**
```bash
# Check organization filtering is working
SELECT COUNT(*) FROM core_entities WHERE organization_id != '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
# Should return 0 for Hair Talkz users
```

### **Auth Resolver Testing**
Test JWT validation and organization membership:
- Valid JWT with correct org → Access granted
- Valid JWT with wrong org → Access denied  
- Expired JWT → Redirect to login
- Malformed JWT → Access denied

### **Security Middleware Testing**
Test API endpoint protection:
```javascript
// Test API call with different roles
fetch('/api/v2/salon/dashboard', {
  headers: { 'Authorization': 'Bearer <token>' }
})
```

## 🎯 Performance Testing

### **Security Overhead Testing**
- [ ] Page load times with security < 200ms additional overhead
- [ ] API response times with security < 50ms additional overhead
- [ ] Database query performance maintained
- [ ] Memory usage reasonable with security context

### **Concurrent User Testing**
- [ ] Multiple users logged in simultaneously
- [ ] No session conflicts between users
- [ ] Role-based data isolation maintained
- [ ] Performance remains stable

## 🚨 Security Incident Simulation

### **Scenario 1: Insider Threat**
1. Login as Receptionist
2. Attempt to access financial data through multiple vectors:
   - Direct URL access
   - API calls via dev tools
   - Component inspection
   - Local storage manipulation

**Expected:** All attempts blocked and logged

### **Scenario 2: Session Manipulation**
1. Login as valid user
2. Modify session token/cookies
3. Attempt to escalate privileges
4. Try to access other organizations

**Expected:** Session invalidated, access denied

### **Scenario 3: SQL Injection Attempt**
1. Login with malicious input in form fields
2. Try SQL injection patterns in search/filter fields
3. Attempt to bypass organization filtering

**Expected:** Input sanitized, attacks blocked

## 📊 Test Results Documentation

### **Create Test Report**
Document your findings in this format:

```markdown
## HERA DNA SECURITY Test Results

**Date:** [Date]
**Tester:** [Name]
**Version:** [Version]

### Security Tests Passed: ✅/❌
- [ ] Multi-tenant isolation
- [ ] Role-based access control  
- [ ] Audit trail logging
- [ ] Session management
- [ ] API endpoint protection
- [ ] Component-level security

### Performance Impact: ⚡
- Page load time: [X]ms
- API response time: [X]ms  
- Memory usage: [X]MB

### Issues Found: 🐛
1. [Issue description]
2. [Issue description]

### Recommendations: 💡
1. [Recommendation]
2. [Recommendation]
```

## 🔄 Continuous Testing

### **Automated Security Tests**
```bash
# Run security test suite
npm run test:security

# Run specific security tests
npm run test:rbac
npm run test:isolation
npm run test:audit
```

### **Daily Security Verification**
1. Verify demo users still work
2. Check audit logs for anomalies
3. Test role-based access
4. Validate organization isolation

## 🚀 Advanced Testing Scenarios

### **Load Testing with Security**
```bash
# Test 100 concurrent users with different roles
npm run test:load-security
```

### **Penetration Testing**
1. Use security scanning tools
2. Test for OWASP Top 10 vulnerabilities
3. Verify secure headers
4. Test authentication flows

### **Compliance Testing**
- [ ] SOC 2 Type II compliance
- [ ] GDPR privacy controls
- [ ] Data retention policies
- [ ] Audit trail completeness

## 🎯 Success Criteria

**HERA DNA SECURITY is working correctly if:**

✅ **Zero Data Leakage** - Users can only access their organization's data
✅ **Perfect Role Isolation** - Each role sees only permitted data/features  
✅ **Complete Audit Trail** - All security events logged with smart codes
✅ **Real-Time Protection** - Security violations blocked immediately
✅ **Beautiful UX** - Security enhances rather than hinders user experience
✅ **Performance Maintained** - Minimal overhead from security layers

**When all tests pass, you have successfully verified that HERA DNA SECURITY provides bulletproof enterprise-grade security while maintaining the luxury salon user experience!** 🧬🛡️✨