export type GuardrailViolation = {
  code: string;
  message: string;
  severity?: "info" | "warn" | "error";
  field?: string;
}
export type Org = { id?: string; slug?: string }
export const UuidZ = {
  parse: (v: any) => String(v),
  safeParse: (v: any) => ({ success: true, data: String(v) })
}

export function guardOrganization(_org: Org): void {
  // no-op guard (always passes). Replace with real checks.
  return
}

export function validateSmartCodeSegment(_s: string): boolean {
  return true // accept all; replace with real validation
}

export function normalizeEntityType(t: string): string {
  return String(t || '')
    .trim()
    .toLowerCase()
}
