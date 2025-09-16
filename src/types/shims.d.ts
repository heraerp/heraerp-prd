// Global shims to reduce TS noise without changing runtime behavior

// Third-party modules not typed or optional at runtime
declare module 'ioredis' {
  const Redis: any
  export = Redis
}

declare module 'intro.js' {
  export type IntroJs = any
  const introJs: any
  export default introJs
}

// Project-internal type modules that may be generated or missing in dev
declare module '@/types/database' {
  export type Database = any
}

declare module '@/types/hera-database.types' {
  export type CoreEntities = any
  export type CoreDynamicData = any
  export type CoreRelationships = any
  export type UniversalTransactions = any
  export type UniversalTransactionLines = any
  export type UniversalTransaction = any
  export type UniversalTransactionLine = any
}

declare module '@/types/universal.types' {
  export type UniversalMetadata = any
  export type ProcessingMetadata = any
  export type TransactionMetadata = any
}

// Universal API surface is extended widely in app code; types can be lax here
declare module '@/lib/universal-api' {
  export type ApiResponse = any
  export interface UniversalAPIExtended {
    [key: string]: any
  }
  export const universalApi: any
  export const UniversalAPIClient: any
}

// DNA components shims referenced by examples
declare module '@/src/lib/dna/components/enterprise/EnterpriseDashboard' {
  export const EnterpriseDashboard: any
  export type EnterpriseDashboardProps = any
}

// Next.js headers shim for older usage patterns
declare module 'next/headers' {
  export type ReadonlyHeaders = any
}

// Allow importing JSON and unknown assets without type errors
declare module '*.json' {
  const value: any
  export default value
}
declare module '*.md' {
  const value: string
  export default value
}
