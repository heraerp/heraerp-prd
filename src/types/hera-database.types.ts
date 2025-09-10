// HERA Database Types - Auto-generated from actual schema
// Generated: 2025-09-10T22:51:38.644Z
// Run 'node mcp-server/schema-introspection.js' to update

// Utility Types
export type EntityStatus = 'active' | 'inactive' | 'deleted' | 'draft'
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed'

// Type Guards
export const isDeleted = (entity: { status?: string }): boolean => 
  entity.status === 'deleted'

export const isActive = (entity: { status?: string }): boolean => 
  entity.status !== 'deleted' && entity.status !== 'inactive'

// Column existence helpers
export const hasColumn = (obj: any, column: string): boolean => 
  obj && typeof obj === 'object' && column in obj
