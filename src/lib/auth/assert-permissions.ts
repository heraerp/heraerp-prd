import { createClient } from '@/lib/supabase/server'

export type AllowedRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF'

export async function assertUserHasRole(allowedRoles: AllowedRole[]) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Not authenticated')
  }

  // Get user's role from metadata or database
  // This should match your actual role implementation
  const userRole = (user.user_metadata?.role as string) || 'STAFF'
  
  if (!allowedRoles.includes(userRole as AllowedRole)) {
    throw new Error(`Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`)
  }
  
  return { user, role: userRole }
}

export async function assertOwnerOrAdmin() {
  return assertUserHasRole(['OWNER', 'ADMIN'])
}

export async function assertManagerOrAbove() {
  return assertUserHasRole(['OWNER', 'ADMIN', 'MANAGER'])
}