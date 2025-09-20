// CRM Smart Code Catalog and validators

const CRM_CODES = [
  'HERA.CRM.LEAD.CREATE.V1',
  'HERA.CRM.LEAD.ROUTING.V1',
  'HERA.CRM.LEAD.QUALIFY.V1',
  'HERA.CRM.OPPORTUNITY.CREATE.V1',
  'HERA.CRM.QUOTE.APPROVAL.V1',
  'HERA.CRM.CONTRACT.SIGNATURE.V1',
  'HERA.CRM.ONBOARDING.START.V1',
  'HERA.CRM.CASE.OPEN.V1',
  'HERA.CRM.RENEWAL.FORECAST.V1',
  'HERA.CRM.RENEWAL.CLOSE.V1',
  'HERA.CRM.ACCOUNT.CREATE.V1',
  'HERA.CRM.ACCOUNT.UPDATE.V1',
  'HERA.CRM.ACCOUNT.DELETE.V1',
]

export function isCRMSmartCode(code: string | null | undefined): boolean {
  if (!code) return false
  const norm = code.toUpperCase()
  if (CRM_CODES.includes(norm)) return true
  // Accept family for read filters
  return norm.startsWith('HERA.CRM.')
}

export function assertOrgId(orgId?: string) {
  if (!orgId || orgId.length < 8) throw new Error('organization_id is required')
}
