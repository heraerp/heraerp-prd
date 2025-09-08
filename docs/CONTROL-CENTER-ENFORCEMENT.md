# HERA Control Center - Automatic Enforcement Guide

## Overview

The HERA Control Center is now configured for **automatic enforcement** across all development workflows. This ensures consistent quality, compliance with sacred rules, and system health monitoring at all times.

## 🔐 Enforcement Mechanisms

### 1. **Git Hooks (Automatic)**
```bash
# Setup command (runs automatically on npm install)
node scripts/setup-control-center-hooks.js
```

**Pre-Commit Hook**: Runs before every commit
- Guardrail validation
- Build quality check
- Smart code compliance

**Pre-Push Hook**: Runs before pushing to remote
- Full deployment readiness check
- System health validation
- Security scan

**Post-Merge Hook**: Runs after merging branches
- Module index rebuild
- Health status update

### 2. **Middleware Integration**
All API calls are automatically validated:
```typescript
// Automatic in middleware.ts
- Organization ID enforcement
- Smart code validation  
- Health-based rate limiting
- Sacred table protection
```

### 3. **VS Code Integration**
Quick access via Command Palette (Cmd/Ctrl+Shift+P):
- "Run Task" → "HERA Control Center"
- "Run Task" → "Check System Health"
- "Run Task" → "Check Guardrails"

### 4. **NPM Scripts**
```json
{
  "scripts": {
    "dev": "node scripts/startup-control-center.js && next dev",
    "cc": "node mcp-server/hera-control-center.js",
    "cc:health": "node mcp-server/hera-control-center.js health",
    "cc:check": "node mcp-server/hera-control-center.js control",
    "cc:deploy": "node mcp-server/hera-control-center.js deploy-check",
    "postinstall": "node scripts/setup-control-center-hooks.js"
  }
}
```

### 5. **Always-Visible Widget**
Add to your root layout:
```tsx
import { ControlCenterWidget } from '@/components/layout/ControlCenterWidget'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ControlCenterWidget />
      </body>
    </html>
  )
}
```

## 📋 Automatic Checks

### On Every Development Start
1. System health check
2. Guardrail validation
3. Module index verification
4. Build system check

### On Every Commit
1. Sacred 6 tables enforcement
2. Organization ID presence
3. Smart code compliance
4. Code quality validation

### On Every API Call
1. Health status check (cached 5 min)
2. Organization context validation
3. Table name verification
4. Operation authorization

### On Every Push
1. Full deployment readiness
2. Test suite execution
3. Security vulnerability scan
4. Documentation completeness

## 🚨 Failure Scenarios

### If Health Check Fails
- **Dev Server**: Won't start until issues fixed
- **API Calls**: Write operations blocked if health < 70%
- **Widget**: Shows warning/critical status
- **Solution**: Run `npm run cc:health --detailed`

### If Guardrails Fail
- **Commits**: Blocked with specific violations listed
- **API Calls**: Rejected with detailed errors
- **Solution**: Run `npm run cc guardrails --fix`

### If Deploy Check Fails
- **Push**: Blocked with checklist of issues
- **Solution**: Run `npm run cc:deploy` and fix each item

## 🎯 Quick Reference

### Terminal Commands
```bash
# Full control panel
npm run cc

# Quick health check
npm run cc:health

# Deployment readiness
npm run cc:deploy

# Fix guardrail violations
node mcp-server/hera-control-center.js guardrails --fix

# Rebuild module index
node mcp-server/hera-control-center.js index --rebuild
```

### Keyboard Shortcuts (VS Code)
- `Cmd+Shift+B`: Run default Control Center task
- `Cmd+Shift+P` → "Run Task": Access all Control Center tasks

### Environment Variables
```env
# .env.control-center
CONTROL_CENTER_ENABLED=true
CONTROL_CENTER_ENFORCE_GUARDRAILS=true
CONTROL_CENTER_HEALTH_THRESHOLD=70
CONTROL_CENTER_WIDGET_ENABLED=true
```

## 🔧 Customization

### Disable Specific Checks (Not Recommended)
```env
# In .env.control-center
CONTROL_CENTER_PRE_COMMIT_CHECK=false
CONTROL_CENTER_PRE_PUSH_CHECK=false
```

### Adjust Health Thresholds
```env
CONTROL_CENTER_HEALTH_THRESHOLD=80  # More strict
CONTROL_CENTER_CACHE_TTL=60000      # 1 minute cache
```

### Widget Position
```env
CONTROL_CENTER_WIDGET_POSITION=top-right  # or bottom-left, top-left
```

## 📊 Monitoring

### Dashboard Access
- Local: `http://localhost:3000/control-center`
- Production: `https://app.heraerp.com/control-center`

### Health API
- Endpoint: `/api/v1/control-center/health`
- Headers: `X-HERA-Health: healthy|degraded`

### Logs
- Location: Console output during dev
- Production: Check monitoring system

## 🚀 Benefits

1. **Zero Configuration**: Works automatically after setup
2. **Prevent Issues**: Catches problems before they reach production
3. **Maintain Quality**: Enforces standards consistently
4. **Save Time**: No manual checks needed
5. **Team Alignment**: Everyone follows same standards

## Emergency Override

**⚠️ USE ONLY IN EMERGENCIES**

To bypass Control Center (not recommended):
```bash
# Skip pre-commit hook
git commit --no-verify

# Skip pre-push hook  
git push --no-verify

# Disable middleware check
CONTROL_CENTER_ENABLED=false npm run dev
```

**Note**: Overrides are logged and may require explanation during code review.

## Summary

The Control Center is now your **automatic co-pilot**, ensuring:
- ✅ Every commit is compliant
- ✅ Every push is deployment-ready
- ✅ Every API call is validated
- ✅ System health is always monitored
- ✅ Sacred rules are never violated

**Remember**: The Control Center is here to help, not hinder. If it blocks you, there's likely a good reason. Fix the issue rather than bypassing the check!