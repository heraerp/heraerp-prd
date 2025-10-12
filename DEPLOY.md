# Next.js on Railway — Zero-drama Playbook

## Golden rules

1. **One runtime path only**: Nixpacks (Node) → `next start -H 0.0.0.0 -p $PORT`
2. **Force Node provider**: prevent Deno auto-detect
3. **No Dockerfile** unless you truly need it (then you must set `CMD`/`PORT`)
4. **Healthcheck route exists & bypasses middleware**
5. **Never hardcode PORT**. Let Railway inject it
6. **If basePath is set**, healthcheck path must include it

## Minimal, proven config

### railway.toml
```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "next start -H 0.0.0.0 -p $PORT"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[environments.develop.deploy]
healthcheckPath = ""   # disable HC in dev only
```

### nixpacks.toml
```toml
providers = ["node"]

[variables]
NODE_ENV = "production"

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "next start -H 0.0.0.0 -p $PORT"
```

### src/app/api/health/route.ts
```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export const runtime = "nodejs";
```

### middleware.ts (exclude health)
```ts
export const config = { matcher: ["/((?!api/health).*)"] };
```

### Optional: pin Node
```
# .node-version
20
```

## Pre-deploy checklist (60 seconds)

1. **Remove Dockerfile** (or be 100% sure `CMD` is `next start -p $PORT -H 0.0.0.0`)
2. **Clear Custom Start Command** in Railway UI (let railway.toml rule)
3. **Commit** railway.toml, nixpacks.toml, health route, and Node pin
4. **Ensure no env var sets a fixed PORT**
5. **If basePath exists**, update healthcheckPath

## Fast smoke test (post-deploy)
```bash
curl -sfS https://<your-domain>/api/health && echo "HC OK"
curl -sfS https://<your-domain>/           && echo "Root OK"
```

## How to recognize the classic failures

- **"service unavailable" immediately after build**: nothing is listening on `$PORT` → wrong start command / wrong runtime (Docker CMD or Deno detection)
- **"npm: command not found" in build**: Nixpacks picked Deno → add `providers=["node"]` and remove root-level Deno configs
- **"npm ci requires package-lock.json"**: use `npm install` instead of `npm ci` in nixpacks.toml
- **"package.json not found"**: check working directory in build - may need `workingDir` in nixpacks.toml
- **HC fails but `/` works**: middleware or basePath blocking `/api/health`
- **Works in dev, fails in prod**: dev HC disabled; prod HC path/middleware mismatch

## Debugging build issues

If package.json is not found or working directory issues occur, add debug commands to nixpacks.toml:

```toml
[phases.install]
cmds = ["ls -la", "pwd", "ls -la /app", "npm install"]
```

This will show:
1. Current directory files
2. Current working directory path
3. Files in /app directory (if different)
4. Then run npm install

## One-liner rescue prompt (for future incidents)

Paste into Claude (or adapt anywhere):

```
Our Next.js 15 (App Router) on Railway should run with Nixpacks + next start. 
Give me: railway.toml, nixpacks.toml (force Node, npm install/build/start), health route 
(/src/app/api/health/route.ts, Node runtime), middleware exclude for /api/health, and 
a 5-step deploy checklist (remove Dockerfile, clear custom start, no fixed PORT, 
basePath-aware HC). Output just the files and steps.
```

---

If you keep these pieces in the repo, this becomes a boring, reliable deploy.