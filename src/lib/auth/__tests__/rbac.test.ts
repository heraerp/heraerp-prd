// ================================================================================
// HERA RBAC UNIT TESTS
// Smart Code: HERA.AUTH.RBAC.TEST.V1
// Unit tests for role-based access control
// ================================================================================

import { describe, it, expect } from 'vitest'
import { landingForRole, isAllowed, getUnauthorizedRedirect, ROLE_HOME, ROLE_NAV } from '../rbac'

describe('RBAC System', () => {
  describe('landingForRole', () => {
    it('should return correct landing page for each role', () => {
      expect(landingForRole('owner')).toBe('/dashboard')
      expect(landingForRole('admin')).toBe('/admin')
      expect(landingForRole('manager')).toBe('/dashboard')
      expect(landingForRole('stylist')).toBe('/appointments')
      expect(landingForRole('cashier')).toBe('/pos/sale')
      expect(landingForRole('customer')).toBe('/customer')
      expect(landingForRole('accountant')).toBe('/accountant')
    })

    it('should return default dashboard for unknown role', () => {
      expect(landingForRole('unknown' as any)).toBe('/dashboard')
    })
  })

  describe('isAllowed', () => {
    describe('owner role', () => {
      it('should allow access to all owner paths', () => {
        expect(isAllowed('owner', '/dashboard')).toBe(true)
        expect(isAllowed('owner', '/appointments')).toBe(true)
        expect(isAllowed('owner', '/pos/sale')).toBe(true)
        expect(isAllowed('owner', '/inventory/products')).toBe(true)
        expect(isAllowed('owner', '/reports/sales')).toBe(true)
        expect(isAllowed('owner', '/finance/closing')).toBe(true)
        expect(isAllowed('owner', '/settings/general')).toBe(true)
        expect(isAllowed('owner', '/whatsapp/campaigns')).toBe(true)
      })

      it('should not allow access to admin-only paths', () => {
        expect(isAllowed('owner', '/admin')).toBe(false)
      })
    })

    describe('accountant role', () => {
      it('should allow access to financial paths', () => {
        expect(isAllowed('accountant', '/accountant')).toBe(true)
        expect(isAllowed('accountant', '/reports/financial')).toBe(true)
        expect(isAllowed('accountant', '/finance/closing')).toBe(true)
        expect(isAllowed('accountant', '/finance/rules')).toBe(true)
      })

      it('should not allow access to operational paths', () => {
        expect(isAllowed('accountant', '/appointments')).toBe(false)
        expect(isAllowed('accountant', '/pos/sale')).toBe(false)
        expect(isAllowed('accountant', '/inventory/products')).toBe(false)
      })
    })

    describe('stylist role', () => {
      it('should allow access to stylist paths only', () => {
        expect(isAllowed('stylist', '/appointments')).toBe(true)
        expect(isAllowed('stylist', '/staff/schedule')).toBe(true)
      })

      it('should not allow access to other paths', () => {
        expect(isAllowed('stylist', '/dashboard')).toBe(false)
        expect(isAllowed('stylist', '/pos/sale')).toBe(false)
        expect(isAllowed('stylist', '/reports/sales')).toBe(false)
      })
    })

    describe('wildcard matching', () => {
      it('should match wildcard paths correctly', () => {
        expect(isAllowed('owner', '/reports')).toBe(false) // No exact match
        expect(isAllowed('owner', '/reports/sales')).toBe(true) // Wildcard match
        expect(isAllowed('owner', '/reports/inventory/detailed')).toBe(true) // Deep wildcard
        expect(isAllowed('owner', '/settings/general')).toBe(true) // Wildcard match
      })
    })
  })

  describe('getUnauthorizedRedirect', () => {
    it('should redirect to role landing page', () => {
      expect(getUnauthorizedRedirect('owner')).toBe('/dashboard')
      expect(getUnauthorizedRedirect('accountant')).toBe('/accountant')
      expect(getUnauthorizedRedirect('stylist')).toBe('/appointments')
    })
  })

  describe('role configuration integrity', () => {
    it('should have landing pages for all roles', () => {
      const roles = Object.keys(ROLE_HOME)
      const navRoles = Object.keys(ROLE_NAV)

      expect(roles).toEqual(navRoles)
      expect(roles).toContain('accountant')
    })

    it('should allow each role to access their landing page', () => {
      Object.entries(ROLE_HOME).forEach(([role, landing]) => {
        expect(isAllowed(role as any, landing)).toBe(true)
      })
    })
  })
})
