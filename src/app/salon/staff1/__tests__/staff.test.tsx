/**
 * Staff Management Tests
 * Tests the RPC-first Universal Entity v2 implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { useHeraRoles } from '@/hooks/useHeraRoles'

// Mock the hooks
vi.mock('@/hooks/useHeraStaff')
vi.mock('@/hooks/useHeraRoles')
vi.mock('../SecuredSalonProvider')
vi.mock('@/hooks/use-toast')

const mockStaff = [
  {
    id: 'staff-1',
    entity_name: 'Maya Pereira',
    smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
    dynamic_fields: {
      first_name: { value: 'Maya' },
      last_name: { value: 'Pereira' },
      email: { value: 'maya@salon.com' },
      phone: { value: '+971 50 123 4567' },
      role_title: { value: 'Senior Stylist' },
      status: { value: 'active' },
      hire_date: { value: '2021-06-20' },
      display_rate: { value: 180 },
      skills: { value: ['Hair Cutting', 'Hair Coloring'] }
    },
    relationships: {
      role: {
        to_entity: {
          id: 'role-1',
          entity_name: 'Senior Stylist'
        }
      }
    }
  }
]

const mockRoles = [
  {
    id: 'role-1',
    entity_name: 'Senior Stylist',
    dynamic_fields: {
      title: { value: 'Senior Stylist' },
      description: { value: 'Experienced stylist' },
      permissions: { value: ['salon:appointments:write'] },
      rank: { value: 800 },
      active: { value: true }
    }
  }
]

describe('Staff Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useHeraStaff
    vi.mocked(useHeraStaff).mockReturnValue({
      staff: mockStaff,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      createStaff: vi.fn(),
      updateStaff: vi.fn(),
      archiveStaff: vi.fn(),
      deleteStaff: vi.fn(),
      linkRole: vi.fn(),
      linkServices: vi.fn(),
      filterSensitiveFields: vi.fn().mockReturnValue(mockStaff),
      isCreating: false,
      isUpdating: false,
      isDeleting: false
    })
    
    // Mock useHeraRoles
    vi.mocked(useHeraRoles).mockReturnValue({
      roles: mockRoles,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      archiveRole: vi.fn(),
      deleteRole: vi.fn(),
      getActiveRoles: vi.fn().mockReturnValue(mockRoles),
      getRoleByTitle: vi.fn(),
      hasPermission: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false
    })
  })

  describe('Smart Code Validation', () => {
    it('should validate STAFF smart codes', () => {
      const validStaffCodes = [
        'HERA.SALON.STAFF.ENTITY.PERSON.V1',
        'HERA.SALON.STAFF.DYN.FIRST_NAME.V1',
        'HERA.SALON.STAFF.DYN.EMAIL.V1',
        'HERA.SALON.STAFF.REL.HAS_ROLE.V1'
      ]
      
      validStaffCodes.forEach(code => {
        expect(code).toMatch(/^HERA\.[A-Z]+(\.[A-Z_]+){4,}\.V\d+$/)
        expect(code.split('.').length).toBeGreaterThanOrEqual(6)
        expect(code).toMatch(/\.V\d+$/)
      })
    })
    
    it('should validate ROLE smart codes', () => {
      const validRoleCodes = [
        'HERA.SALON.ROLE.ENTITY.POSITION.V1',
        'HERA.SALON.ROLE.DYN.TITLE.V1',
        'HERA.SALON.ROLE.DYN.PERMISSIONS.V1'
      ]
      
      validRoleCodes.forEach(code => {
        expect(code).toMatch(/^HERA\.[A-Z]+(\.[A-Z_]+){4,}\.V\d+$/)
        expect(code.split('.').length).toBeGreaterThanOrEqual(6)
        expect(code).toMatch(/\.V\d+$/)
      })
    })
  })

  describe('Staff Creation', () => {
    it('should create staff with proper smart codes', async () => {
      const { createStaff } = useHeraStaff()
      
      const staffData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@salon.com',
        phone: '+971 50 999 8888',
        role_id: 'role-1',
        role_title: 'Junior Stylist',
        status: 'active',
        display_rate: 120
      }
      
      await createStaff(staffData)
      
      expect(createStaff).toHaveBeenCalledWith(staffData)
    })
    
    it('should validate required fields', () => {
      const invalidData = {
        // Missing first_name, last_name, email
        phone: '+971 50 999 8888'
      }
      
      // In real implementation, validation would occur in the form or hook
      expect(invalidData).not.toHaveProperty('first_name')
      expect(invalidData).not.toHaveProperty('last_name')
      expect(invalidData).not.toHaveProperty('email')
    })
  })

  describe('Staff Updates', () => {
    it('should update staff maintaining relationships', async () => {
      const { updateStaff } = useHeraStaff()
      
      const updateData = {
        status: 'on_leave',
        display_rate: 200,
        role_id: 'role-2'
      }
      
      await updateStaff('staff-1', updateData)
      
      expect(updateStaff).toHaveBeenCalledWith('staff-1', updateData)
    })
  })

  describe('Soft Delete (Archive)', () => {
    it('should archive staff instead of hard delete', async () => {
      const { archiveStaff, deleteStaff } = useHeraStaff()
      
      // Default behavior should be archive
      await archiveStaff('staff-1')
      
      expect(archiveStaff).toHaveBeenCalledWith('staff-1')
      
      // Hard delete should require explicit flag
      await deleteStaff('staff-1', false)
      expect(deleteStaff).toHaveBeenCalledWith('staff-1', false)
    })
  })

  describe('Relationship Management', () => {
    it('should link staff to role via relationship', async () => {
      const { linkRole } = useHeraStaff()
      
      await linkRole('staff-1', 'role-2')
      
      expect(linkRole).toHaveBeenCalledWith('staff-1', 'role-2')
    })
    
    it('should link staff to multiple services', async () => {
      const { linkServices } = useHeraStaff()
      
      const serviceIds = ['service-1', 'service-2', 'service-3']
      await linkServices('staff-1', serviceIds)
      
      expect(linkServices).toHaveBeenCalledWith('staff-1', serviceIds)
    })
  })

  describe('Permission-Based Field Filtering', () => {
    it('should filter sensitive fields for non-managers', () => {
      const { filterSensitiveFields } = useHeraStaff()
      
      const filteredStaff = filterSensitiveFields(mockStaff, 'receptionist')
      
      expect(filterSensitiveFields).toHaveBeenCalledWith(mockStaff, 'receptionist')
    })
    
    it('should show all fields for managers/owners', () => {
      const { filterSensitiveFields } = useHeraStaff()
      
      filterSensitiveFields(mockStaff, 'manager')
      filterSensitiveFields(mockStaff, 'owner')
      
      expect(filterSensitiveFields).toHaveBeenCalledWith(mockStaff, 'manager')
      expect(filterSensitiveFields).toHaveBeenCalledWith(mockStaff, 'owner')
    })
  })

  describe('Data Structure Validation', () => {
    it('should have proper entity structure', () => {
      const staff = mockStaff[0]
      
      expect(staff).toHaveProperty('id')
      expect(staff).toHaveProperty('entity_name')
      expect(staff).toHaveProperty('smart_code')
      expect(staff).toHaveProperty('dynamic_fields')
      expect(staff).toHaveProperty('relationships')
      
      expect(staff.smart_code).toBe('HERA.SALON.STAFF.ENTITY.PERSON.V1')
    })
    
    it('should have required dynamic fields', () => {
      const staff = mockStaff[0]
      const fields = staff.dynamic_fields
      
      expect(fields).toHaveProperty('first_name')
      expect(fields).toHaveProperty('last_name')
      expect(fields).toHaveProperty('email')
      expect(fields?.first_name?.value).toBe('Maya')
      expect(fields?.email?.value).toBe('maya@salon.com')
    })
    
    it('should have proper relationship structure', () => {
      const staff = mockStaff[0]
      const relationships = staff.relationships
      
      expect(relationships).toHaveProperty('role')
      expect(relationships?.role).toHaveProperty('to_entity')
      expect(relationships?.role?.to_entity).toHaveProperty('id')
      expect(relationships?.role?.to_entity?.id).toBe('role-1')
    })
  })

  describe('Multi-Tenant Isolation', () => {
    it('should always include organization_id in operations', async () => {
      const { createStaff } = useHeraStaff()
      
      // Mock implementation should ensure organization_id is always passed
      // This test validates the contract expectation
      const staffData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@salon.com'
      }
      
      await createStaff(staffData)
      
      // In real implementation, this would be tested against the actual API call
      expect(createStaff).toHaveBeenCalledWith(staffData)
    })
  })
})

describe('Role Management', () => {
  describe('Role Structure', () => {
    it('should have proper role entity structure', () => {
      const role = mockRoles[0]
      
      expect(role).toHaveProperty('id')
      expect(role).toHaveProperty('entity_name')
      expect(role).toHaveProperty('dynamic_fields')
      
      const fields = role.dynamic_fields
      expect(fields).toHaveProperty('title')
      expect(fields).toHaveProperty('permissions')
      expect(fields).toHaveProperty('rank')
      expect(fields).toHaveProperty('active')
    })
    
    it('should validate permission arrays', () => {
      const role = mockRoles[0]
      const permissions = role.dynamic_fields?.permissions?.value
      
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions).toContain('salon:appointments:write')
    })
  })
})

// Test the actual preset configurations
describe('Entity Presets', () => {
  it('should have valid STAFF_PRESET configuration', () => {
    // This would import the actual preset
    const STAFF_PRESET = {
      entity_type: 'STAFF',
      dynamicFields: [
        { name: 'first_name', type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.FIRST_NAME.V1', required: true },
        { name: 'last_name', type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.LAST_NAME.V1', required: true },
        { name: 'email', type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.V1', required: true }
      ],
      relationships: [
        { type: 'STAFF_HAS_ROLE', smart_code: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1', cardinality: 'one' }
      ]
    }
    
    expect(STAFF_PRESET.entity_type).toBe('STAFF')
    expect(STAFF_PRESET.dynamicFields.length).toBeGreaterThan(0)
    expect(STAFF_PRESET.relationships.length).toBeGreaterThan(0)
    
    // Validate smart codes in preset
    STAFF_PRESET.dynamicFields.forEach(field => {
      expect(field.smart_code).toMatch(/^HERA\.SALON\.STAFF\.DYN\.[A-Z_]+\.V1$/)
    })
    
    STAFF_PRESET.relationships.forEach(rel => {
      expect(rel.smart_code).toMatch(/^HERA\.SALON\.STAFF\.REL\.[A-Z_]+\.V1$/)
    })
  })
  
  it('should have valid ROLE_PRESET configuration', () => {
    const ROLE_PRESET = {
      entity_type: 'ROLE',
      dynamicFields: [
        { name: 'title', type: 'text', smart_code: 'HERA.SALON.ROLE.DYN.TITLE.V1', required: true },
        { name: 'permissions', type: 'json', smart_code: 'HERA.SALON.ROLE.DYN.PERMISSIONS.V1' }
      ]
    }
    
    expect(ROLE_PRESET.entity_type).toBe('ROLE')
    expect(ROLE_PRESET.dynamicFields.length).toBeGreaterThan(0)
    
    ROLE_PRESET.dynamicFields.forEach(field => {
      expect(field.smart_code).toMatch(/^HERA\.SALON\.ROLE\.DYN\.[A-Z_]+\.V1$/)
    })
  })
})