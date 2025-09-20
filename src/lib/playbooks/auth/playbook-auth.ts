'use client'

/**
 * HERA Playbooks Authentication & Organization Context
 * 
 * Provides authentication state management and organization_id propagation
 * for all playbook operations using HERA's multi-tenant architecture.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { universalApi } from '@/lib/universal-api';

export interface PlaybookUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  entity_id?: string; // User as entity reference
}

export interface PlaybookOrganization {
  id: string;
  name: string;
  code: string;
  smart_code: string;
  metadata: {
    industry?: string;
    features_enabled?: string[];
    playbook_permissions?: Record<string, string[]>;
  };
}

export interface PlaybookAuthContext {
  // Authentication state
  user: PlaybookUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Organization context
  organization: PlaybookOrganization | null;
  organizationId: string | null;
  
  // Methods
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  
  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canExecutePlaybook: (playbookId: string) => boolean;
  canManagePlaybooks: () => boolean;
}

export interface PlaybookAuthState {
  user: PlaybookUser | null;
  organization: PlaybookOrganization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Playbook Authentication Service
 */
export class PlaybookAuthService {
  private state: PlaybookAuthState = {
    user: null,
    organization: null,
    isAuthenticated: false,
    isLoading: true
  };

  private listeners: Set<(state: PlaybookAuthState) => void> = new Set();

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication from stored session
   */
  private async initializeAuth(): Promise<void> {
    try {
      const sessionData = this.getStoredSession();
      
      if (sessionData) {
        await this.validateAndRestoreSession(sessionData);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Authenticate user with credentials
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      this.setState({ isLoading: true });

      // Authenticate with HERA universal system
      const authResult = await this.authenticateWithHERA(email, password);
      
      if (authResult.success) {
        const user = await this.getUserProfile(authResult.userId);
        const organization = await this.getUserOrganization(authResult.userId);
        
        // Set organization context in universal API
        if (organization) {
          universalApi.setOrganizationId(organization.id);
        }
        
        this.setState({
          user,
          organization,
          isAuthenticated: true,
          isLoading: false
        });

        this.storeSession(authResult.token, user, organization);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      this.setState({ isLoading: false });
      return false;
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      this.clearStoredSession();
      universalApi.clearOrganizationId();
      
      this.setState({
        user: null,
        organization: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * Switch to different organization
   */
  async switchOrganization(orgId: string): Promise<void> {
    try {
      this.setState({ isLoading: true });
      
      const organization = await this.getOrganization(orgId);
      
      if (organization) {
        universalApi.setOrganizationId(organization.id);
        
        this.setState({
          organization,
          isLoading: false
        });
        
        this.updateStoredSession({ organization });
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
      this.setState({ isLoading: false });
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    if (!this.state.user) return false;
    return this.state.user.permissions.includes(permission);
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    if (!this.state.user) return false;
    return this.state.user.roles.includes(role);
  }

  /**
   * Check if user can execute specific playbook
   */
  canExecutePlaybook(playbookId: string): boolean {
    if (!this.state.user || !this.state.organization) return false;
    
    const playbookPerms = this.state.organization.metadata.playbook_permissions;
    if (playbookPerms && playbookPerms[playbookId]) {
      return this.state.user.roles.some(role => 
        playbookPerms[playbookId].includes(role)
      );
    }
    
    // Default permission check
    return this.hasPermission('playbooks:execute');
  }

  /**
   * Check if user can manage playbooks
   */
  canManagePlaybooks(): boolean {
    return this.hasPermission('playbooks:manage') || this.hasRole('admin');
  }

  /**
   * Get current authentication state
   */
  getState(): PlaybookAuthState {
    return { ...this.state };
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: PlaybookAuthState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current organization ID for API calls
   */
  getOrganizationId(): string | null {
    return this.state.organization?.id || null;
  }

  // Private methods

  private setState(updates: Partial<PlaybookAuthState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  private async authenticateWithHERA(email: string, password: string): Promise<any> {
    // Simulate authentication - in production, this would call actual auth service
    return {
      success: true,
      userId: 'user_123',
      token: 'jwt_token_here',
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
  }

  private async getUserProfile(userId: string): Promise<PlaybookUser> {
    try {
      // Get user entity from HERA system
      const userEntity = await universalApi.getEntity(userId);
      
      // Get user roles and permissions from dynamic data
      const roles = await this.getUserRoles(userId);
      const permissions = await this.getUserPermissions(userId);
      
      return {
        id: userEntity.id,
        email: userEntity.metadata?.email || '',
        name: userEntity.entity_name,
        roles,
        permissions,
        entity_id: userEntity.id
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  private async getUserOrganization(userId: string): Promise<PlaybookOrganization | null> {
    try {
      // Get user's organization relationship
      const orgRelationship = await universalApi.queryRelationships({
        filters: {
          from_entity_id: userId,
          relationship_type: 'member_of'
        }
      });

      if (orgRelationship.data?.[0]) {
        const orgId = orgRelationship.data[0].to_entity_id;
        return this.getOrganization(orgId);
      }

      return null;
    } catch (error) {
      console.error('Failed to get user organization:', error);
      return null;
    }
  }

  private async getOrganization(orgId: string): Promise<PlaybookOrganization> {
    const org = await universalApi.getEntity(orgId);
    
    return {
      id: org.id,
      name: org.entity_name,
      code: org.entity_code || org.id,
      smart_code: org.smart_code,
      metadata: org.metadata || {}
    };
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    try {
      const roleRelationships = await universalApi.queryRelationships({
        filters: {
          from_entity_id: userId,
          relationship_type: 'has_role'
        }
      });

      const roleIds = roleRelationships.data?.map(rel => rel.to_entity_id) || [];
      const roles = await Promise.all(
        roleIds.map(id => universalApi.getEntity(id))
      );

      return roles.map(role => role.entity_code || role.entity_name);
    } catch (error) {
      console.error('Failed to get user roles:', error);
      return [];
    }
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Get permissions from dynamic data
      const permissionsData = await universalApi.getDynamicField(userId, 'permissions');
      
      if (permissionsData?.field_value_text) {
        return JSON.parse(permissionsData.field_value_text);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }

  private getStoredSession(): any {
    try {
      const sessionData = localStorage.getItem('hera_playbook_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  private storeSession(token: string, user: PlaybookUser, organization: PlaybookOrganization | null): void {
    const sessionData = {
      token,
      user,
      organization,
      timestamp: Date.now()
    };
    
    localStorage.setItem('hera_playbook_session', JSON.stringify(sessionData));
  }

  private updateStoredSession(updates: Partial<{ organization: PlaybookOrganization }>): void {
    const existing = this.getStoredSession();
    if (existing) {
      const updated = { ...existing, ...updates };
      localStorage.setItem('hera_playbook_session', JSON.stringify(updated));
    }
  }

  private clearStoredSession(): void {
    localStorage.removeItem('hera_playbook_session');
  }

  private async validateAndRestoreSession(sessionData: any): Promise<void> {
    // Validate session is not expired
    const isExpired = Date.now() - sessionData.timestamp > (24 * 60 * 60 * 1000);
    
    if (isExpired) {
      this.clearStoredSession();
      return;
    }

    // Restore state
    this.setState({
      user: sessionData.user,
      organization: sessionData.organization,
      isAuthenticated: true
    });

    // Set organization context
    if (sessionData.organization) {
      universalApi.setOrganizationId(sessionData.organization.id);
    }
  }
}

// Singleton instance
export const playbookAuthService = new PlaybookAuthService();

/**
 * Hook for using playbook authentication
 */
export function usePlaybookAuth(): PlaybookAuthContext {
  const [state, setState] = useState(playbookAuthService.getState());

  useEffect(() => {
    return playbookAuthService.subscribe(setState);
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    organization: state.organization,
    organizationId: state.organization?.id || null,
    
    login: playbookAuthService.login.bind(playbookAuthService),
    logout: playbookAuthService.logout.bind(playbookAuthService),
    refreshAuth: () => playbookAuthService.initializeAuth(),
    switchOrganization: playbookAuthService.switchOrganization.bind(playbookAuthService),
    
    hasPermission: playbookAuthService.hasPermission.bind(playbookAuthService),
    hasRole: playbookAuthService.hasRole.bind(playbookAuthService),
    canExecutePlaybook: playbookAuthService.canExecutePlaybook.bind(playbookAuthService),
    canManagePlaybooks: playbookAuthService.canManagePlaybooks.bind(playbookAuthService)
  };
}