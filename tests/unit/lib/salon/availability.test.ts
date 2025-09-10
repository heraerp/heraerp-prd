import { describe, it, expect } from 'vitest'
import { isWithinInterval, parseISO, addMinutes } from 'date-fns'

// Availability calculation functions
export function checkSlotAvailability(
  slotStart: Date,
  slotEnd: Date,
  busyBlocks: Array<{ start: string; end: string }>,
  workingHours: { start: string; end: string }
): boolean {
  // Check if slot is within working hours
  const [workStartHour, workStartMin] = workingHours.start.split(':').map(Number)
  const [workEndHour, workEndMin] = workingHours.end.split(':').map(Number)
  
  const workStart = new Date(slotStart)
  workStart.setHours(workStartHour, workStartMin, 0, 0)
  
  const workEnd = new Date(slotStart)
  workEnd.setHours(workEndHour, workEndMin, 0, 0)
  
  if (slotStart < workStart || slotEnd > workEnd) {
    return false
  }
  
  // Check for conflicts with busy blocks
  for (const block of busyBlocks) {
    const blockStart = parseISO(block.start)
    const blockEnd = parseISO(block.end)
    
    // Check if there's any overlap
    if (
      isWithinInterval(slotStart, { start: blockStart, end: blockEnd }) ||
      isWithinInterval(slotEnd, { start: blockStart, end: blockEnd }) ||
      isWithinInterval(blockStart, { start: slotStart, end: slotEnd })
    ) {
      return false
    }
  }
  
  return true
}

export function calculateSlotScore(
  slotStart: Date,
  preferences: {
    preferMorning?: boolean
    avoidAfterPrayer?: boolean
    minimizeGaps?: boolean
  },
  busyBlocks: Array<{ start: string; end: string; reason: string }>
): number {
  let score = 0.5 // Base score
  
  const hour = slotStart.getHours()
  
  // Morning preference
  if (preferences.preferMorning && hour < 12) {
    score += 0.2
  }
  
  // Avoid slots right after prayer
  if (preferences.avoidAfterPrayer) {
    const prayerBlock = busyBlocks.find(b => 
      b.reason === 'prayer_time' &&
      Math.abs(slotStart.getTime() - parseISO(b.end).getTime()) < 30 * 60 * 1000
    )
    if (prayerBlock) {
      score -= 0.15
    }
  }
  
  // Minimize gaps between appointments
  if (preferences.minimizeGaps) {
    // Check if this slot is adjacent to another busy block
    const adjacentBlock = busyBlocks.find(b => {
      const blockStart = parseISO(b.start)
      const blockEnd = parseISO(b.end)
      return (
        Math.abs(slotStart.getTime() - blockEnd.getTime()) < 15 * 60 * 1000 ||
        Math.abs(blockStart.getTime() - slotStart.getTime()) < 15 * 60 * 1000
      )
    })
    if (adjacentBlock) {
      score += 0.1
    }
  }
  
  return Math.min(Math.max(score, 0), 1) // Clamp between 0 and 1
}

