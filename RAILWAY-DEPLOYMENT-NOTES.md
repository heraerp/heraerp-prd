# Railway Deployment Notes

Short guide to ensure reliable Railway deployments for HERA ERP.

- Build must succeed: The Dockerfile now fails if `npm run build` fails. Do not swallow build errors.
- Artifact verification: A postbuild step (`scripts/verify-next-build.js`) validates `.next` outputs. CI also runs `npm run build:verify`.
- Runtime entrypoint: `simple-server.js` auto-detects build output:
  - Uses `node .next/standalone/server.js` when present (standalone).
  - Falls back to `npx next start` when standard build artifacts exist.
  - Exits with a clear error if no `.next` artifacts are found.
- Ports: Railway sets `PORT`. The server binds to `0.0.0.0` and honors `PORT`.
- Environment: Build-time env is optional; defaults are injected for public Supabase keys. Provide real env at runtime via Railway variables.
- Healthchecks: Use an HTTP healthcheck on your primary route (e.g., `/`) or expose a dedicated endpoint if you add one later.

Handy commands:

- Local prod build + verify: `npm run build:verify`
- Railway-optimized build: `npm run build:railway`

If you see `ENOENT ... .next/prerender-manifest.json` at runtime, rebuild — it means the image was built without a successful `next build`.

