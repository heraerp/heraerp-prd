export type UserRole = 'owner' | 'manager' | 'grader' | 'staff' | 'receptionist' | 'viewer'

// Grading-specific permissions
export const canIssueCertificate = (role: UserRole | undefined | null) =>
  role === 'owner' || role === 'manager' || role === 'grader'

export const canEditGradingJob = (role: UserRole | undefined | null) =>
  role === 'owner' || role === 'manager' || role === 'grader'

export const canDeleteGradingJob = (role: UserRole | undefined | null) =>
  role === 'owner' || role === 'manager'

// Additional jewelry-specific permissions
export const canViewFinancials = (role: UserRole | undefined | null) =>
  role === 'owner' || role === 'manager'

export const canManageInventory = (role: UserRole | undefined | null) =>
  role === 'owner' || role === 'manager' || role === 'staff'

export const canViewAllAppraisals = (role: UserRole | undefined | null) =>
  role === 'owner' || role === 'manager' || role === 'grader'

export const canExportData = (role: UserRole | undefined | null) =>
  role === 'owner' || role === 'manager'

// Role hierarchy helpers
export const getRoleLevel = (role: UserRole | undefined | null): number => {
  switch (role) {
    case 'owner':
      return 6
    case 'manager':
      return 5
    case 'grader':
      return 4
    case 'staff':
      return 3
    case 'receptionist':
      return 2
    case 'viewer':
      return 1
    default:
      return 0
  }
}

export const hasHigherOrEqualRole = (
  userRole: UserRole | undefined | null,
  requiredRole: UserRole
): boolean => getRoleLevel(userRole) >= getRoleLevel(requiredRole)
