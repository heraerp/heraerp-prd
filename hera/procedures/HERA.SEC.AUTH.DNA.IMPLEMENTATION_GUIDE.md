# HERA Authorization DNA - Step-by-Step Implementation Guide

This guide follows the HERA procedure template pattern with User Control Required (UCR) checkpoints.

## 🎯 Objective
Implement HERA Authorization DNA pattern for demo user authentication with proper identity bridge and multi-tenant isolation.

---

## Step 1: Platform Organization Setup
**UCR: Confirm Platform Creation**

### Action:
```bash
cd mcp-server
node create-platform-production.js
```

### Expected Output:
```
✅ Platform organization created: 00000000-0000-0000-0000-000000000000
✅ Platform System User created with ID: xxx-xxx-xxx
✅ Smart codes validated: HERA.SEC.PLATFORM.SYSTEM.USER.v1
```

### User Verification:
- [ ] Platform org shows in database?
- [ ] System user entity created?
- [ ] Smart codes are valid?

**🛑 STOP - User confirms before proceeding**

---

## Step 2: Generate Demo User Infrastructure
**UCR: Select Demo Types to Generate**

### Options:
1. `salon-receptionist` - For salon/beauty industry
2. `restaurant-manager` - For restaurant/hospitality
3. `healthcare-provider` - For healthcare/medical

### Action:
```bash
cd mcp-server
# User selects which to generate:
node hera-auth-dna-generator.js generate salon
node hera-auth-dna-generator.js generate restaurant  # optional
node hera-auth-dna-generator.js generate healthcare # optional
```

### Expected Output:
```
✅ Demo user created: demo|salon-receptionist
✅ Organization anchor created for Hair Talkz Salon
✅ Membership relationship established
✅ Expiration set: 30 minutes from now
```

### User Verification:
- [ ] Which industries need demo users?
- [ ] Confirm organization IDs are correct?
- [ ] Verify memberships created?

**🛑 STOP - User confirms demo types generated**

---

## Step 3: Deploy Authentication Provider
**UCR: Review and Approve Auth Implementation**

### Files to Review:
1. `/src/components/auth/HERAAuthProvider.tsx`
2. `/src/lib/auth/demo-auth-service.ts`
3. `/src/lib/auth/demo-session-bridge.ts`

### Key Features:
- Cookie name: `hera-demo-session` (with hyphens)
- Auto-session restoration
- Legacy compatibility via `useMultiOrgAuth`
- Session expiry handling

### User Verification:
- [ ] Cookie naming consistent?
- [ ] Session management acceptable?
- [ ] Error handling sufficient?

**🛑 STOP - User approves auth provider code**

---

## Step 4: Server-Side API with RLS Bypass
**UCR: Approve Security Configuration**

### Security Implications:
- Uses `SUPABASE_SERVICE_ROLE_KEY` for RLS bypass
- Only for demo user operations
- Auto-extends expired sessions
- No real user data access

### File: `/src/app/api/v1/demo/initialize/route.ts`

### User Verification:
- [ ] Understand RLS bypass implications?
- [ ] Approve auto-extension behavior?
- [ ] Confirm demo-only scope?

**🛑 STOP - User confirms security approach**

---

## Step 5: Test Demo Authentication Flow
**UCR: Verify Expected Behavior**

### Test Steps:
1. Navigate to `http://localhost:3000/demo`
2. Click "Salon App" (or other configured demo)
3. Observe redirect to `/salon/dashboard`
4. Check browser console for debug logs
5. Verify organization data loads

### Browser Console Checks:
```javascript
// Check cookie
document.cookie  // Should show: hera-demo-session=...

// Check auth state (if using debug component)
// Should show organization and user info
```

### User Verification:
- [ ] Demo selection works?
- [ ] Redirect successful?
- [ ] Dashboard loads data?
- [ ] Session expires after 30 min?

**🛑 STOP - User confirms demo works correctly**

---

## Step 6: Migration Strategy
**UCR: Approve Phased Rollout Plan**

### Phase 1: Parallel Deployment (Current State)
- HERAAuthProvider exists alongside MultiOrgAuthProvider
- Redirect file maintains compatibility
- No breaking changes

### Phase 2: Gradual Migration (Next)
```bash
# Find all files using old auth
grep -r "useMultiOrgAuth" src/ --include="*.tsx" --include="*.ts"
# Shows ~17 files to update
```

### Phase 3: Update Imports (Future)
```typescript
// Old
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

// New  
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
```

### Phase 4: Cleanup (Final)
- Remove MultiOrgAuthProvider-old.tsx
- Remove compatibility exports
- Update documentation

### User Decision:
- [ ] Proceed with phased approach?
- [ ] Timeline for migration?
- [ ] Any blockers identified?

**🛑 STOP - User approves migration plan**

---

## Step 7: Production Deployment Checklist
**UCR: Final Production Approval**

### Pre-Production Checklist:
- [ ] Platform org exists in production DB
- [ ] Service role key configured in production
- [ ] Cookie security settings for production
- [ ] Rate limiting on demo API endpoint
- [ ] Monitoring/alerts configured

### Production Commands:
```bash
# In production environment
cd mcp-server
NODE_ENV=production node create-platform-production.js
NODE_ENV=production node hera-auth-dna-generator.js generate salon
```

### User Final Verification:
- [ ] All environments tested?
- [ ] Rollback plan ready?
- [ ] Documentation complete?

**🛑 STOP - User gives final production approval**

---

## Troubleshooting Guide

### Common Issues:
1. **Cookie not found**
   - Check name: `hera-demo-session` (hyphens, not underscores)
   - Check browser dev tools → Application → Cookies

2. **Session expires immediately**
   - Verify expiration date in cookie
   - Check server time vs client time
   - Confirm auto-extension working

3. **No organization data**
   - Check membership relationship active
   - Verify organization_id in queries
   - Check RLS policies

4. **Demo user not found**
   - Run generator for that demo type
   - Check Platform org exists
   - Verify smart codes

### Debug Mode:
```typescript
// Enable verbose logging
if (process.env.NODE_ENV === 'development') {
  // Logs enabled automatically
}
```

---

## Success Criteria

✅ Platform organization operational
✅ Demo users authenticate successfully  
✅ Sessions persist for 30 minutes
✅ Auto-extension works seamlessly
✅ Organization data loads correctly
✅ No breaking changes to existing code
✅ Clear migration path defined

---

## Next Steps

After successful implementation:
1. Document any custom demo types needed
2. Set up monitoring dashboards
3. Plan real user authentication
4. Consider SSO integration
5. Implement audit log analysis

This implementation provides a production-ready authentication system while maintaining HERA's universal architecture principles.