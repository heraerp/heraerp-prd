# 🧠 HERA Project Intelligence & Auto-Learning System

**Last Updated:** October 29, 2025  
**Purpose:** Persistent knowledge system for Claude to maintain project understanding and learn from interactions

## 🎯 **Project Success Imperatives**

Since you rely on me 100%, these are NON-NEGOTIABLE success patterns I must follow:

### **SACRED DEVELOPMENT RULES**
1. **ALWAYS check CLAUDE.md first** - Contains latest project context and rules
2. **NEVER break HERA Sacred Six** - Schema stability is paramount
3. **USE API v2 Gateway ONLY** - No direct RPC calls from clients
4. **ENFORCE Organization Isolation** - Every operation needs organization_id
5. **MAINTAIN Actor Stamping** - All changes must be traceable to users
6. **FOLLOW Mobile-First Design** - All UI must work on mobile first

### **AUTOMATIC QUALITY GATES**
- Run `npm run predeploy` before any deployment
- Check schema compliance via `/docs/schema/hera-sacred-six-schema.yaml`
- Validate Smart Codes follow HERA DNA patterns
- Ensure all business data goes to `core_dynamic_data` (NOT metadata)
- Test health endpoints are unauthenticated
- Verify JWT authentication on business endpoints

## 📚 **Project Knowledge Base**

### **Architecture Patterns I Must Know**
```typescript
// ✅ CORRECT API v2 Pattern
const result = await apiV2.post('entities', {
  organization_id: orgId,  // ALWAYS required
  entity_type: 'customer',
  smart_code: 'HERA.ENTERPRISE.CUSTOMER.v1'
})

// ❌ FORBIDDEN Direct RPC Pattern  
const result = await supabase.rpc('hera_entities_crud_v1', {...})
```

### **Common Failure Patterns & Auto-Fixes**
1. **Missing Organization Context**
   - Problem: API calls without organization_id
   - Auto-Fix: Add organization_id from useHERAAuth() hook

2. **Direct RPC Usage**
   - Problem: Bypassing API v2 gateway
   - Auto-Fix: Replace with proper API v2 client calls

3. **Schema Field Assumptions**
   - Problem: Using wrong field names
   - Auto-Fix: Check `/docs/schema/hera-sacred-six-schema.yaml` first

4. **Health Endpoint Auth Issues**
   - Problem: Health checks requiring authentication
   - Auto-Fix: Use `isHealthCheckPath()` for early bypass

5. **Smart Code Violations**
   - Problem: Invalid HERA DNA patterns
   - Auto-Fix: Use UPPERCASE.SEGMENTS.v1 format

### **File Location Patterns I Must Remember**
- **API v2 Gateway**: `/supabase/functions/api-v2/index.ts`
- **Route Registry**: `/supabase/functions/api-v2/_routes.ts`
- **Schema Reference**: `/docs/schema/hera-sacred-six-schema.yaml`
- **Main Config**: `/CLAUDE.md`
- **Auth Provider**: `/src/components/auth/HERAAuthProvider.tsx`
- **Branding Engine**: `/src/lib/platform/branding-engine.ts`

## 🔄 **Learning From Interactions**

### **Pattern Recognition**
When I encounter issues, I should:
1. **Document the pattern** in this file
2. **Record the solution** that worked
3. **Update prevention strategies** for next time
4. **Add to guardrails** if it's a common mistake

### **Success Patterns to Repeat**
- Always start with guardrail validation
- Use TodoWrite/TodoRead for task tracking
- Deploy to both dev and production environments
- Test health endpoints after deployment changes
- Verify authentication still works on business endpoints

### **Failure Patterns to Avoid**
- Don't assume field names exist without checking schema
- Don't bypass organization_id requirements
- Don't use direct RPC calls from client code
- Don't deploy without testing basic functionality
- Don't forget to update todos when tasks complete

## 🛡️ **Auto-Guardrails for Claude**

### **Before Starting Any Task**
```typescript
// Mandatory checks I must perform:
1. Read CLAUDE.md for latest context
2. Check if task involves schema changes (forbidden)
3. Verify if API changes need health endpoint testing
4. Confirm organization context requirements
5. Plan mobile-first responsive approach if UI work
```

### **During Development**
```typescript
// Continuous validation I must perform:
1. Use TodoWrite to track progress transparently
2. Follow HERA DNA Smart Code patterns
3. Ensure all data goes to core_dynamic_data
4. Test authentication boundaries (health vs business)
5. Deploy to both environments when complete
```

### **Before Marking Complete**
```typescript
// Final validation I must perform:
1. Test key endpoints work (health + one business endpoint)
2. Verify no breaking changes to existing functionality
3. Update documentation if new patterns introduced
4. Mark todos as completed
5. Document any new learning patterns discovered
```

## 📈 **Continuous Improvement Tracking**

### **Success Metrics**
- Tasks completed without breaking existing functionality
- Zero regressions in health checks or authentication
- Consistent follow-through on deployment to both environments
- Proper documentation of new patterns discovered

### **Learning Opportunities**
- Every failed deployment teaches environment-specific patterns
- Every authentication issue reveals security boundary edge cases
- Every schema question reinforces Sacred Six compliance
- Every API change demonstrates proper gateway usage

## 🎯 **Claude Behavior Directives**

**ALWAYS:**
- Start sessions by reading this file + CLAUDE.md
- Use TodoWrite/TodoRead for transparency
- Test deployments in both environments
- Follow mobile-first responsive design
- Document new patterns learned

**NEVER:**
- Assume schema details without checking yaml reference
- Use direct RPC calls from client code
- Skip organization_id requirements
- Deploy without testing basic functionality
- Complete tasks without verifying success

**WHEN UNCERTAIN:**
- Check CLAUDE.md first
- Reference schema yaml for field names
- Test health endpoints after API changes
- Ask for clarification rather than assume
- Document the uncertainty for future reference

---

**💡 Remember: Your success depends on my consistency and learning. This file helps me stay on track across all sessions.**