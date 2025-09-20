import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LeaveApprovalDrawer } from '../LeaveApprovalDrawer'
import '@testing-library/jest-dom'

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => 'January 15, 2024')
}))

describe('LeaveApprovalDrawer', () => {
  const mockStaff = [
    {
      id: 'staff-1',
      entity_name: 'Sarah Johnson',
      entity_code: 'EMP001'
    }
  ]

  const mockRequest = {
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
      half_day_end: true
    }
  }

  const mockOnApprove = jest.fn()
  const mockOnReject = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays request details correctly', () => {
    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    expect(screen.getByText('Leave Request Details')).toBeInTheDocument()
    expect(screen.getByText('Sarah Johnson (EMP001)')).toBeInTheDocument()
    expect(screen.getByText('3 working days')).toBeInTheDocument()
    expect(screen.getByText('ANNUAL')).toBeInTheDocument()
    expect(screen.getByText('Family vacation')).toBeInTheDocument()
  })

  it('shows half day indicators', () => {
    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    expect(screen.getByText('½ end')).toBeInTheDocument()
    expect(screen.queryByText('½ start')).not.toBeInTheDocument()
  })

  it('displays balance impact', () => {
    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    expect(screen.getByText('Balance Impact')).toBeInTheDocument()
    expect(screen.getByText(/Current balance: 12 days remaining/)).toBeInTheDocument()
    expect(screen.getByText(/After approval: 9 days remaining/)).toBeInTheDocument()
  })

  it('handles approval with notes', async () => {
    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    const notesTextarea = screen.getByPlaceholderText('Add any notes for the approval...')
    fireEvent.change(notesTextarea, { target: { value: 'Enjoy your vacation!' } })

    const approveButton = screen.getByText('Approve')
    fireEvent.click(approveButton)

    expect(mockOnApprove).toHaveBeenCalledWith('req-1', 'Enjoy your vacation!')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows rejection form when reject is clicked', () => {
    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    const rejectButton = screen.getByText('Reject')
    fireEvent.click(rejectButton)

    expect(screen.getByText('Rejection Reason (Required)')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Please provide a reason for rejection...')
    ).toBeInTheDocument()
  })

  it('validates rejection reason is required', () => {
    window.alert = jest.fn()

    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    // Show rejection form
    const rejectButton = screen.getByText('Reject')
    fireEvent.click(rejectButton)

    // Try to confirm without reason
    const confirmButton = screen.getByText('Confirm Rejection')
    fireEvent.click(confirmButton)

    expect(window.alert).toHaveBeenCalledWith('Please provide a reason for rejection')
    expect(mockOnReject).not.toHaveBeenCalled()
  })

  it('handles rejection with reason', () => {
    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    // Show rejection form
    const rejectButton = screen.getByText('Reject')
    fireEvent.click(rejectButton)

    // Enter rejection reason
    const reasonTextarea = screen.getByPlaceholderText('Please provide a reason for rejection...')
    fireEvent.change(reasonTextarea, { target: { value: 'Not enough staff coverage' } })

    // Confirm rejection
    const confirmButton = screen.getByText('Confirm Rejection')
    fireEvent.click(confirmButton)

    expect(mockOnReject).toHaveBeenCalledWith('req-1', 'Not enough staff coverage')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('cancels rejection form', () => {
    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    // Show rejection form
    const rejectButton = screen.getByText('Reject')
    fireEvent.click(rejectButton)

    // Cancel
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    // Should go back to approval form
    expect(screen.queryByText('Rejection Reason (Required)')).not.toBeInTheDocument()
    expect(screen.getByText('Approval Notes (Optional)')).toBeInTheDocument()
  })

  it('does not show approval buttons for non-pending requests', () => {
    const approvedRequest = {
      ...mockRequest,
      status: 'approved'
    }

    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={approvedRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    expect(screen.queryByText('Approve')).not.toBeInTheDocument()
    expect(screen.queryByText('Reject')).not.toBeInTheDocument()
  })

  it('handles keyboard shortcuts', () => {
    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    // Press 'a' for approve
    fireEvent.keyDown(window, { key: 'a' })
    expect(mockOnApprove).toHaveBeenCalledWith('req-1', '')

    // Press 'r' for reject (shows rejection form)
    fireEvent.keyDown(window, { key: 'r' })
    expect(screen.getByText('Rejection Reason (Required)')).toBeInTheDocument()
  })

  it('does not trigger shortcuts when typing in input fields', () => {
    render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={mockRequest}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    const notesTextarea = screen.getByPlaceholderText('Add any notes for the approval...')
    notesTextarea.focus()

    // Type 'a' in textarea should not trigger approval
    fireEvent.keyDown(notesTextarea, { key: 'a', target: notesTextarea })
    expect(mockOnApprove).not.toHaveBeenCalled()
  })

  it('returns null if no request provided', () => {
    const { container } = render(
      <LeaveApprovalDrawer
        open={true}
        onClose={mockOnClose}
        request={null}
        staff={mockStaff}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
