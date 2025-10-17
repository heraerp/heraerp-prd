// HERA Finance DNA v2.2 - Org & Account Runtime Resolver
// NO hardcoded org IDs - resolves from JWT or environment

import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import jwt_decode from "jwt-decode";

type JWTPayload = { 
  org_id?: string; 
  organization_id?: string; 
  [k: string]: any; 
};

type COAItem = { 
  code: string; 
  name: string; 
  smart_code: string; 
};

// Environment configuration
const HERA_API = process.env.HERA_API ?? "https://www.heraerp.com/api/v2";
const TOKEN = process.env.HERA_JWT ?? "";

if (!TOKEN) {
  throw new Error("HERA_JWT is required for authentication");
}

/**
 * Extract organization ID from JWT token
 */
function getOrgFromJWT(): string | undefined {
  try {
    const payload = jwt_decode<JWTPayload>(TOKEN);
    return payload.org_id ?? payload.organization_id;
  } catch (error) {
    console.warn("Failed to decode JWT token:", error);
    return undefined;
  }
}

/**
 * Resolve organization ID from JWT claim or environment fallback
 */
export async function resolveOrgId(): Promise<string> {
  const envOrg = process.env.HERA_ORG_ID;
  const jwtOrg = getOrgFromJWT();
  const org = envOrg ?? jwtOrg;
  
  if (!org) {
    throw new Error(
      "No org_id found. Set HERA_ORG_ID environment variable or include org_id in JWT token."
    );
  }
  
  console.log(`✓ Resolved organization: ${org}`);
  return org;
}

/**
 * Upsert account entity for organization
 */
async function upsertAccountEntity(org_id: string, item: COAItem): Promise<string> {
  console.log(`  Upserting account: ${item.code} - ${item.name}`);
  
  // Try lookup by (org, code) via dynamic index API first
  try {
    const lookupRes = await fetch(`${HERA_API}/entities/account/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        organization_id: org_id,
        code: item.code
      })
    });
    
    if (lookupRes.ok) {
      const lookupData = await lookupRes.json();
      if (lookupData?.entity_id) {
        console.log(`    Found existing account: ${lookupData.entity_id}`);
        return lookupData.entity_id;
      }
    }
  } catch (error) {
    console.log(`    Lookup failed, proceeding to create: ${error}`);
  }
  
  // Fallback to creation via hera_entities_crud_v2
  const createRes = await fetch(`${HERA_API}/hera_entities_crud_v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`
    },
    body: JSON.stringify({
      p_action: "CREATE",
      p_organization_id: org_id,
      p_entity: {
        entity_type: "account",
        entity_name: item.name,
        smart_code: item.smart_code,
        business_rules: {
          ledger_type: item.smart_code.includes(".STAT.") ? "STAT" : "GL"
        }
      },
      p_dynamic: {
        account_code: {
          field_type: "text",
          field_value_text: item.code,
          smart_code: "HERA.ACCOUNTING.COA.FIELD.CODE.v1"
        }
      }
    })
  });
  
  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Account upsert failed for ${item.code}: ${createRes.status} ${errorText}`);
  }
  
  const createData = await createRes.json();
  const entityId = createData?.items?.[0]?.id ?? createData?.entity_id ?? createData?.id;
  
  if (!entityId) {
    throw new Error(`No entity_id returned for account ${item.code}`);
  }
  
  console.log(`    Created account: ${entityId}`);
  return entityId;
}

/**
 * Ensure Chart of Accounts exists for organization
 */
export async function ensureCOA(org_id: string): Promise<Record<string, string>> {
  console.log(`🏗️  Ensuring COA for organization: ${org_id}`);
  
  // Load COA pack
  const packPath = path.resolve(process.cwd(), "packs/chart_of_accounts/coa_default.json");
  const pack: { accounts: COAItem[] } = JSON.parse(
    await fs.readFile(packPath, "utf8")
  );
  
  const accountMap: Record<string, string> = {};
  
  // Process each account
  for (const account of pack.accounts) {
    try {
      const entityId = await upsertAccountEntity(org_id, account);
      accountMap[account.code] = entityId;
    } catch (error) {
      console.error(`Failed to process account ${account.code}:`, error);
      throw error;
    }
  }
  
  // Cache the mapping for future use
  const cacheDir = path.resolve(process.cwd(), ".cache");
  await fs.mkdir(cacheDir, { recursive: true });
  
  const cacheFile = path.resolve(cacheDir, `coa_map.${org_id}.json`);
  await fs.writeFile(cacheFile, JSON.stringify(accountMap, null, 2));
  
  console.log(`✓ COA ensured with ${Object.keys(accountMap).length} accounts`);
  return accountMap;
}

/**
 * Resolve account entity IDs for given codes
 */
export async function resolveAccountIds(
  org_id: string, 
  neededCodes: string[]
): Promise<Record<string, string>> {
  console.log(`🔍 Resolving account IDs for codes: ${neededCodes.join(", ")}`);
  
  let accountMap: Record<string, string> = {};
  
  // Try to load from cache first
  const cacheFile = path.resolve(process.cwd(), ".cache", `coa_map.${org_id}.json`);
  try {
    const cached = await fs.readFile(cacheFile, "utf8");
    accountMap = JSON.parse(cached);
    console.log(`  Loaded ${Object.keys(accountMap).length} accounts from cache`);
  } catch (error) {
    console.log("  No cache found, will ensure COA");
  }
  
  // Check if any codes are missing
  const missingCodes = neededCodes.filter(code => !accountMap[code]);
  
  if (missingCodes.length > 0) {
    console.log(`  Missing codes: ${missingCodes.join(", ")}, ensuring fresh COA`);
    const freshMap = await ensureCOA(org_id);
    accountMap = { ...accountMap, ...freshMap };
  }
  
  // Validate all needed codes are resolved
  const unresolvedCodes = neededCodes.filter(code => !accountMap[code]);
  if (unresolvedCodes.length > 0) {
    throw new Error(`Failed to resolve account codes: ${unresolvedCodes.join(", ")}`);
  }
  
  console.log(`✓ Resolved ${neededCodes.length} account entity IDs`);
  return accountMap;
}

/**
 * Get account entity ID by code for organization
 */
export async function getAccountEntityId(org_id: string, accountCode: string): Promise<string> {
  const accountMap = await resolveAccountIds(org_id, [accountCode]);
  return accountMap[accountCode];
}

// Export environment info for debugging
export function getEnvironmentInfo() {
  return {
    HERA_API,
    hasToken: !!TOKEN,
    HERA_ORG_ID: process.env.HERA_ORG_ID,
    jwtOrgId: getOrgFromJWT()
  };
}