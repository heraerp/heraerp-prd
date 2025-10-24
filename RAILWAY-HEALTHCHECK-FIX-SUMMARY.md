# Railway Healthcheck Issue - Root Cause & Fix

## 🚨 Problem

Railway healthcheck is failing when code is pushed to `develop` branch. This was previously fixed but the issue has resurfaced.

## 🔍 Root Cause

**CRITICAL DISCOVERY**: Railway uses `railway.toml` which takes PRIORITY over `nixpacks.toml`.

**Configuration Priority Order:**
1. **railway.toml** ← Railway uses this FIRST (if it exists)
2. railway.json
3. nixpacks.toml ← Ignored if railway.toml exists

Both configuration files were calling a non-existent script.

### The Mismatch:

**`railway.toml` (Line 9) - THE REAL CULPRIT:**
```toml
[deploy]
startCommand = "npm run start:railway"  ❌
```

**`nixpacks.toml` (Line 17) - ALSO HAD THE ISSUE:**
```toml
[start]
cmd = "npm run start:railway"  ❌
```

**`package.json` (Line 65) - CORRECT:**
```json
"start": "node scripts/railway-start.js"  ✅
```

**❌ Issue**: BOTH Railway config files were calling non-existent `start:railway` script!

## 📋 Previous Fix History

### Commit: `1d0f0f27c` (Oct 24, 2025)
**Title**: `fix(railway): Restore Railway start script`

**What Changed:**
- Changed `package.json` start script from `"next start"` to `"node scripts/railway-start.js"`
- Reason: Railway deployment requires custom startup script for:
  - Environment validation
  - Standalone server detection
  - Health check preparation
  - Port binding verification

**What Was Missed:**
- The `nixpacks.toml` file was NOT updated to reflect this change
- It still tries to run the non-existent `start:railway` script

## 🎯 The Fix

### Fix BOTH Configuration Files (REQUIRED)

**1. railway.toml (Line 9) - PRIMARY FIX:**
```toml
[deploy]
startCommand = "npm start"  # ✅ Changed from "npm run start:railway"
```

**2. nixpacks.toml (Line 17) - SECONDARY FIX:**
```toml
[start]
cmd = "npm start"  # ✅ Changed from "npm run start:railway"
```

**Why both must be fixed:**
- Railway prioritizes `railway.toml` if it exists
- But some deployments might fall back to `nixpacks.toml`
- Fixing both ensures consistent behavior
- Standard npm convention (`npm start` is the standard)

## 🛡️ Railway Health Check Configuration

### Current Health Endpoints (Both Work):

1. **`/api/health`** - Extended health check with detailed metrics
   - Returns: Service status, version, uptime, memory usage
   - Located: `src/app/api/health/route.ts`

2. **`/api/healthz`** - Simple health check (lightweight)
   - Returns: `{ ok: true }`
   - Located: `src/app/api/healthz/route.ts`

Both endpoints:
- ✅ Support GET and HEAD methods
- ✅ Force nodejs runtime (no Edge runtime issues)
- ✅ Include `Cache-Control: no-store` headers
- ✅ Fast, dependency-free responses

### Railway Startup Script Features

The `scripts/railway-start.js` script provides:

1. **Environment validation**
   ```javascript
   PORT = process.env.PORT || 3000
   NODE_ENV = process.env.NODE_ENV || 'production'
   HOSTNAME = process.env.HOSTNAME || '0.0.0.0'
   ```

2. **Standalone server detection**
   - Checks for `.next/standalone/server.js`
   - Falls back to regular Next.js start if needed

3. **Progressive health check attempts**
   ```javascript
   const healthCheckAttempts = [10, 20, 30, 45, 60, 90] // seconds
   ```

4. **Comprehensive logging**
   - Server stdout/stderr capture
   - Deployment ID tracking
   - Memory usage monitoring

5. **Graceful shutdown**
   - SIGTERM/SIGINT handling
   - Clean process termination

## 📝 Complete Configuration

### 1. railway.toml (PRIMARY CONFIG - FIXED)

```toml
# railway.toml - Railway deployment configuration
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"  # ✅ FIXED: Changed from "npm run start:railway"

# Robust healthcheck configuration
healthcheckPath = "/api/health"
healthcheckTimeout = 600
healthcheckInterval = 30
gracePeriod = 60

# Enhanced restart policy
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### 2. nixpacks.toml (FALLBACK CONFIG - ALSO FIXED)

```toml
# nixpacks.toml
providers = ["node"]

[variables]
NODE_ENV = "production"
NEXT_TELEMETRY_DISABLED = "1"
OTEL_TRACES_EXPORTER = "none"
OTEL_METRICS_EXPORTER = "none"

