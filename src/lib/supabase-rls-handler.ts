/**
 * HERA RLS Error Handler
 * Enterprise-grade handling of RLS policy errors during migration
 */

export class RLSErrorHandler {
  private static warnedFields = new Set<string>()

  /**
   * Check if an error is related to RLS app.current_org issue
   */
  static isRLSError(error: any): boolean {
    if (!error || !error.message) return false

    return (
      error.message.includes('app.current_org') ||
      error.message.includes('unrecognized configuration parameter') ||
      error.code === '42883' // undefined_function
    )
  }

  /**
   * Handle RLS errors gracefully
   */
  static handleError(error: any, context: { table?: string; field?: string }): null {
    if (this.isRLSError(error)) {
      const key = `${context.table}-${context.field}`

      // Only warn once per field to avoid console spam
      if (!this.warnedFields.has(key)) {
        this.warnedFields.add(key)
        console.warn(
          `⚠️ RLS policy needs update for ${context.table}.${context.field}. ` +
            `Run fix-hera-dna-auth-rls.sql in Supabase Dashboard.`
        )
      }

      return null
    }

    // Re-throw non-RLS errors
    throw error
  }

  /**
   * Wrap a Supabase query to handle RLS errors
   */
  static async wrapQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    context: { table?: string; field?: string }
  ): Promise<T | null> {
    try {
      const { data, error } = await queryFn()

      if (error) {
        // Handle no rows found as null (not an error)
        if (error.code === 'PGRST116') {
          return null
        }

        // Handle RLS errors gracefully
        if (this.isRLSError(error)) {
          return this.handleError(error, context)
        }

        throw error
      }

      return data
    } catch (err) {
      // Handle RLS errors at the top level
      if (this.isRLSError(err)) {
        return this.handleError(err, context)
      }

      throw err
    }
  }
}

// Export for convenient use
export const handleRLSError = RLSErrorHandler.handleError.bind(RLSErrorHandler)
export const wrapRLSQuery = RLSErrorHandler.wrapQuery.bind(RLSErrorHandler)
export const isRLSError = RLSErrorHandler.isRLSError.bind(RLSErrorHandler)
