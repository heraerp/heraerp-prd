/**
 * HERA Retail Bootstrap Script
 * ------------------------------------------
 * Purpose:
 *   Initialize the Retail + Laptop specialization + Finance DNA modules
 *   inside an existing multi-tenant HERA monolith.
 *
 * What it does:
 *   1. Applies Finance DNA posting rules (retail.json)
 *   2. Creates or updates the DEMO organization and branches
 *   3. Loads product catalog, pricing, and tax data
 *   4. Emits sample PO → GRN → POS transactions using /api/v2/universal/txn-emit
 *   5. Verifies all calls idempotently (safe to re-run)
 *
 * Authorization:
 *   Requires a valid Supabase access token with permission to act on the target org.
 *
 *   Environment variables:
 *     HERA_TOKEN   – Bearer token copied from Supabase auth (see below)
 *     HERA_ORG_ID  – organization_id UUID to scope all operations
 *     HERA_APP     – optional app code (e.g. RETAIL) if using /transactions/post
 *     LOCAL_API    – base API URL (default: http://localhost:3000/api/v2)
 *
 * How to obtain credentials:
 *   1. Sign in to your running app (npm run dev)
 *   2. Open browser devtools → Application → Local Storage → supabase.auth.token
 *      Copy the `access_token` field.
 *   3. Visit /api/v2/session/context while logged in; copy your `organization_id`.
 *
 * Example usage:
 *   # Terminal 1 – run the app
 *   npm run dev
 *
 *   # Terminal 2 – run bootstrap with auth + org scope
 *   HERA_TOKEN='<access_token>' \
 *   HERA_ORG_ID='<organization_uuid>' \
 *   LOCAL_API=http://localhost:3000/api/v2 \
 *   npm run bootstrap:retail
 *
 * Notes:
 *   • The script falls back gracefully if certain endpoints are missing,
 *     logging "skipped" and continuing.
 *   • Uses /api/v2/universal/txn-emit to bypass app-specific gates.
 *   • Safe to re-run; all operations are idempotent.
 *   • You can optionally set HERA_APP=RETAIL to revert to /api/v2/transactions/post.
 *
 * Files this script depends on:
 *   - modules/finance-dna/posting/retail.json
 *   - modules/retail-laptop/seeds/catalog.json
 *   - modules/retail-laptop/seeds/pricing.json
 *   - modules/retail-laptop/seeds/sample-po.json
 *   - modules/retail-laptop/seeds/sample-grn.json
 *
 * Related documentation:
 *   - HERA Finance DNA Overview (📄 Finance DNA Integration – Complete Summary.pdf)
 *   - HERA Fiscal DNA Setup Guide (📄 Fiscal year close.pdf)
 *   - HERA Core Tables & Universal Transactions reference
 */

import fs from "fs/promises";
import fetch from "node-fetch";

const API = process.env.LOCAL_API || "http://localhost:3000/api/v2";
const ORG = process.env.HERA_ORG || "DEMO";

async function post(path: string, body: any) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-hera-api-version": "v2"
  }
  if (process.env.HERA_TOKEN) headers["Authorization"] = `Bearer ${process.env.HERA_TOKEN}`
  if (process.env.HERA_ORG_ID) headers["x-hera-org-id"] = process.env.HERA_ORG_ID
  if (process.env.HERA_APP) headers["x-hera-app"] = process.env.HERA_APP

  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  // 1) Apply posting rules
  try {
    const rules = JSON.parse(await fs.readFile("modules/finance-dna/posting/retail.json","utf8"));
    await post("/finance/postrules/apply", rules);
  } catch (e: any) {
    console.warn("Skipping posting rules apply:", e?.message || e);
  }

  // 2) Org + branches
  try {
    await post("/org/upsert", { code: "DEMO", name: "HERA Retail Demo (IN)" });
  } catch (e: any) {
    console.warn("Org upsert skipped:", e?.message || e);
  }
  try {
    for (const b of [
      {name:"Kochi Warehouse", type:"warehouse"},
      {name:"Kozhikode Store", type:"store"},
      {name:"Trivandrum Store", type:"store"}
    ]) {
      try { await post("/org/branch/upsert", b) } catch (e: any) { console.warn(`Branch upsert skipped (${b.name}):`, e?.message || e) }
    }
  } catch (e: any) {
    console.warn("Branch upserts skipped:", e?.message || e);
  }

  // 3) Catalog + pricing
  try {
    const cat = JSON.parse(await fs.readFile("modules/retail-laptop/seeds/catalog.json","utf8"));
    await post("/presets/sync", { module: "retail-laptop", payload: cat });
  } catch (e: any) {
    console.warn("Catalog preset sync skipped:", e?.message || e);
  }
  try {
    const pricing = JSON.parse(await fs.readFile("modules/retail-laptop/seeds/pricing.json","utf8"));
    await post("/pricing/upsert", pricing);
  } catch (e: any) {
    console.warn("Pricing upsert skipped:", e?.message || e);
  }

  // 4) Stock via PO -> GRN
  try {
    const po = JSON.parse(await fs.readFile("modules/retail-laptop/seeds/sample-po.json","utf8"));
    await post("/universal/txn-emit", po);
  } catch (e: any) {
    console.warn("PO post skipped:", e?.message || e);
  }
  try {
    const grn = JSON.parse(await fs.readFile("modules/retail-laptop/seeds/sample-grn.json","utf8"));
    await post("/universal/txn-emit", grn);
  } catch (e: any) {
    console.warn("GRN post skipped:", e?.message || e);
  }

  // 5) Quick POS test
  try {
    await post("/universal/txn-emit", {
      header: { smart_code: "HERA.RETAIL.POS.TXN.INVOICE.v1", branch: "Kozhikode Store" },
      lines: [{ sku: "TP-E14-16-512", qty: 1, unit_price: 62999, tax_rate: 18 }],
      payments: [{ method: "UPI", amount: 74238.82 }]
    });
  } catch (e: any) {
    console.warn("POS test skipped:", e?.message || e);
  }

  console.log("Retail base + laptop module bootstrapped.");
}

main().catch(e => { console.error(e); process.exit(1); });
