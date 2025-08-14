'use client'

// Progressive authentication system for HERA
// Supports anonymous workspaces that can be upgraded to identified users

export interface ProgressiveWorkspace {
  id: string
  name: string
  type: string
  isAnonymous: boolean
  createdAt: string
  expiresAt?: string
}

export interface ProgressiveAuthState {
  workspace: ProgressiveWorkspace | null
  isAnonymous: boolean
  isIdentified: boolean
  isRegistered: boolean
  daysRemaining: number
  canUpgrade: boolean
  isAuthenticated?: boolean
  userId?: string
  sessionToken?: string
}

// In-memory store for demo purposes
let progressiveState: ProgressiveAuthState = {
  workspace: null,
  isAnonymous: false,
  isIdentified: false,
  isRegistered: false,
  daysRemaining: 0,
  canUpgrade: false,
  isAuthenticated: false
}

// Create or get anonymous workspace
export async function getOrCreateAnonymousWorkspace(businessType: string = 'demo'): Promise<ProgressiveWorkspace> {
  const workspaceId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const workspace: ProgressiveWorkspace = {
    id: workspaceId,
    name: `${businessType.charAt(0).toUpperCase() + businessType.slice(1)} Demo`,
    type: businessType,
    isAnonymous: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  }

  const expiresAt = new Date(workspace.expiresAt || '')
  const now = new Date()
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  
  progressiveState = {
    workspace,
    isAnonymous: true,
    isIdentified: false,
    isRegistered: false,
    daysRemaining,
    canUpgrade: true,
    isAuthenticated: true,
    sessionToken: `anon_token_${workspaceId}`
  }

  return workspace
}

// Get current progressive auth state
export function getProgressiveAuthState(): ProgressiveAuthState {
  return progressiveState
}

// Upgrade anonymous workspace to identified user
export async function upgradeToIdentified(
  email: string, 
  name: string, 
  workspaceData?: any
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    if (!progressiveState.workspace) {
      return { success: false, error: 'No anonymous workspace to upgrade' }
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Update progressive state
    const updatedWorkspace = {
      ...progressiveState.workspace,
      isAnonymous: false,
      name: workspaceData?.organizationName || progressiveState.workspace.name
    }
    
    const expiresAt = new Date(updatedWorkspace.expiresAt || '')
    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    
    progressiveState = {
      workspace: updatedWorkspace,
      isAnonymous: false,
      isIdentified: true,
      isRegistered: false,
      daysRemaining,
      canUpgrade: true,
      isAuthenticated: true,
      userId,
      sessionToken: `auth_token_${userId}`
    }

    return { success: true, userId }
  } catch (error) {
    return { success: false, error: 'Failed to upgrade workspace' }
  }
}

// Complete registration process
export async function completeRegistration(
  userData: {
    email: string
    name: string
    organizationName?: string
    organizationType?: string
  }
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const user = {
      id: userId,
      email: userData.email,
      name: userData.name,
      organizationName: userData.organizationName,
      organizationType: userData.organizationType,
      createdAt: new Date().toISOString()
    }

    // Update progressive state
    progressiveState = {
      workspace: {
        id: `workspace_${userId}`,
        name: userData.organizationName || 'My Organization',
        type: userData.organizationType || 'business',
        isAnonymous: false,
        createdAt: new Date().toISOString()
      },
      isAnonymous: false,
      isIdentified: true,
      isRegistered: true,
      daysRemaining: 365, // Full year for registered users
      canUpgrade: false,
      isAuthenticated: true,
      userId,
      sessionToken: `auth_token_${userId}`
    }

    return { success: true, user }
  } catch (error) {
    return { success: false, error: 'Registration failed' }
  }
}

// Clear workspace (logout)
export function clearWorkspace(): void {
  progressiveState = {
    workspace: null,
    isAnonymous: false,
    isIdentified: false,
    isRegistered: false,
    daysRemaining: 0,
    canUpgrade: false,
    isAuthenticated: false
  }
}

// Validate session token
export function validateProgressiveSession(token?: string): boolean {
  if (!token) return false
  return progressiveState.sessionToken === token
}