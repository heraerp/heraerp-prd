import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LeaveRequestList } from '../LeaveRequestList'
import '@testing-library/jest-dom'

// Mock the LeaveApprovalDrawer component
jest.mock('../LeaveApprovalDrawer', () => ({
  LeaveApprovalDrawer: ({ open, onClose }: any) =>
    open ? <div data-testid="approval-drawer">Approval Drawer</div> : null
}))

describe('LeaveRequestList', () => {
  const mockStaff = [
    {
      id: 'staff-1',
      entity_name: 'Sarah Johnson',
      entity_code: 'EMP001',
      metadata: { branch_id: 'branch-1' }
    },
    {
      id: 'staff-2',
      entity_name: 'John Doe',
      entity_code: 'EMP002',
      metadata: { branch_id: 'branch-1' }
    }
  ]

  const mockRequests = [
    {
      id: 'req-1',
      source_entity_id: 'staff-1',
      status: 'pending',
      metadata: {
        from: '2024-01-15',
        to: '2024-01-17',
        type: 'ANNUAL',
        days: 3,
        notes: 'Family vacation',
        half_day_start: false,
        half_day_end: false
      }
    },
    {
      id: 'req-2',
      source_entity_id: 'staff-2',
      status: 'approved',
      metadata: {
        from: '2024-01-20',
        to: '2024-01-20',
        type: 'SICK',
        days: 1,
        notes: 'Medical appointment',
        half_day_start: true,
        half_day_end: false
      }
    }
  ]

  const mockOnApprove = jest.fn()
  const mockOnReject = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders leave requests correctly', () => {
    render(
      <LeaveRequestList
        requests={mockRequests}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        loading={false}
      />
    )

    // Check if requests are displayed
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Family vacation')).toBeInTheDocument()
    expect(screen.getByText('Medical appointment')).toBeInTheDocument()
  })

  it('displays correct leave types and status badges', () => {
    render(
      <LeaveRequestList
        requests={mockRequests}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        loading={false}
      />
    )

    // Check leave types
    expect(screen.getAllByText('ANNUAL')[0]).toBeInTheDocument()
    expect(screen.getByText('SICK')).toBeInTheDocument()

    // Check status badges
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.getByText('approved')).toBeInTheDocument()
  })

  it('shows half day indicators correctly', () => {
    render(
      <LeaveRequestList
        requests={mockRequests}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        loading={false}
      />
    )

    expect(screen.getByText('½ start')).toBeInTheDocument()
  })

  it('filters requests by status', () => {
    render(
      <LeaveRequestList
        requests={mockRequests}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        loading={false}
      />
    )

    // Click on status filter
    const statusFilter = screen.getByText('All Status')
    fireEvent.click(statusFilter)

    // Select pending only
    const pendingOption = screen.getByText('Pending')
    fireEvent.click(pendingOption)

    // Should only show pending requests
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <LeaveRequestList
        requests={[]}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        loading={true}
      />
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows empty state when no requests', () => {
    render(
      <LeaveRequestList
        requests={[]}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        loading={false}
      />
    )

    expect(screen.getByText('No leave requests found')).toBeInTheDocument()
  })

  it('opens approval drawer when clicking view button', () => {
    render(
      <LeaveRequestList
        requests={mockRequests}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        loading={false}
      />
    )

    const viewButtons = screen.getAllByRole('button', { name: /view/i })
    fireEvent.click(viewButtons[0])

    expect(screen.getByTestId('approval-drawer')).toBeInTheDocument()
  })

  it('calls onApprove when clicking approve button', () => {
    render(
      <LeaveRequestList
        requests={mockRequests}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        loading={false}
      />
    )

    const approveButtons = screen.getAllByRole('button', { name: /approve/i })
    fireEvent.click(approveButtons[0])

    expect(mockOnApprove).toHaveBeenCalledWith('req-1')
  })

  it('prompts for reason when rejecting', () => {
    window.prompt = jest.fn(() => 'Not enough staff coverage')

    render(
      <LeaveRequestList
        requests={mockRequests}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        loading={false}
      />
    )

    const rejectButtons = screen.getAllByRole('button', { name: /reject/i })
    fireEvent.click(rejectButtons[0])

    expect(window.prompt).toHaveBeenCalledWith('Rejection reason:')
    expect(mockOnReject).toHaveBeenCalledWith('req-1', 'Not enough staff coverage')
  })
})
