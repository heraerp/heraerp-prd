import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ServiceList } from '../ServiceList'
import { ServiceWithDynamicData } from '@/schemas/service'

const mockServices: ServiceWithDynamicData[] = [
  {
    id: '1',
    organization_id: 'org-123',
    smart_code: 'HERA.SALON.SERVICE.V1',
    name: 'Premium Cut & Style',
    code: 'SVC001',
    status: 'active',
    duration_mins: 45,
    category: 'Hair',
    price: 120,
    currency: 'AED',
    tax_rate: 5,
    commission_type: 'percent',
    commission_value: 20,
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    organization_id: 'org-123',
    smart_code: 'HERA.SALON.SERVICE.V1',
    name: 'Color Treatment',
    code: 'SVC002',
    status: 'archived',
    duration_mins: 120,
    category: 'Color',
    price: 250,
    currency: 'AED',
    tax_rate: 5,
    commission_type: 'flat',
    commission_value: 30,
    updated_at: new Date().toISOString(),
  },
]

describe('ServiceList', () => {
  const defaultProps = {
    services: mockServices,
    loading: false,
    selectedIds: new Set<string>(),
    onSelectAll: jest.fn(),
    onSelectOne: jest.fn(),
    onEdit: jest.fn(),
    onDuplicate: jest.fn(),
    onArchive: jest.fn(),
    onRestore: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders service list correctly', () => {
    render(<ServiceList {...defaultProps} />)
    
    expect(screen.getByText('Premium Cut & Style')).toBeInTheDocument()
    expect(screen.getByText('SVC001')).toBeInTheDocument()
    expect(screen.getByText('Hair')).toBeInTheDocument()
    expect(screen.getByText('45m')).toBeInTheDocument()
    expect(screen.getByText('AED 120')).toBeInTheDocument()
    expect(screen.getByText('5%')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<ServiceList {...defaultProps} loading={true} />)
    
    const loadingElements = screen.getAllByTestId('loading-skeleton')
    expect(loadingElements).toHaveLength(5)
  })

  it('shows empty state when no services', () => {
    render(<ServiceList {...defaultProps} services={[]} />)
    
    expect(screen.getByText('No services yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first service to start building your catalog')).toBeInTheDocument()
  })

  it('handles select all checkbox', () => {
    render(<ServiceList {...defaultProps} />)
    
    const selectAllCheckbox = screen.getByLabelText('Select all services')
    fireEvent.click(selectAllCheckbox)
    
    expect(defaultProps.onSelectAll).toHaveBeenCalledWith(true)
  })

  it('handles individual service selection', () => {
    render(<ServiceList {...defaultProps} />)
    
    const firstCheckbox = screen.getByLabelText('Select Premium Cut & Style')
    fireEvent.click(firstCheckbox)
    
    expect(defaultProps.onSelectOne).toHaveBeenCalledWith('1', true)
  })

  it('shows correct selection state', () => {
    const selectedIds = new Set(['1'])
    render(<ServiceList {...defaultProps} selectedIds={selectedIds} />)
    
    const firstCheckbox = screen.getByLabelText('Select Premium Cut & Style')
    expect(firstCheckbox).toBeChecked()
    
    const secondCheckbox = screen.getByLabelText('Select Color Treatment')
    expect(secondCheckbox).not.toBeChecked()
  })

  it('formats duration correctly', () => {
    render(<ServiceList {...defaultProps} />)
    
    expect(screen.getByText('45m')).toBeInTheDocument() // 45 minutes
    expect(screen.getByText('2h')).toBeInTheDocument() // 120 minutes = 2 hours
  })

  it('formats commission correctly', () => {
    render(<ServiceList {...defaultProps} />)
    
    expect(screen.getByText('20%')).toBeInTheDocument() // Percent commission
    expect(screen.getByText('AED 30')).toBeInTheDocument() // Flat commission
  })

  it('shows active badge for active services', () => {
    render(<ServiceList {...defaultProps} />)
    
    const activeBadge = screen.getByText('active')
    expect(activeBadge).toHaveClass('bg-emerald-500/20')
  })

  it('shows archived badge for archived services', () => {
    render(<ServiceList {...defaultProps} />)
    
    const archivedBadge = screen.getByText('archived')
    expect(archivedBadge).toHaveClass('bg-gray-500/20')
  })

  it('opens action menu and calls edit', () => {
    render(<ServiceList {...defaultProps} />)
    
    const moreButtons = screen.getAllByRole('button', { name: /more/i })
    fireEvent.click(moreButtons[0])
    
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockServices[0])
  })

  it('opens action menu and calls duplicate', () => {
    render(<ServiceList {...defaultProps} />)
    
    const moreButtons = screen.getAllByRole('button', { name: /more/i })
    fireEvent.click(moreButtons[0])
    
    const duplicateButton = screen.getByText('Duplicate')
    fireEvent.click(duplicateButton)
    
    expect(defaultProps.onDuplicate).toHaveBeenCalledWith(mockServices[0])
  })

  it('shows archive option for active services', () => {
    render(<ServiceList {...defaultProps} />)
    
    const moreButtons = screen.getAllByRole('button', { name: /more/i })
    fireEvent.click(moreButtons[0]) // Active service
    
    expect(screen.getByText('Archive')).toBeInTheDocument()
    expect(screen.queryByText('Restore')).not.toBeInTheDocument()
  })

  it('shows restore option for archived services', () => {
    render(<ServiceList {...defaultProps} />)
    
    const moreButtons = screen.getAllByRole('button', { name: /more/i })
    fireEvent.click(moreButtons[1]) // Archived service
    
    expect(screen.getByText('Restore')).toBeInTheDocument()
    expect(screen.queryByText('Archive')).not.toBeInTheDocument()
  })

  it('handles null values gracefully', () => {
    const serviceWithNulls: ServiceWithDynamicData = {
      id: '3',
      organization_id: 'org-123',
      smart_code: 'HERA.SALON.SERVICE.V1',
      name: 'Basic Service',
      status: 'active',
      // All optional fields are undefined
    }
    
    render(<ServiceList {...defaultProps} services={[serviceWithNulls]} />)
    
    expect(screen.getByText('Basic Service')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(5) // duration, price, tax, commission, updated
  })
})