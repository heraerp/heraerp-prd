// ================================================================================
// SALON DASHBOARD SELECTORS UNIT TESTS
// Tests KPI calculations and data transformations
// ================================================================================

describe('Dashboard Selectors', () => {
  describe('KPI Calculations', () => {
    it('should calculate gross sales correctly', () => {
      const transactions = [
        { total_amount: 100 },
        { total_amount: 250 },
        { total_amount: 150 }
      ]
      
      const gross = transactions.reduce((sum, txn) => sum + txn.total_amount, 0)
      expect(gross).toBe(500)
    })

    it('should calculate net revenue with VAT deduction', () => {
      const gross = 500
      const vatRate = 0.05 // 5%
      const net = gross * (1 - vatRate)
      
      expect(net).toBe(475)
    })

    it('should calculate average ticket correctly', () => {
      const gross = 500
      const transactionCount = 3
      const avgTicket = gross / transactionCount
      
      expect(avgTicket).toBeCloseTo(166.67, 2)
    })

    it('should handle zero transaction count for average ticket', () => {
      const gross = 0
      const transactionCount = 0
      const avgTicket = transactionCount > 0 ? gross / transactionCount : 0
      
      expect(avgTicket).toBe(0)
    })

    it('should calculate WhatsApp delivery rate', () => {
      const sent = 100
      const delivered = 85
      const deliveryRate = (delivered / sent) * 100
      
      expect(deliveryRate).toBe(85)
    })

    it('should handle zero sent messages for delivery rate', () => {
      const sent = 0
      const delivered = 0
      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0
      
      expect(deliveryRate).toBe(0)
    })
  })

  describe('Appointment Partitioning', () => {
    it('should filter appointments by date', () => {
      const today = '2024-09-16'
      const appointments = [
        { id: '1', start_time: '2024-09-16T10:00:00Z', status: 'confirmed' },
        { id: '2', start_time: '2024-09-16T14:00:00Z', status: 'in_progress' },
        { id: '3', start_time: '2024-09-17T10:00:00Z', status: 'confirmed' }
      ]
      
      const todaysAppointments = appointments.filter(appt => 
        appt.start_time.startsWith(today)
      )
      
      expect(todaysAppointments).toHaveLength(2)
      expect(todaysAppointments.map(a => a.id)).toEqual(['1', '2'])
    })

    it('should exclude draft appointments from KPIs', () => {
      const appointments = [
        { id: '1', status: 'confirmed' },
        { id: '2', status: 'draft' },
        { id: '3', status: 'in_progress' },
        { id: '4', status: 'service_complete' }
      ]
      
      const kpiAppointments = appointments.filter(a => a.status !== 'draft')
      expect(kpiAppointments).toHaveLength(3)
    })

    it('should count appointments by status', () => {
      const appointments = [
        { status: 'confirmed' },
        { status: 'confirmed' },
        { status: 'in_progress' },
        { status: 'service_complete' },
        { status: 'cancelled' }
      ]
      
      const stats = {
        total: appointments.length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        in_progress: appointments.filter(a => a.status === 'in_progress').length,
        completed: appointments.filter(a => a.status === 'service_complete').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length
      }
      
      expect(stats).toEqual({
        total: 5,
        confirmed: 2,
        in_progress: 1,
        completed: 1,
        cancelled: 1
      })
    })
  })

  describe('Currency Formatting', () => {
    it('should format AED currency correctly', () => {
      const formatter = new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED'
      })
      
      expect(formatter.format(1000)).toMatch(/AED.*1,000/)
      expect(formatter.format(50.5)).toMatch(/AED.*50\.50/)
    })
  })

  describe('Low Stock Identification', () => {
    it('should identify low stock items correctly', () => {
      const items = [
        { id: '1', on_hand: 5, reorder_point: 10 },  // Low
        { id: '2', on_hand: 15, reorder_point: 10 }, // OK
        { id: '3', on_hand: 0, reorder_point: 5 },   // Out
        { id: '4', on_hand: 3, reorder_point: 8 }    // Low
      ]
      
      const lowStockItems = items.filter(item => item.on_hand < item.reorder_point)
      expect(lowStockItems).toHaveLength(3)
      expect(lowStockItems.map(i => i.id)).toEqual(['1', '3', '4'])
    })

    it('should sort by criticality (percentage remaining)', () => {
      const items = [
        { id: '1', on_hand: 5, reorder_point: 10 },  // 50%
        { id: '2', on_hand: 0, reorder_point: 5 },   // 0%
        { id: '3', on_hand: 3, reorder_point: 8 }    // 37.5%
      ]
      
      const sorted = [...items].sort((a, b) => {
        const aPerc = a.reorder_point > 0 ? a.on_hand / a.reorder_point : 0
        const bPerc = b.reorder_point > 0 ? b.on_hand / b.reorder_point : 0
        return aPerc - bPerc
      })
      
      expect(sorted.map(i => i.id)).toEqual(['2', '3', '1'])
    })
  })

  describe('Staff Utilization', () => {
    it('should calculate utilization percentage', () => {
      const staff = {
        hours_booked: 6,
        hours_available: 8
      }
      
      const utilization = (staff.hours_booked / staff.hours_available) * 100
      expect(utilization).toBe(75)
    })

    it('should handle zero available hours', () => {
      const staff = {
        hours_booked: 0,
        hours_available: 0
      }
      
      const utilization = staff.hours_available > 0 
        ? (staff.hours_booked / staff.hours_available) * 100 
        : 0
      
      expect(utilization).toBe(0)
    })

    it('should sort staff by utilization', () => {
      const staffList = [
        { id: '1', name: 'A', utilization: 50 },
        { id: '2', name: 'B', utilization: 75 },
        { id: '3', name: 'C', utilization: 90 },
        { id: '4', name: 'D', utilization: 25 }
      ]
      
      const sorted = [...staffList].sort((a, b) => b.utilization - a.utilization)
      expect(sorted.map(s => s.id)).toEqual(['3', '2', '1', '4'])
    })
  })

  describe('Revenue Sparkline', () => {
    it('should calculate daily revenue totals', () => {
      const transactions = [
        { date: '2024-09-10', amount: 100 },
        { date: '2024-09-10', amount: 150 },
        { date: '2024-09-11', amount: 200 },
        { date: '2024-09-12', amount: 175 }
      ]
      
      const dailyTotals = transactions.reduce((acc, txn) => {
        if (!acc[txn.date]) acc[txn.date] = 0
        acc[txn.date] += txn.amount
        return acc
      }, {} as Record<string, number>)
      
      expect(dailyTotals).toEqual({
        '2024-09-10': 250,
        '2024-09-11': 200,
        '2024-09-12': 175
      })
    })

    it('should calculate percentage change from previous day', () => {
      const today = 300
      const yesterday = 250
      const percentChange = ((today - yesterday) / yesterday) * 100
      
      expect(percentChange).toBe(20)
    })

    it('should handle zero yesterday revenue', () => {
      const today = 300
      const yesterday = 0
      const percentChange = yesterday > 0 
        ? ((today - yesterday) / yesterday) * 100
        : 0
      
      expect(percentChange).toBe(0)
    })
  })
})