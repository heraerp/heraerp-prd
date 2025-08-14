// HERA BPO Role-Based Authentication System
// Extends existing progressive auth with BPO-specific roles

import { BPOUserRole } from './bpo-entities'

export interface BPOUser {
  id: string
  name: string
  email: string
  role: BPOUserRole
  organization_id: string
  department?: string
  
  // BPO-specific properties
  shift?: 'morning' | 'afternoon' | 'night' | 'flexible'
  specializations?: string[]  // e.g., ['vendor_invoices', 'expense_reports', 'complex_audits']
  experience_level?: 'junior' | 'senior' | 'expert'
  
  // Performance metrics
  current_workload?: number
  average_processing_time?: number
  quality_score?: number
  sla_compliance_rate?: number
  
  // Access permissions
  can_escalate?: boolean
  can_approve_high_value?: boolean
  max_invoice_amount?: number
  
  created_at: Date
  last_login?: Date
  status: 'active' | 'inactive' | 'on_leave'
}

// Role-based permissions matrix
export interface BPOPermissions {
  // Invoice management
  can_submit_invoice: boolean
  can_view_all_invoices: boolean
  can_edit_invoice_details: boolean
  can_delete_invoice: boolean
  can_bulk_upload: boolean
  
  // Processing workflow
  can_claim_from_queue: boolean
  can_process_invoice: boolean
  can_verify_work: boolean
  can_approve_completion: boolean
  can_reject_work: boolean
  
  // Communication
  can_raise_query: boolean
  can_respond_to_query: boolean
  can_escalate_issue: boolean
  can_close_thread: boolean
  
  // Analytics and reporting
  can_view_team_analytics: boolean
  can_view_individual_analytics: boolean
  can_export_reports: boolean
  can_view_audit_trail: boolean
  
  // System administration
  can_manage_users: boolean
  can_configure_sla: boolean
  can_access_system_settings: boolean
}

// Get permissions based on role
export function getBPOPermissions(role: BPOUserRole): BPOPermissions {
  const permissions: Record<BPOUserRole, BPOPermissions> = {
    'head-office': {
      // Invoice management
      can_submit_invoice: true,
      can_view_all_invoices: false, // Only own organization's invoices
      can_edit_invoice_details: true,
      can_delete_invoice: true,
      can_bulk_upload: true,
      
      // Processing workflow
      can_claim_from_queue: false,
      can_process_invoice: false,
      can_verify_work: false,
      can_approve_completion: true,
      can_reject_work: true,
      
      // Communication
      can_raise_query: false, // BO raises queries to HO
      can_respond_to_query: true,
      can_escalate_issue: true,
      can_close_thread: true,
      
      // Analytics and reporting
      can_view_team_analytics: false,
      can_view_individual_analytics: true, // Own performance
      can_export_reports: true,
      can_view_audit_trail: true,
      
      // System administration
      can_manage_users: false,
      can_configure_sla: false,
      can_access_system_settings: false
    },
    
    'back-office': {
      // Invoice management
      can_submit_invoice: false,
      can_view_all_invoices: true, // Can see all assigned work
      can_edit_invoice_details: false,
      can_delete_invoice: false,
      can_bulk_upload: false,
      
      // Processing workflow
      can_claim_from_queue: true,
      can_process_invoice: true,
      can_verify_work: true,
      can_approve_completion: false, // Only HO approves
      can_reject_work: false,
      
      // Communication
      can_raise_query: true,
      can_respond_to_query: true,
      can_escalate_issue: true,
      can_close_thread: false, // Only HO closes
      
      // Analytics and reporting
      can_view_team_analytics: false,
      can_view_individual_analytics: true,
      can_export_reports: false,
      can_view_audit_trail: true,
      
      // System administration
      can_manage_users: false,
      can_configure_sla: false,
      can_access_system_settings: false
    },
    
    'supervisor': {
      // Invoice management
      can_submit_invoice: false,
      can_view_all_invoices: true,
      can_edit_invoice_details: true,
      can_delete_invoice: false,
      can_bulk_upload: false,
      
      // Processing workflow
      can_claim_from_queue: true,
      can_process_invoice: true,
      can_verify_work: true,
      can_approve_completion: true,
      can_reject_work: true,
      
      // Communication
      can_raise_query: true,
      can_respond_to_query: true,
      can_escalate_issue: true,
      can_close_thread: true,
      
      // Analytics and reporting
      can_view_team_analytics: true,
      can_view_individual_analytics: true,
      can_export_reports: true,
      can_view_audit_trail: true,
      
      // System administration
      can_manage_users: true,
      can_configure_sla: true,
      can_access_system_settings: false
    },
    
    'admin': {
      // Full permissions for system admin
      can_submit_invoice: true,
      can_view_all_invoices: true,
      can_edit_invoice_details: true,
      can_delete_invoice: true,
      can_bulk_upload: true,
      
      can_claim_from_queue: true,
      can_process_invoice: true,
      can_verify_work: true,
      can_approve_completion: true,
      can_reject_work: true,
      
      can_raise_query: true,
      can_respond_to_query: true,
      can_escalate_issue: true,
      can_close_thread: true,
      
      can_view_team_analytics: true,
      can_view_individual_analytics: true,
      can_export_reports: true,
      can_view_audit_trail: true,
      
      can_manage_users: true,
      can_configure_sla: true,
      can_access_system_settings: true
    }
  }
  
  return permissions[role]
}

// Permission checking utility
export function hasPermission(user: BPOUser, permission: keyof BPOPermissions): boolean {
  const permissions = getBPOPermissions(user.role)
  return permissions[permission]
}

