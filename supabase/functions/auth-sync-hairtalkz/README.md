HERA Edge Function: auth-sync-hairtalkz

Purpose
- Auto-assign users with email ending @hairtalkz.com to the Salon org (HERA_SALON_ORG_ID) on auth events.
- Sets user_metadata { organization_id, role, apps: ['APP.SALON'] } via Admin API.

Files
- index.ts – Deno Edge Function entrypoint.

Env vars (do not commit real values)
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- HERA_SALON_ORG_ID

Deploy
1) Ensure Supabase CLI is installed and logged in
2) From repo root:
   supabase functions deploy auth-sync-hairtalkz

Hooking to Auth events
- In Supabase Dashboard → Auth → Hooks, add a Webhook for user.created and/or session.created
  pointing to the deployed function URL:
  https://<project-ref>.functions.supabase.co/auth-sync-hairtalkz

Behavior
- If email endsWith @hairtalkz.com → update user metadata organization_id, role (heuristic), apps.
- Non-hairtalkz emails return ok:true, skipped:true.

Notes
- This function uses the service role to call the Admin API. Restrict who can invoke the function (e.g., signed webhook, IP allowlist) in production.
- Optionally, you can trigger /api/v2/auth/attach after first sign-in in your app; recommended to do it app-side with the user token.