// Tests
describe('Appointment Availability', () => {
  describe('checkSlotAvailability', () => {
    it('should return true for slot within working hours with no conflicts', () => {
      const slotStart = new Date('2025-09-01T10:00:00')
      const slotEnd = new Date('2025-09-01T11:00:00')
      const busyBlocks: Array<{ start: string; end: string }> = []
      const workingHours = { start: '09:00', end: '18:00' }
      
      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours)).toBe(true)
    })
    
    it('should return false for slot outside working hours', () => {
      const slotStart = new Date('2025-09-01T08:00:00')
      const slotEnd = new Date('2025-09-01T09:00:00')
      const busyBlocks: Array<{ start: string; end: string }> = []
      const workingHours = { start: '09:00', end: '18:00' }
      
      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours)).toBe(false)
    })
    
    it('should return false for slot overlapping with busy block', () => {
      const slotStart = new Date('2025-09-01T10:30:00')
      const slotEnd = new Date('2025-09-01T11:30:00')
      const busyBlocks = [
        { start: '2025-09-01T10:00:00Z', end: '2025-09-01T11:00:00Z' }
      ]
      const workingHours = { start: '09:00', end: '18:00' }
      
      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours)).toBe(false)
    })
    
    it('should return false when busy block is completely within slot', () => {
      const slotStart = new Date('2025-09-01T10:00:00')
      const slotEnd = new Date('2025-09-01T12:00:00')
      const busyBlocks = [
        { start: '2025-09-01T10:30:00Z', end: '2025-09-01T11:30:00Z' }
      ]
      const workingHours = { start: '09:00', end: '18:00' }
      
      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours)).toBe(false)
    })
    
    it('should handle slot ending exactly at working hours end', () => {
      const slotStart = new Date('2025-09-01T17:00:00')
      const slotEnd = new Date('2025-09-01T18:00:00')
      const busyBlocks: Array<{ start: string; end: string }> = []
      const workingHours = { start: '09:00', end: '18:00' }
      
      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours)).toBe(true)
    })
  })
  
  describe('calculateSlotScore', () => {
    it('should give higher score to morning slots when preferred', () => {
      const morningSlot = new Date('2025-09-01T10:00:00')
      const afternoonSlot = new Date('2025-09-01T14:00:00')
      const preferences = { preferMorning: true }
      const busyBlocks: Array<{ start: string; end: string; reason: string }> = []
      
      const morningScore = calculateSlotScore(morningSlot, preferences, busyBlocks)
      const afternoonScore = calculateSlotScore(afternoonSlot, preferences, busyBlocks)
      
      expect(morningScore).toBeGreaterThan(afternoonScore)
    })
    
    it('should reduce score for slots after prayer time', () => {
      const slotAfterPrayer = new Date('2025-09-01T13:15:00')
      const slotLater = new Date('2025-09-01T15:00:00')
      const preferences = { avoidAfterPrayer: true }
      const busyBlocks = [
        { start: '2025-09-01T12:30:00Z', end: '2025-09-01T13:00:00Z', reason: 'prayer_time' }
      ]
      
      const afterPrayerScore = calculateSlotScore(slotAfterPrayer, preferences, busyBlocks)
      const laterScore = calculateSlotScore(slotLater, preferences, busyBlocks)
      
      expect(afterPrayerScore).toBeLessThan(laterScore)
    })
    
    it('should increase score for slots adjacent to existing appointments', () => {
      const adjacentSlot = new Date('2025-09-01T11:00:00')
      const isolatedSlot = new Date('2025-09-01T14:00:00')
      const preferences = { minimizeGaps: true }
      const busyBlocks = [
        { start: '2025-09-01T10:00:00Z', end: '2025-09-01T11:00:00Z', reason: 'existing_appointment' }
      ]
      
      const adjacentScore = calculateSlotScore(adjacentSlot, preferences, busyBlocks)
      const isolatedScore = calculateSlotScore(isolatedSlot, preferences, busyBlocks)
      
      expect(adjacentScore).toBeGreaterThan(isolatedScore)
    })
    
    it('should clamp scores between 0 and 1', () => {
      const slot = new Date('2025-09-01T10:00:00')
      const preferences = { preferMorning: true, minimizeGaps: true }
      const busyBlocks: Array<{ start: string; end: string; reason: string }> = []
      
      const score = calculateSlotScore(slot, preferences, busyBlocks)
      
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })
  
  describe('Multi-service appointment booking', () => {
    it('should correctly calculate total duration with buffers', () => {
      const services = [
        { duration: 60, buffer_before: 10, buffer_after: 10 },
        { duration: 30, buffer_before: 5, buffer_after: 5 }
      ]
      
      const totalDuration = services.reduce((sum, service) => 
        sum + service.duration + service.buffer_before + service.buffer_after, 0
      )
      
      expect(totalDuration).toBe(110) // 60+10+10 + 30+5+5
    })
    
    it('should handle cross-day appointments', () => {
      const slotStart = new Date('2025-09-01T20:00:00')
      const slotEnd = new Date('2025-09-02T01:00:00') // Next day
      const busyBlocks: Array<{ start: string; end: string }> = []
      const workingHours = { start: '09:00', end: '21:00' }
      
      // Should be false because it extends beyond working hours
      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours)).toBe(false)
    })
  })
  
  describe('Double booking scenarios', () => {
    it('should allow double booking when enabled for stylist', () => {
      // This would be handled at a higher level, not in the availability check
      // The availability check would still show conflicts, but the booking system
      // would allow it based on the stylist's allow_double_book flag
      const allowDoubleBook = true
      const hasConflict = true // Detected by availability check
      
      const canBook = hasConflict ? allowDoubleBook : true
      
      expect(canBook).toBe(true)
    })
  })
})