// Check if user can access specific invoice
export function canAccessInvoice(user: BPOUser, invoiceOrgId: string, assignedUserId?: string): boolean {
  // Head office users can only access their own organization's invoices
  if (user.role === 'head-office') {
    return user.organization_id === invoiceOrgId
  }
  
  // Back office users can access invoices assigned to them or unassigned from their department
  if (user.role === 'back-office') {
    return !assignedUserId || assignedUserId === user.id
  }
  
  // Supervisors and admins can access all invoices
  return user.role === 'supervisor' || user.role === 'admin'
}

// Mock users for development/demo
export const MOCK_BPO_USERS: BPOUser[] = [
  // Head Office users
  {
    id: 'ho-user-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'head-office',
    organization_id: 'org-acme-corp',
    department: 'Finance',
    shift: 'morning',
    experience_level: 'senior',
    current_workload: 12,
    quality_score: 95,
    sla_compliance_rate: 98,
    can_approve_high_value: true,
    max_invoice_amount: 50000,
    created_at: new Date('2024-01-15'),
    last_login: new Date(),
    status: 'active'
  },
  {
    id: 'ho-user-2',
    name: 'Michael Chen',
    email: 'michael.chen@techstart.com',
    role: 'head-office',
    organization_id: 'org-techstart',
    department: 'Operations',
    shift: 'flexible',
    experience_level: 'expert',
    current_workload: 8,
    quality_score: 97,
    sla_compliance_rate: 99,
    can_approve_high_value: true,
    max_invoice_amount: 100000,
    created_at: new Date('2023-11-20'),
    last_login: new Date(),
    status: 'active'
  },
  
  // Back Office users
  {
    id: 'bo-user-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@bposervice.com',
    role: 'back-office',
    organization_id: 'org-bpo-service',
    department: 'Invoice Processing',
    shift: 'morning',
    specializations: ['vendor_invoices', 'expense_reports'],
    experience_level: 'senior',
    current_workload: 23,
    average_processing_time: 45, // minutes
    quality_score: 94,
    sla_compliance_rate: 96,
    created_at: new Date('2024-02-01'),
    last_login: new Date(),
    status: 'active'
  },
  {
    id: 'bo-user-2',
    name: 'James Wilson',
    email: 'james.wilson@bposervice.com',
    role: 'back-office',
    organization_id: 'org-bpo-service',
    department: 'Quality Assurance',
    shift: 'afternoon',
    specializations: ['complex_audits', 'compliance_review'],
    experience_level: 'expert',
    current_workload: 15,
    average_processing_time: 32,
    quality_score: 98,
    sla_compliance_rate: 99,
    can_escalate: true,
    created_at: new Date('2023-09-15'),
    last_login: new Date(),
    status: 'active'
  },
  
  // Supervisor
  {
    id: 'sup-user-1',
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@bposervice.com',
    role: 'supervisor',
    organization_id: 'org-bpo-service',
    department: 'Operations Management',
    shift: 'flexible',
    experience_level: 'expert',
    current_workload: 5,
    quality_score: 99,
    sla_compliance_rate: 100,
    can_escalate: true,
    can_approve_high_value: true,
    max_invoice_amount: 250000,
    created_at: new Date('2023-05-10'),
    last_login: new Date(),
    status: 'active'
  }
]

// Get mock user by ID
export function getMockBPOUser(userId: string): BPOUser | null {
  return MOCK_BPO_USERS.find(user => user.id === userId) || null
}

// Get mock users by role
export function getMockBPOUsersByRole(role: BPOUserRole): BPOUser[] {
  return MOCK_BPO_USERS.filter(user => user.role === role)
}

// Simulate authentication
export function authenticateBPOUser(email: string, role?: BPOUserRole): BPOUser | null {
  let user = MOCK_BPO_USERS.find(u => u.email === email)
  
  // If no user found but role specified, create a demo user
  if (!user && role) {
    const orgId = role === 'head-office' ? 'org-demo-client' : 'org-bpo-service'
    user = {
      id: `demo-${role}-${Date.now()}`,
      name: `Demo ${role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} User`,
      email,
      role,
      organization_id: orgId,
      department: role === 'head-office' ? 'Finance' : 'Processing',
      experience_level: 'senior',
      current_workload: role === 'head-office' ? 5 : 15,
      quality_score: 92,
      sla_compliance_rate: 95,
      created_at: new Date(),
      status: 'active'
    }
  }
  
  return user
}

// Role switching for demo purposes
export function switchBPORole(currentRole: BPOUserRole): BPOUserRole {
  const roles: BPOUserRole[] = ['head-office', 'back-office', 'supervisor', 'admin']
  const currentIndex = roles.indexOf(currentRole)
  const nextIndex = (currentIndex + 1) % roles.length
  return roles[nextIndex]
}

// Generate organization-specific invoice access
export function getAccessibleOrganizations(user: BPOUser): string[] {
  if (user.role === 'head-office') {
    return [user.organization_id]
  }
  
  if (user.role === 'back-office') {
    // Back office can see invoices from all client organizations they're assigned to
    return ['org-acme-corp', 'org-techstart', 'org-retail-chain', 'org-manufacturing']
  }
  
  // Supervisors and admins can see all
  return ['*']
}

export default {
  getBPOPermissions,
  hasPermission,
  canAccessInvoice,
  authenticateBPOUser,
  getMockBPOUser,
  getMockBPOUsersByRole,
  switchBPORole,
  getAccessibleOrganizations,
  MOCK_BPO_USERS
}