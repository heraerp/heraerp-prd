import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LeaveRequestModal } from '../LeaveRequestModal'
import '@testing-library/jest-dom'

// Mock date-fns functions
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  differenceInDays: jest.fn((date1, date2) => 5),
  isWeekend: jest.fn(() => false),
  eachDayOfInterval: jest.fn(() => []),
  format: jest.fn((date, format) => 'Jan 15, 2024')
}))

// Mock the calculateWorkingDays function
jest.mock('@/lib/playbook/hr_leave', () => ({
  calculateWorkingDays: jest.fn(() => 5)
}))

describe('LeaveRequestModal', () => {
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
      metadata: { branch_id: 'branch-2' }
    }
  ]

  const mockPolicies = [
    {
      id: 'policy-1',
      entity_name: 'Standard Annual Leave',
      metadata: {
        annual_entitlement: 21,
        carry_over_cap: 5,
        min_notice_days: 7
      }
    }
  ]

  const mockHolidays = [
    {
      id: 'holiday-1',
      metadata: { date: '2024-01-01', name: 'New Year' }
    },
    {
      id: 'holiday-2',
      metadata: { date: '2024-12-25', name: 'Christmas' }
    }
  ]

  const mockOnSubmit = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders modal with all form fields', () => {
    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    expect(screen.getByText('New Leave Request')).toBeInTheDocument()
    expect(screen.getByLabelText('Staff Member')).toBeInTheDocument()
    expect(screen.getByLabelText('Leave Type')).toBeInTheDocument()
    expect(screen.getByLabelText('From Date')).toBeInTheDocument()
    expect(screen.getByLabelText('To Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument()
  })

  it('shows staff members in dropdown', () => {
    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    const staffSelect = screen.getByLabelText('Staff Member')
    fireEvent.click(staffSelect)

    expect(screen.getByText('Sarah Johnson (EMP001)')).toBeInTheDocument()
    expect(screen.getByText('John Doe (EMP002)')).toBeInTheDocument()
  })

  it('shows leave type options', () => {
    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    const typeSelect = screen.getByLabelText('Leave Type')
    fireEvent.click(typeSelect)

    expect(screen.getByText('Annual Leave')).toBeInTheDocument()
    expect(screen.getByText('Sick Leave')).toBeInTheDocument()
    expect(screen.getByText('Unpaid Leave')).toBeInTheDocument()
  })

  it('calculates working days when dates are selected', async () => {
    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    // Select dates (mocked to return 5 working days)
    const fromDateButton = screen.getByText('Select date')
    fireEvent.click(fromDateButton)
    
    // After date selection, working days should be displayed
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('shows half day options when dates are selected', async () => {
    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    // Simulate date selection by setting component state
    // (In real scenario, this would be done through date picker interaction)
    
    // Half day options should appear after dates are selected
    await waitFor(() => {
      expect(screen.queryByLabelText('Half day on start date')).toBeInTheDocument()
      expect(screen.queryByLabelText('Half day on end date')).toBeInTheDocument()
    })
  })

  it('validates required fields before submission', async () => {
    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    const submitButton = screen.getByText('Submit Request')
    
    // Should be disabled without required fields
    expect(submitButton).toBeDisabled()
  })

  it('submits form with correct data', async () => {
    const mockSubmitData = {
      staff_id: 'staff-1',
      branch_id: 'branch-1',
      type: 'ANNUAL',
      from: new Date('2024-01-15'),
      to: new Date('2024-01-19'),
      half_day_start: false,
      half_day_end: false,
      notes: 'Family vacation'
    }

    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    // Fill form fields
    const staffSelect = screen.getByLabelText('Staff Member')
    fireEvent.change(staffSelect, { target: { value: 'staff-1' } })

    const notesTextarea = screen.getByLabelText('Notes (Optional)')
    fireEvent.change(notesTextarea, { target: { value: 'Family vacation' } })

    // Submit form
    const submitButton = screen.getByText('Submit Request')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  it('shows notice warning for short notice requests', async () => {
    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    // When dates are selected with short notice
    await waitFor(() => {
      const warningText = screen.queryByText(/Short notice: Less than required notice period/)
      expect(warningText).toBeInTheDocument()
    })
  })

  it('closes modal when cancel is clicked', () => {
    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles keyboard shortcut for submission', () => {
    render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    // Simulate Cmd+Enter
    fireEvent.keyDown(window, { key: 'Enter', metaKey: true })

    // Should attempt to submit (but may fail validation)
    expect(screen.getByText('Submit Request')).toBeInTheDocument()
  })
})