[phases.install]
cmds = ["ls -la /app", "pwd", "npm ci --omit=dev"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"  # ✅ FIXED: Changed from "npm run start:railway"
```

### 3. package.json (Already Correct)

```json
{
  "scripts": {
    "start": "node scripts/railway-start.js",  // ✅ CORRECT
    "build": "node --max-old-space-size=8192 ./node_modules/next/dist/bin/next build",
    // ... other scripts
  }
}
```

### 4. Railway Environment Variables

```bash
# Required in Railway dashboard
NEXT_PUBLIC_SUPABASE_URL=https://awfcrncxngqwbhqapffb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8
NODE_ENV=production
```

### 5. Railway Health Check Settings (in Railway Dashboard)

**Recommended Settings:**
- **Health Check Path**: `/api/health` or `/api/healthz`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Restart Threshold**: 3 consecutive failures

## 🔄 Deployment Flow

```
1. Code pushed to develop → Railway detects change
2. Railway runs nixpacks build
   ├─ phases.install: npm ci --omit=dev
   └─ phases.build: npm run build
3. Railway starts application
   ├─ Runs: npm start (from nixpacks.toml)
   ├─ Executes: node scripts/railway-start.js
   ├─ Starts: Next.js standalone server
   └─ Binds: 0.0.0.0:$PORT
4. Railway health check
   ├─ Attempts: GET /api/health (or /api/healthz)
   ├─ Expected: 200 OK with { ok: true }
   └─ Success: Deployment marked healthy ✅
```

## 🧪 Testing Locally

### Test the Railway start script:
```bash
# Simulate Railway environment
export PORT=3000
export NODE_ENV=production
export RAILWAY_DEPLOYMENT_ID=test-local
export RAILWAY_ENVIRONMENT=development

# Run the Railway start script
npm start

# In another terminal, test health endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/healthz
```

### Expected Output:

**Health Check:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T...",
  "service": "hera-erp",
  "uptime": 42.5,
  "memory": { "used": 150, "total": 200 },
  "ok": true
}
```

**Railway Start Script:**
```
🚂 Railway HERA ERP Startup Script v3.0
========================================
📊 Environment: production
🌐 Hostname: 0.0.0.0
🔌 Port: 3000
✅ Standalone server found
🚀 Starting Next.js standalone server...
✅ HERA ERP Health Check PASSED
🌐 Server responding at: http://0.0.0.0:3000
```

## 📚 Related Documentation

1. **Railway Deployment Guide**: `/RAILWAY-DEPLOYMENT.md`
2. **MCP Railway Guide**: `/DEPLOY-MCP-RAILWAY.md`
3. **Railway Start Script**: `/scripts/railway-start.js`
4. **Health Endpoints**:
   - `/src/app/api/health/route.ts`
   - `/src/app/api/healthz/route.ts`

## 🎯 Action Items

- [x] Update `railway.toml` line 9: Change `startCommand = "npm run start:railway"` to `startCommand = "npm start"`
- [x] Update `nixpacks.toml` line 17: Change `cmd = "npm run start:railway"` to `cmd = "npm start"`
- [x] Commit the fixes
- [x] Push to develop
- [ ] Verify Railway deployment succeeds
- [ ] Confirm health check passes in Railway logs

## 🔐 Verification Checklist

After deploying the fix:

1. **Railway Build Logs** - Should show:
   ```
   ✓ Running npm start
   ✓ 🚂 Railway HERA ERP Startup Script v3.0
   ✓ ✅ Standalone server found
   ```

2. **Railway Health Check** - Should show:
   ```
   ✓ Health check passed: GET /api/health → 200 OK
   ```

3. **Application Status** - Should show:
   ```
   ✓ Status: Active
   ✓ Deployment: Successful
   ```

4. **Test the deployed URL**:
   ```bash
   curl https://your-app.up.railway.app/api/health
   # Should return: { "ok": true, ... }
   ```

## 🚀 Why This Keeps Happening

**Root Cause**: Multiple configuration files need to stay in sync:
- `package.json` (defines scripts)
- `railway.toml` (PRIMARY Railway configuration - highest priority)
- `nixpacks.toml` (FALLBACK Railway configuration - lower priority)
- Railway dashboard settings (environment variables, health checks)

**Prevention Strategy**:
1. When changing `package.json` scripts, ALWAYS update BOTH:
   - `railway.toml` (primary Railway config)
   - `nixpacks.toml` (fallback Railway config)
2. Document Railway-specific scripts clearly
3. Add a pre-push hook to validate Railway configuration consistency
4. Remember: Railway config priority is `railway.toml` > `railway.json` > `nixpacks.toml`

## 📖 Historical Context

This healthcheck issue has been fixed multiple times:

1. **Oct 11, 2025** - `605920cfe` - Implemented Railway gold standard health endpoint
2. **Oct 24, 2025** - `1d0f0f27c` - Restored Railway start script in package.json
3. **Oct 24, 2025** - `d3cf71060` - Fixed nixpacks.toml (but missed railway.toml)
4. **Oct 24, 2025** - `a794e98b6` - FINAL FIX: Updated railway.toml (the actual file Railway uses)

**Pattern**: Changes to startup scripts in `package.json` were not being propagated to:
- `railway.toml` (primary Railway config - highest priority)
- `nixpacks.toml` (fallback config - lower priority)

---

## ✅ FINAL RESOLUTION

**Fixes Applied**:
1. ✅ `railway.toml` line 9: `startCommand = "npm start"` (PRIMARY FIX)
2. ✅ `nixpacks.toml` line 17: `cmd = "npm start"` (SECONDARY FIX)

**Commits**:
- `d3cf71060` - Fixed nixpacks.toml
- `a794e98b6` - Fixed railway.toml (the critical one)

**Expected Result**: Railway healthcheck passes, deployment succeeds.

**Test Command**: `npm start` locally should work without errors.

**Railway will now execute**:
```
railway.toml → npm start → node scripts/railway-start.js → Next.js server → Health check passes ✅
```
