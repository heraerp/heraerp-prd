/**
 * HERA Universal Tile System - Test Suite
 * Smart Code: HERA.TESTING.TILES.UNIVERSAL.RENDERER.v1
 * 
 * Comprehensive test coverage for Universal Tile System components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import '@testing-library/jest-dom'

// Mock HERA Auth Provider
const mockUseHERAAuth = jest.fn()
jest.mock('@/components/auth/HERAAuthProvider', () => ({
  useHERAAuth: () => mockUseHERAAuth()
}))

// Mock Security Hooks
const mockUseWorkspaceSecurity = jest.fn()
const mockUseAuditLogger = jest.fn() 
const mockUseDataMasking = jest.fn()

jest.mock('@/lib/security/WorkspaceSecurityManager', () => ({
  useWorkspaceSecurity: () => mockUseWorkspaceSecurity()
}))

jest.mock('@/lib/security/AuditLogger', () => ({
  useAuditLogger: () => mockUseAuditLogger()
}))

jest.mock('@/lib/security/DataMaskingService', () => ({
  useDataMasking: () => mockUseDataMasking()
}))

// Import components after mocks
import { UniversalTileRenderer } from '@/components/tiles/UniversalTileRenderer'
import { WorkspaceSecurityManager } from '@/lib/security/WorkspaceSecurityManager'
import { AuditLogger } from '@/lib/security/AuditLogger'
import { DataMaskingService } from '@/lib/security/DataMaskingService'

describe('Universal Tile System - Component Integration Tests', () => {
  // Test data fixtures
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { default_role: 'manager' }
  }

  const mockOrganization = {
    id: 'org-456',
    name: 'Test Organization'
  }

  const mockTileConfig = {
    id: 'test-tile-1',
    templateId: 'template-revenue',
    workspaceId: 'workspace-123',
    userId: 'user-123',
    organizationId: 'org-456',
    position: { x: 0, y: 0, width: 2, height: 2 },
    type: 'revenue',
    title: 'Revenue Dashboard',
    subtitle: 'Monthly revenue breakdown',
    icon: 'DollarSign',
    color: 'green',
    size: 'large',
    tileComponent: 'RevenueDashboardTile',
    interactiveFeatures: {
      drillDown: true,
      export: true,
      comparison: true
    },
    dataSource: {
      type: 'rpc',
      endpoint: 'get_revenue_analytics',
      params: { period: 'monthly' }
    },
    actions: [
      {
        id: 'export',
        label: 'Export',
        icon: 'Download',
        type: 'button',
        variant: 'secondary'
      },
      {
        id: 'drill_down',
        label: 'Drill Down', 
        icon: 'Search',
        type: 'button',
        variant: 'primary'
      }
    ],
    permissions: {
      view: ['viewer', 'analyst', 'manager', 'admin'],
      edit: ['manager', 'admin'],
      export: ['analyst', 'manager', 'admin']
    },
    resolved: {
      dataSource: { resolved: true },
      actions: [
        { id: 'export', label: 'Export', permissions: ['analyst', 'manager', 'admin'] },
        { id: 'drill_down', label: 'Drill Down', permissions: ['analyst', 'manager', 'admin'] }
      ],
      permissions: {
        canView: true,
        canEdit: true,
        canExecuteActions: true,
        availableActions: ['export', 'drill_down']
      },
      conditions: []
    },
    metadata: {
      smartCode: 'HERA.FINANCE.ANALYTICS.TILE.REVENUE.DASHBOARD.v1',
      isFinancialTile: true,
      category: 'analytics'
    }
  }

  const mockSecurityManager = {
    initializeSecurityContext: jest.fn(),
    hasPermission: jest.fn(),
    validateTileAccess: jest.fn(),
    validateDataAccess: jest.fn(),
    isSessionValid: jest.fn(),
    getSecurityContext: jest.fn()
  }

  const mockAuditLogger = {
    logTileAccess: jest.fn(),
    logTileAction: jest.fn(),
    logDataAccess: jest.fn(),
    logSecurityViolation: jest.fn()
  }

  const mockDataMasking = {
    maskData: jest.fn(),
    maskFinancialTileData: jest.fn(),
    getFieldPermissions: jest.fn()
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup default mock returns
    mockUseHERAAuth.mockReturnValue({
      user: mockUser,
      organization: mockOrganization,
      isAuthenticated: true,
      sessionType: 'real'
    })

    mockUseWorkspaceSecurity.mockReturnValue({
      securityManager: mockSecurityManager,
      securityContext: {
        actorUserId: 'user-123',
        organizationId: 'org-456',
        userRole: 'manager',
        permissions: ['read', 'write', 'view_analytics', 'export_full'],
        sessionType: 'real'
      },
      hasPermission: mockSecurityManager.hasPermission,
      validateTileAccess: mockSecurityManager.validateTileAccess,
      validateDataAccess: mockSecurityManager.validateDataAccess,
      isSessionValid: mockSecurityManager.isSessionValid
    })

    mockUseAuditLogger.mockReturnValue(mockAuditLogger)
    mockUseDataMasking.mockReturnValue(mockDataMasking)

    // Setup security validation returns
    mockSecurityManager.validateTileAccess.mockReturnValue({
      canView: true,
      canInteract: true,
      canExport: true,
      canEdit: true,
      canDelete: false,
      visibleActions: ['export', 'drill_down'],
      maskedFields: [],
      auditRequired: true
    })

    mockSecurityManager.hasPermission.mockImplementation((permission: string) => {
      const permissions = ['read', 'write', 'view_analytics', 'export_full']
      return permissions.includes(permission)
    })

    mockSecurityManager.isSessionValid.mockReturnValue(true)
    mockDataMasking.maskFinancialTileData.mockImplementation((data) => data)
  })

  describe('Tile Rendering and Basic Functionality', () => {
    test('renders tile with correct title and subtitle', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      expect(screen.getByText('Revenue Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Monthly revenue breakdown')).toBeInTheDocument()
    })

    test('applies correct tile size and positioning classes', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      const tileElement = screen.getByTestId('universal-tile-test-tile-1')
      expect(tileElement).toHaveClass('tile-large')
      expect(tileElement).toHaveStyle({
        'grid-column': 'span 2',
        'grid-row': 'span 2'
      })
    })

    test('renders tile icon with correct styling', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      const iconElement = screen.getByTestId('tile-icon-DollarSign')
      expect(iconElement).toBeInTheDocument()
      expect(iconElement).toHaveClass('text-green-500')
    })

    test('displays loading state when data is being fetched', async () => {
      const loadingConfig = { ...mockTileConfig, loading: true }
      render(<UniversalTileRenderer tileConfig={loadingConfig} />)
      
      expect(screen.getByTestId('tile-loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    test('displays error state when data fetch fails', async () => {
      const errorConfig = { ...mockTileConfig, error: 'Failed to load data' }
      render(<UniversalTileRenderer tileConfig={errorConfig} />)
      
      expect(screen.getByTestId('tile-error-state')).toBeInTheDocument()
      expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    })
  })

  describe('Security Integration', () => {
    test('validates tile access on mount', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      expect(mockSecurityManager.validateTileAccess).toHaveBeenCalledWith(
        'test-tile-1',
        mockTileConfig
      )
    })

    test('logs tile access for audit trail', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      expect(mockAuditLogger.logTileAccess).toHaveBeenCalledWith(
        'user-123',
        'org-456',
        'test-tile-1',
        'Revenue Dashboard',
        'success',
        expect.any(Object)
      )
    })

    test('blocks access when user lacks view permission', () => {
      mockSecurityManager.validateTileAccess.mockReturnValue({
        canView: false,
        canInteract: false,
        canExport: false,
        canEdit: false,
        canDelete: false,
        visibleActions: [],
        maskedFields: ['*'],
        auditRequired: true
      })

      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      expect(screen.getByTestId('tile-access-denied')).toBeInTheDocument()
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      
      expect(mockAuditLogger.logTileAccess).toHaveBeenCalledWith(
        'user-123',
        'org-456',
        'test-tile-1',
        'Revenue Dashboard',
        'denied',
        expect.any(Object)
      )
    })

    test('applies data masking for sensitive fields', () => {
      const mockMaskedData = { revenue: '[Aggregated]', breakdown: '[Restricted]' }
      mockDataMasking.maskFinancialTileData.mockReturnValue(mockMaskedData)

      const configWithData = {
        ...mockTileConfig,
        data: { revenue: 150000, breakdown: { details: 'sensitive data' } }
      }

      render(<UniversalTileRenderer tileConfig={configWithData} />)
      
      expect(mockDataMasking.maskFinancialTileData).toHaveBeenCalledWith(
        configWithData.data,
        'revenue',
        'manager',
        'org-456'
      )
    })

    test('validates organization boundary enforcement', () => {
      const crossOrgConfig = {
        ...mockTileConfig,
        organizationId: 'different-org-789'
      }

      mockSecurityManager.validateTileAccess.mockReturnValue({
        canView: false,
        canInteract: false,
        canExport: false,
        canEdit: false,
        canDelete: false,
        visibleActions: [],
        maskedFields: ['*'],
        auditRequired: true
      })

      render(<UniversalTileRenderer tileConfig={crossOrgConfig} />)
      
      expect(screen.getByTestId('tile-access-denied')).toBeInTheDocument()
      expect(mockAuditLogger.logSecurityViolation).toHaveBeenCalledWith(
        'user-123',
        'org-456',
        'organization_boundary_violation',
        expect.stringContaining('Cross-organization tile access'),
        expect.any(Object)
      )
    })
  })

  describe('Interactive Features', () => {
    test('renders action buttons based on permissions', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      expect(screen.getByTestId('tile-action-export')).toBeInTheDocument()
      expect(screen.getByTestId('tile-action-drill_down')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
      expect(screen.getByText('Drill Down')).toBeInTheDocument()
    })

    test('hides actions when user lacks permission', () => {
      mockSecurityManager.validateTileAccess.mockReturnValue({
        canView: true,
        canInteract: false,
        canExport: false,
        canEdit: false,
        canDelete: false,
        visibleActions: [], // No visible actions
        maskedFields: [],
        auditRequired: true
      })

      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      expect(screen.queryByTestId('tile-action-export')).not.toBeInTheDocument()
      expect(screen.queryByTestId('tile-action-drill_down')).not.toBeInTheDocument()
    })

    test('logs action execution in audit trail', async () => {
      const user = userEvent.setup()
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      const exportButton = screen.getByTestId('tile-action-export')
      await user.click(exportButton)
      
      expect(mockAuditLogger.logTileAction).toHaveBeenCalledWith(
        'user-123',
        'org-456',
        'test-tile-1',
        'export',
        expect.any(Object),
        'success'
      )
    })

    test('handles action failure and logs appropriately', async () => {
      const user = userEvent.setup()
      const failingConfig = {
        ...mockTileConfig,
        actions: [{
          ...mockTileConfig.actions[0],
          onClick: jest.fn().mockRejectedValue(new Error('Export failed'))
        }]
      }

      render(<UniversalTileRenderer tileConfig={failingConfig} />)
      
      const exportButton = screen.getByTestId('tile-action-export')
      await user.click(exportButton)
      
      await waitFor(() => {
        expect(mockAuditLogger.logTileAction).toHaveBeenCalledWith(
          'user-123',
          'org-456',
          'test-tile-1',
          'export',
          expect.any(Object),
          'failure'
        )
      })
    })

    test('supports touch interactions for mobile devices', async () => {
      const user = userEvent.setup()
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      const tileElement = screen.getByTestId('universal-tile-test-tile-1')
      
      // Simulate touch events
      fireEvent.touchStart(tileElement)
      fireEvent.touchEnd(tileElement)
      
      expect(tileElement).toHaveClass('active:scale-95')
    })
  })

  describe('Performance and Optimization', () => {
    test('memoizes tile rendering to prevent unnecessary re-renders', () => {
      const { rerender } = render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      // Same config should not trigger re-render
      rerender(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      // Validate security was only called once (on initial render)
      expect(mockSecurityManager.validateTileAccess).toHaveBeenCalledTimes(1)
    })

    test('lazy loads tile content when not in viewport', () => {
      const lazyConfig = { ...mockTileConfig, lazy: true }
      render(<UniversalTileRenderer tileConfig={lazyConfig} />)
      
      const placeholder = screen.getByTestId('tile-lazy-placeholder')
      expect(placeholder).toBeInTheDocument()
      expect(placeholder).toHaveTextContent('Loading...')
    })

    test('implements proper error boundaries', () => {
      const ErrorThrowingTile = () => {
        throw new Error('Tile rendering error')
      }
      
      const errorConfig = {
        ...mockTileConfig,
        customComponent: ErrorThrowingTile
      }

      // Should not crash the entire application
      render(<UniversalTileRenderer tileConfig={errorConfig} />)
      
      expect(screen.getByTestId('tile-error-boundary')).toBeInTheDocument()
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    test('applies mobile-specific classes on small screens', () => {
      // Mock window width for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      const tileElement = screen.getByTestId('universal-tile-test-tile-1')
      expect(tileElement).toHaveClass('mobile-tile')
      expect(tileElement).toHaveClass('min-h-[120px]') // Mobile minimum height
    })

    test('ensures minimum touch target size (44px) on mobile', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      const actionButton = screen.getByTestId('tile-action-export')
      expect(actionButton).toHaveClass('min-h-[44px]')
      expect(actionButton).toHaveClass('min-w-[44px]')
    })

    test('adapts grid layout for different screen sizes', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      const tileElement = screen.getByTestId('universal-tile-test-tile-1')
      
      // Should have responsive grid classes
      expect(tileElement).toHaveStyle({
        'grid-column': 'span 2',
        'grid-row': 'span 2'
      })
      
      // Mobile adaptation should be handled via CSS media queries
      expect(tileElement).toHaveClass('col-span-1') // Mobile fallback
    })
  })

  describe('Accessibility (a11y)', () => {
    test('provides proper ARIA labels and roles', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      const tileElement = screen.getByTestId('universal-tile-test-tile-1')
      expect(tileElement).toHaveAttribute('role', 'article')
      expect(tileElement).toHaveAttribute('aria-label', 'Revenue Dashboard tile')
    })

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      const exportButton = screen.getByTestId('tile-action-export')
      
      await user.tab() // Focus first interactive element
      expect(exportButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(mockAuditLogger.logTileAction).toHaveBeenCalled()
    })

    test('provides screen reader accessible content', () => {
      render(<UniversalTileRenderer tileConfig={mockTileConfig} />)
      
      expect(screen.getByText('Revenue Dashboard')).toHaveAttribute('aria-level', '3')
      expect(screen.getByText('Monthly revenue breakdown')).toHaveAttribute('aria-describedby')
    })
  })
})

describe('Universal Tile System - Security Integration Tests', () => {
  let securityManager: WorkspaceSecurityManager
  let auditLogger: AuditLogger
  let dataMaskingService: DataMaskingService

  beforeEach(() => {
    securityManager = new WorkspaceSecurityManager()
    auditLogger = new AuditLogger()
    dataMaskingService = new DataMaskingService()
  })

  describe('WorkspaceSecurityManager', () => {
    test('initializes security context correctly', () => {
      const user = { id: 'user-123', user_metadata: { default_role: 'manager' } }
      const org = { id: 'org-456', name: 'Test Org' }
      
      const context = securityManager.initializeSecurityContext(user, org, 'real')
      
      expect(context).toEqual({
        actorUserId: 'user-123',
        organizationId: 'org-456',
        userRole: 'manager',
        permissions: expect.arrayContaining(['read', 'write', 'view_analytics']),
        sessionType: 'real',
        sessionExpiry: expect.any(Date)
      })
    })

    test('enforces role-based permissions correctly', () => {
      const user = { id: 'user-123', user_metadata: { default_role: 'viewer' } }
      const org = { id: 'org-456' }
      
      securityManager.initializeSecurityContext(user, org, 'real')
      
      expect(securityManager.hasPermission('read')).toBe(true)
      expect(securityManager.hasPermission('write')).toBe(false)
      expect(securityManager.hasPermission('export_full')).toBe(false)
    })

    test('validates organization boundaries', () => {
      const user = { id: 'user-123' }
      const org = { id: 'org-456' }
      
      securityManager.initializeSecurityContext(user, org, 'real')
      
      expect(securityManager.validateDataAccess('financial_data', 'org-456')).toBe(true)
      expect(securityManager.validateDataAccess('financial_data', 'different-org')).toBe(false)
    })
  })

  describe('AuditLogger', () => {
    test('logs security events with proper classification', () => {
      auditLogger.logTileAccess('user-123', 'org-456', 'tile-1', 'Revenue Dashboard', 'success')
      
      const events = auditLogger.getEvents()
      const event = events[0]
      
      expect(event).toMatchObject({
        actorUserId: 'user-123',
        organizationId: 'org-456',
        eventType: 'access',
        action: 'tile_access',
        resource: { type: 'tile', id: 'tile-1', name: 'Revenue Dashboard' },
        result: 'success',
        severity: 'low'
      })
    })

    test('escalates security violations appropriately', () => {
      auditLogger.logSecurityViolation(
        'user-123',
        'org-456', 
        'unauthorized_access',
        'Attempted cross-org data access'
      )
      
      const events = auditLogger.getEvents()
      const violation = events[0]
      
      expect(violation).toMatchObject({
        eventType: 'security',
        action: 'security_violation_unauthorized_access',
        result: 'denied',
        severity: 'critical'
      })
    })

    test('exports audit logs in compliance format', () => {
      auditLogger.logTileAccess('user-123', 'org-456', 'tile-1', 'Test Tile', 'success')
      
      const csvExport = auditLogger.exportAuditLog('org-456', 'csv')
      const jsonExport = auditLogger.exportAuditLog('org-456', 'json')
      
      expect(csvExport).toContain('Timestamp,Actor User ID,Organization ID')
      expect(jsonExport).toContain('"actorUserId":"user-123"')
    })
  })

  describe('DataMaskingService', () => {
    test('applies role-based data masking correctly', () => {
      const sensitiveData = {
        revenue: 150000,
        customer_names: 'ACME Corp',
        individual_transactions: [{ amount: 1000, customer: 'John Doe' }]
      }
      
      const viewerData = dataMaskingService.maskData(
        sensitiveData,
        'financial',
        'viewer',
        'org-456'
      )
      
      expect(viewerData.individual_transactions).toBe('[Restricted]')
      expect(viewerData.revenue).toBe(150000) // Revenue visible but may be aggregated
    })

    test('provides field-level permissions mapping', () => {
      const permissions = dataMaskingService.getFieldPermissions(
        'financial',
        'analyst',
        'org-456'
      )
      
      expect(permissions).toMatchObject({
        'customer_specific_data': 'hidden',
        'revenue_breakdown': 'full',
        'comparative_data': 'full'
      })
    })
  })
})

describe('Universal Tile System - Performance Tests', () => {
  test('renders large number of tiles without performance degradation', async () => {
    const startTime = performance.now()
    
    const manyTiles = Array.from({ length: 50 }, (_, i) => ({
      ...mockTileConfig,
      id: `tile-${i}`,
      title: `Test Tile ${i}`
    }))

    const { container } = render(
      <div>
        {manyTiles.map(config => (
          <UniversalTileRenderer key={config.id} tileConfig={config} />
        ))}
      </div>
    )
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should render 50 tiles in under 1000ms
    expect(renderTime).toBeLessThan(1000)
    expect(container.children).toHaveLength(1)
    expect(container.firstChild?.children).toHaveLength(50)
  })

  test('implements efficient re-rendering with React.memo', () => {
    const renderSpy = jest.fn()
    
    const TestTile = React.memo(({ config }: { config: any }) => {
      renderSpy()
      return <UniversalTileRenderer tileConfig={config} />
    })

    const { rerender } = render(<TestTile config={mockTileConfig} />)
    
    expect(renderSpy).toHaveBeenCalledTimes(1)
    
    // Re-render with same props should not trigger render
    rerender(<TestTile config={mockTileConfig} />)
    expect(renderSpy).toHaveBeenCalledTimes(1)
    
    // Re-render with different props should trigger render
    rerender(<TestTile config={{ ...mockTileConfig, title: 'New Title' }} />)
    expect(renderSpy).toHaveBeenCalledTimes(2)
  })
})