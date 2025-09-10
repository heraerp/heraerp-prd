"use server";

import { z } from "zod";
import { createClient } from '@supabase/supabase-js';
import { universalApi } from '@/lib/universal-api';

// Server-side Supabase client for direct operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Validation schema
const schema = z.object({
  slug: z.string().min(1),
  subdomain: z.string()
    .regex(/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/, "lowercase letters, digits, hyphens; 2-63 chars")
    .min(2, "Subdomain must be at least 2 characters")
    .max(63, "Subdomain must be no more than 63 characters"),
  domains: z.array(z.string().min(1)).max(10, "Maximum 10 domains allowed"),
});

async function getOrgBySlug(slug: string) {
  // First try by current subdomain
  const { data: bySubdomain, error: subdomainError } = await supabase
    .from('core_organizations')
    .select('id, organization_name, settings')
    .eq('settings->>subdomain', slug)
    .eq('status', 'active')
    .single();
    
  if (bySubdomain && !subdomainError) return bySubdomain;

  // Then try by organization code (for cases like 'salon' → 'SALON-BR1')
  const { data: byCode, error: codeError } = await supabase
    .from('core_organizations')
    .select('id, organization_name, settings')
    .eq('organization_code', slug.toUpperCase())
    .eq('status', 'active')
    .single();
    
  if (byCode && !codeError) return byCode;

  // For salon development, try with default salon organization
  if (slug === 'salon' || slug === 'hair-talkz-karama') {
    const { data: salonOrg, error: salonError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, settings')
      .eq('id', 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258')
      .single();
      
    if (salonOrg && !salonError) return salonOrg;
  }
  
  return null;
}

export async function updateOrgSubdomainAction(input: unknown) {
  try {
    const { slug, subdomain, domains } = schema.parse(input);
    
    // Get organization by current slug
    const org = await getOrgBySlug(slug);
    if (!org) {
      return { ok: false, error: "Organization not found" };
    }

    // Check if subdomain is already taken by another organization
    if (subdomain !== (org.settings?.subdomain)) {
      const { data: existingOrg, error: checkError } = await supabase
        .from('core_organizations')
        .select('id')
        .eq('settings->>subdomain', subdomain)
        .neq('id', org.id)
        .single();

      if (existingOrg && !checkError) {
        return { ok: false, error: "Subdomain already taken" };
      }
    }

    // 1) Audit: Create a SmartCode'd transaction for the settings update
    await universalApi.createTransaction({
      transaction_type: 'org_settings_update',
      reference_number: `SUBDOMAIN-${Date.now()}`,
      smart_code: 'HERA.IDENTITY.ORG.SETTINGS.SUBDOMAIN.UPDATE.v1',
      total_amount: 0,
      metadata: {
        action: 'subdomain_update',
        previous_subdomain: org.settings?.subdomain || null,
        new_subdomain: subdomain,
        previous_domains: org.settings?.domains || [],
        new_domains: domains,
        updated_by: 'system', // In real implementation, get from auth context
        organization_id: org.id
      }
    }, org.id);

    // 2) Apply: Update organization settings (JSONB merge-patch)
    const newSettings = {
      ...org.settings,
      subdomain,
      domains: domains.length > 0 ? domains : undefined
    };

    const { error: updateError } = await supabase
      .from('core_organizations')
      .update({
        settings: newSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', org.id);

    if (updateError) {
      console.error('Failed to update organization settings:', updateError);
      return { ok: false, error: "Failed to update settings" };
    }

    return { ok: true };

  } catch (error) {
    console.error('updateOrgSubdomainAction error:', error);
    
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.errors[0]?.message || "Validation failed" };
    }
    
    return { ok: false, error: "An unexpected error occurred" };
  }
}