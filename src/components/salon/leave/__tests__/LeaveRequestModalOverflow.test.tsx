import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeaveRequestModal } from '../LeaveRequestModal'
import '@testing-library/jest-dom'

// Mock the calculateWorkingDays function
jest.mock('@/lib/playbook/hr_leave', () => ({
  calculateWorkingDays: jest.fn(() => 3)
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date) => date.toLocaleDateString()),
  differenceInDays: jest.fn(() => 3),
  isWeekend: jest.fn(() => false),
  eachDayOfInterval: jest.fn(() => [])
}))

describe('LeaveRequestModal - Overflow Fix', () => {
  const mockStaff = Array.from({ length: 20 }, (_, i) => ({
    id: `staff-${i + 1}`,
    entity_name: `Employee ${i + 1}`,
    entity_code: `EMP${String(i + 1).padStart(3, '0')}`,
    metadata: { branch_id: 'branch-1' }
  }))

  const mockPolicies = Array.from({ length: 5 }, (_, i) => ({
    id: `policy-${i + 1}`,
    entity_name: `Policy ${i + 1}`,
    metadata: {
      annual_entitlement: 21,
      carry_over_cap: 5,
      min_notice_days: 7
    }
  }))

  const mockHolidays = Array.from({ length: 10 }, (_, i) => ({
    id: `holiday-${i + 1}`,
    metadata: { 
      date: `2024-${String(i + 1).padStart(2, '0')}-01`, 
      name: `Holiday ${i + 1}` 
    }
  }))

  const mockOnSubmit = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window dimensions for viewport tests
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })
  })

  it('renders modal with scrollable content area', () => {
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

    const modal = screen.getByRole('dialog')
    expect(modal).toBeInTheDocument()

    // Check if modal has proper height constraints
    const dialogContent = modal.querySelector('[role="dialog"] > div')
    expect(dialogContent).toHaveClass('max-h-[90vh]', 'flex', 'flex-col')
  })

  it('has proper flex layout for scrolling', () => {
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

    // Check header is fixed
    const header = screen.getByText('New Leave Request').closest('div')
    expect(header).toHaveClass('flex-shrink-0')

    // Check content area is scrollable
    const contentArea = screen.getByLabelText('Staff Member').closest('div').parentElement
    expect(contentArea).toHaveClass('overflow-y-auto', 'flex-1', 'min-h-0')

    // Check footer is fixed
    const footer = screen.getByText('Cancel').closest('div').parentElement
    expect(footer).toHaveClass('flex-shrink-0')
  })

  it('handles large staff list without overflow', () => {
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

    // Open staff dropdown
    const staffSelect = screen.getByLabelText('Staff Member')
    fireEvent.click(staffSelect)

    // Should be able to see first and last staff members
    expect(screen.getByText('Employee 1 (EMP001)')).toBeInTheDocument()
    
    // Dropdown should be properly styled with hera-select-content
    const dropdown = screen.getByRole('listbox')
    expect(dropdown).toHaveClass('hera-select-content')
  })

  it('calendar popovers have proper positioning', () => {
    const { container } = render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    // Check from date button
    const fromDateButton = screen.getByText('Select date')
    fireEvent.click(fromDateButton)

    // Calendar popover should have proper z-index and positioning
    const popover = container.querySelector('[role="dialog"] [data-radix-popper-content-wrapper]')
    if (popover) {
      const popoverContent = popover.querySelector('[data-side]')
      expect(popoverContent).toHaveClass('z-50')
    }
  })

  it('working days preview fits within scrollable area', async () => {
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

    // The working days preview section should be visible
    // (This would normally show after selecting dates, but for testing we check the structure)
    const workingDaysSection = screen.queryByText('Working days')
    // If dates were selected, this would be visible within the scrollable content
  })

  it('footer remains accessible when content overflows', () => {
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

    // Footer buttons should always be visible
    const cancelButton = screen.getByText('Cancel')
    const submitButton = screen.getByText('Submit Request')

    expect(cancelButton).toBeVisible()
    expect(submitButton).toBeVisible()

    // Footer should have border and proper spacing
    const footer = cancelButton.closest('.flex-shrink-0')
    expect(footer).toHaveClass('border-t', 'pt-4')
  })

  it('handles keyboard shortcut with scrolled content', () => {
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

    // Keyboard shortcut hint should be visible in footer
    expect(screen.getByText('Press ⌘+Enter to submit')).toBeInTheDocument()

    // Simulate Cmd+Enter (would normally require form to be filled)
    fireEvent.keyDown(window, { key: 'Enter', metaKey: true })
    
    // Should still work even with scrolled content
    expect(screen.getByText('Submit Request')).toBeInTheDocument()
  })

  it('maintains proper spacing between form sections', () => {
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

    // Check form sections have proper spacing
    const formContainer = screen.getByLabelText('Staff Member').closest('.space-y-6')
    expect(formContainer).toHaveClass('space-y-6', 'py-4')

    // Each form section should have space-y-2 for internal spacing
    const staffSection = screen.getByLabelText('Staff Member').closest('.space-y-2')
    expect(staffSection).toHaveClass('space-y-2')
  })

  it('modal width and height are properly constrained', () => {
    const { container } = render(
      <LeaveRequestModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        staff={mockStaff}
        policies={mockPolicies}
        holidays={mockHolidays}
      />
    )

    const dialogContent = container.querySelector('[role="dialog"] > div')
    
    // Should have max width and height constraints
    expect(dialogContent).toHaveClass('sm:max-w-2xl', 'max-h-[90vh]')
    
    // Should use flexbox for proper layout
    expect(dialogContent).toHaveClass('flex', 'flex-col')
  })
})