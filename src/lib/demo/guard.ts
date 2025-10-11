export type GuardResult = { allowed: boolean; reason?: string }

export function guardDemoOperation(): GuardResult {
  // Adjust logic later — presently always allows
  return { allowed: true }
}

/** Optional async helper if some callers await it */
export async function guardDemoOperationAsync(): Promise<GuardResult> {
  return { allowed: true }
}
