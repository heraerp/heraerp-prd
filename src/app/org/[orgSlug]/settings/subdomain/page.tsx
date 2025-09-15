// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { updateOrgSubdomainAction } from '@/app/actions/updateOrgSubdomain'
import SubdomainSettingsForm from '@/components/org/SubdomainSettingsForm'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function getOrgBySlug(slug: string) {
  const { data, error } = await supabase
    .from('core_organizations')
    .select('id, organization_name, settings')
    .or(`settings->>subdomain.eq.${slug},organization_code.eq.${slug.toUpperCase()}`)
    .eq('status', 'active')
    .single()

  if (error || !data) return null
  return data
}

interface PageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function SubdomainSettingsPage({ params }: PageProps) {
  const { orgSlug } = await params
  const org = await getOrgBySlug(orgSlug)

  if (!org) {
    notFound()
  }

  // Read settings from core_organizations.settings (JSONB)
  const settings = org.settings ?? {}
  const previewBase =
    process.env.NODE_ENV === 'production'
      ? 'heraerp.com'
      : (process.env.NEXT_PUBLIC_TENANT_DOMAIN_BASE ?? 'lvh.me:3000')

  async function onSave(payload: { slug: string; subdomain: string; domains: string[] }) {
    'use server'
    return updateOrgSubdomainAction(payload)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Subdomain Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your organization's subdomain and custom domains for branded access.
        </p>
      </div>

      <SubdomainSettingsForm
        slug={params.orgSlug}
        current={{
          subdomain: settings.subdomain,
          domains: settings.domains ?? [],
          previewBase,
          organizationName: org.organization_name
        }}
        onSave={onSave}
      />
    </div>
  )
}

// Metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const org = await getOrgBySlug(params.orgSlug)

  return {
    title: `Subdomain Settings - ${org?.organization_name || 'Organization'}`,
    description: "Configure your organization's subdomain and custom domains"
  }
}
