/**
 * HERA Universal Authentication System
 * Smart Code: HERA.AUTH.UNIVERSAL.SYSTEM.v1
 * 
 * World-class authentication that handles:
 * 1. Supabase user registration/login
 * 2. User entity creation in platform org
 * 3. Organization membership via hera_organization_crud_v1
 * 4. App registration via hera_apps_register_v1
 * 5. Shared authorization across entire app
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Environment-aware Supabase configuration
const getSupabaseConfig = () => {
  const isDev = process.env.NODE_ENV === 'development'
  
  return {
    url: isDev 
      ? process.env.NEXT_PUBLIC_SUPABASE_URL! 
      : process.env.NEXT_PUBLIC_SUPABASE_PRODUCTION_URL!,
    anonKey: isDev 
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_PRODUCTION_ANON_KEY!
  }
}

const { url, anonKey } = getSupabaseConfig()
export const supabase = createClient(url, anonKey)

// Constants
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

// Types
export interface HERAUser {
  id: string
  email: string
  entity_id: string
  profile?: {
    full_name?: string
    avatar_url?: string
    role?: string
  }
}

export interface HERAOrganization {
  id: string
  name: string
  slug: string
  type: string
  status: 'active' | 'inactive' | 'suspended'
  metadata?: Record<string, any>
}

export interface HERAAuthState {
  // Authentication state
  isAuthenticated: boolean
  isLoading: boolean
  session: Session | null
  user: HERAUser | null
  
  // Organization state
  organizations: HERAOrganization[]
  currentOrganization: HERAOrganization | null
  
  // App state
  registeredApps: string[]
  currentApp: string | null
  
  // JWT token for API calls
  accessToken: string | null
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  selectOrganization: (orgId: string) => Promise<void>
  registerApp: (appName: string, orgId?: string) => Promise<void>
  refreshAuth: () => Promise<void>
  
  // Internal actions
  setSession: (session: Session | null) => void
  setUser: (user: HERAUser | null) => void
  setOrganizations: (orgs: HERAOrganization[]) => void
  setCurrentOrganization: (org: HERAOrganization | null) => void
}

// Main auth store
export const useHERAAuth = create<HERAAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: true,
      session: null,
      user: null,
      organizations: [],
      currentOrganization: null,
      registeredApps: [],
      currentApp: null,
      accessToken: null,

      // Sign in with complete HERA flow
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          
          // 1. Supabase authentication
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (authError) {
            return { success: false, error: authError.message }
          }
          
          if (!authData.session || !authData.user) {
            return { success: false, error: 'No session created' }
          }
          
          // 2. Introspect user entity
          const userEntity = await introspectUser(authData.session.access_token)
          if (!userEntity.success) {
            return { success: false, error: userEntity.error }
          }
          
          // 3. Load user organizations
          const orgs = await loadUserOrganizations(authData.session.access_token, userEntity.entity_id!)
          
          // 4. Update state
          set({
            isAuthenticated: true,
            isLoading: false,
            session: authData.session,
            user: {
              id: authData.user.id,
              email: authData.user.email!,
              entity_id: userEntity.entity_id!,
              profile: authData.user.user_metadata
            },
            organizations: orgs,
            accessToken: authData.session.access_token
          })
          
          return { success: true }
          
        } catch (error) {
          console.error('Sign in error:', error)
          set({ isLoading: false })
          return { success: false, error: 'Sign in failed' }
        }
      },

      // Sign up with complete HERA flow
      signUp: async (email: string, password: string, metadata = {}) => {
        try {
          set({ isLoading: true })
          
          // 1. Supabase user creation
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata
            }
          })
          
          if (authError) {
            return { success: false, error: authError.message }
          }
          
          if (!authData.session || !authData.user) {
            return { success: false, error: 'Please check your email to confirm your account' }
          }
          
          // 2. Create user entity in platform org
          const userEntity = await createUserEntity(authData.session.access_token, {
            auth_user_id: authData.user.id,
            email: authData.user.email!,
            metadata
          })
          
          if (!userEntity.success) {
            return { success: false, error: userEntity.error }
          }
          
          // 3. Update state
          set({
            isAuthenticated: true,
            isLoading: false,
            session: authData.session,
            user: {
              id: authData.user.id,
              email: authData.user.email!,
              entity_id: userEntity.entity_id!,
              profile: metadata
            },
            organizations: [],
            accessToken: authData.session.access_token
          })
          
          return { success: true }
          
        } catch (error) {
          console.error('Sign up error:', error)
          set({ isLoading: false })
          return { success: false, error: 'Sign up failed' }
        }
      },

      // Sign out
      signOut: async () => {
        await supabase.auth.signOut()
        set({
          isAuthenticated: false,
          isLoading: false,
          session: null,
          user: null,
          organizations: [],
          currentOrganization: null,
          registeredApps: [],
          currentApp: null,
          accessToken: null
        })
      },

      // Select organization and register membership
      selectOrganization: async (orgId: string) => {
        try {
          const { user, accessToken } = get()
          if (!user || !accessToken) throw new Error('No authenticated user')
          
          // Register membership if not exists
          await registerOrganizationMembership(accessToken, user.entity_id, orgId)
          
          // Find and set organization
          const orgs = get().organizations
          const org = orgs.find(o => o.id === orgId)
          if (org) {
            set({ currentOrganization: org })
          }
          
        } catch (error) {
          console.error('Organization selection error:', error)
        }
      },

      // Register app
      registerApp: async (appName: string, orgId?: string) => {
        try {
          const { user, accessToken, currentOrganization } = get()
          if (!user || !accessToken) throw new Error('No authenticated user')
          
          const targetOrgId = orgId || currentOrganization?.id
          if (!targetOrgId) throw new Error('No organization selected')
          
          await registerAppAccess(accessToken, user.entity_id, appName, targetOrgId)
          
          set(state => ({
            registeredApps: [...state.registeredApps, appName],
            currentApp: appName
          }))
          
        } catch (error) {
          console.error('App registration error:', error)
        }
      },

      // Refresh authentication state
      refreshAuth: async () => {
        try {
          set({ isLoading: true })
          
          const { data: { session } } = await supabase.auth.getSession()
          
          if (!session) {
            set({
              isAuthenticated: false,
              isLoading: false,
              session: null,
              user: null,
              organizations: [],
              currentOrganization: null,
              accessToken: null
            })
            return
          }
          
          // Refresh user data
          const userEntity = await introspectUser(session.access_token)
          if (userEntity.success) {
            const orgs = await loadUserOrganizations(session.access_token, userEntity.entity_id!)
            
            set({
              isAuthenticated: true,
              isLoading: false,
              session,
              user: {
                id: session.user.id,
                email: session.user.email!,
                entity_id: userEntity.entity_id!,
                profile: session.user.user_metadata
              },
              organizations: orgs,
              accessToken: session.access_token
            })
          }
          
        } catch (error) {
          console.error('Auth refresh error:', error)
          set({ isLoading: false })
        }
      },

      // Internal setters
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setOrganizations: (orgs) => set({ organizations: orgs }),
      setCurrentOrganization: (org) => set({ currentOrganization: org })
    }),
    {
      name: 'hera-auth-storage',
      partialize: (state) => ({
        user: state.user,
        currentOrganization: state.currentOrganization,
        organizations: state.organizations,
        registeredApps: state.registeredApps,
        currentApp: state.currentApp
      })
    }
  )
)

// RPC helper functions
async function callHERARPC(
  functionName: string, 
  params: Record<string, any>, 
  accessToken: string
) {
  const { data, error } = await supabase
    .rpc(functionName, params)
    .select('*')
    .single()
  
  if (error) {
    console.error(`RPC ${functionName} error:`, error)
    throw error
  }
  
  return data
}

// 1. User introspection
async function introspectUser(accessToken: string): Promise<{ success: boolean; entity_id?: string; error?: string }> {
  try {
    const result = await callHERARPC('hera_auth_introspect_v1', {
      p_access_token: accessToken
    }, accessToken)
    
    return { 
      success: true, 
      entity_id: result.user_entity_id 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to introspect user' 
    }
  }
}

// 2. Create user entity in platform org
async function createUserEntity(
  accessToken: string, 
  userData: { auth_user_id: string; email: string; metadata: Record<string, any> }
): Promise<{ success: boolean; entity_id?: string; error?: string }> {
  try {
    const result = await callHERARPC('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: userData.auth_user_id,
      p_organization_id: PLATFORM_ORG_ID,
      p_entity: {
        entity_type: 'USER',
        entity_name: userData.email,
        entity_code: userData.email.split('@')[0].toUpperCase(),
        smart_code: 'HERA.PLATFORM.USER.ENTITY.v1'
      },
      p_dynamic: {
        email: {
          field_type: 'email',
          field_value_text: userData.email,
          smart_code: 'HERA.PLATFORM.USER.FIELD.EMAIL.v1'
        },
        auth_user_id: {
          field_type: 'text',
          field_value_text: userData.auth_user_id,
          smart_code: 'HERA.PLATFORM.USER.FIELD.AUTH_ID.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    }, accessToken)
    
    return { 
      success: true, 
      entity_id: result.entity_id 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to create user entity' 
    }
  }
}

// 3. Load user organizations
async function loadUserOrganizations(accessToken: string, userEntityId: string): Promise<HERAOrganization[]> {
  try {
    const result = await callHERARPC('hera_organization_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: userEntityId,
      p_filters: {
        member_entity_id: userEntityId
      }
    }, accessToken)
    
    return result.organizations || []
  } catch (error) {
    console.error('Failed to load organizations:', error)
    return []
  }
}

// 4. Register organization membership
async function registerOrganizationMembership(
  accessToken: string, 
  userEntityId: string, 
  orgId: string
): Promise<void> {
  try {
    await callHERARPC('hera_organization_crud_v1', {
      p_action: 'ADD_MEMBER',
      p_actor_user_id: userEntityId,
      p_organization_id: orgId,
      p_member_entity_id: userEntityId,
      p_role: 'member'
    }, accessToken)
  } catch (error) {
    console.error('Failed to register membership:', error)
    throw error
  }
}

// 5. Register app access
async function registerAppAccess(
  accessToken: string,
  userEntityId: string, 
  appName: string, 
  orgId: string
): Promise<void> {
  try {
    await callHERARPC('hera_apps_register_v1', {
      p_actor_user_id: userEntityId,
      p_organization_id: orgId,
      p_app_name: appName,
      p_access_level: 'full'
    }, accessToken)
  } catch (error) {
    console.error('Failed to register app:', error)
    throw error
  }
}

// Initialize auth state on app start
if (typeof window !== 'undefined') {
  // Listen to auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    const { refreshAuth } = useHERAAuth.getState()
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      refreshAuth()
    } else if (event === 'SIGNED_OUT') {
      useHERAAuth.getState().signOut()
    }
  })
  
  // Initial auth check
  useHERAAuth.getState().refreshAuth()
}