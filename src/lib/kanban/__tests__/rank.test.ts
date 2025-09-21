// ============================================================================
// HERA • Kanban Rank Tests
// ============================================================================

import { between, rankByTime } from '../rank'

describe('Kanban Rank', () => {
  describe('between()', () => {
    it('should return middle rank when no neighbors', () => {
      expect(between()).toBe('m')
    })

    it('should generate rank before first item', () => {
      const rank = between(undefined, 'm')
      expect(rank).toBeLessThan('m')
    })

    it('should generate rank after last item', () => {
      const rank = between('m', undefined)
      expect(rank).toBeGreaterThan('m')
    })

    it('should generate rank between two items', () => {
      const rank = between('a', 'z')
      expect(rank).toBeGreaterThan('a')
      expect(rank).toBeLessThan('z')
    })

    it('should handle adjacent ranks', () => {
      const rank = between('a', 'b')
      expect(rank).toBe('a' + String.fromCharCode(('a'.charCodeAt(0) + 'b'.charCodeAt(0)) / 2))
    })

    it('should expand when ranks are too close', () => {
      const rank = between('aa', 'ab')
      expect(rank).toBeGreaterThan('aa')
      expect(rank).toBeLessThan('ab')
    })

    it('should maintain order for multiple inserts', () => {
      const ranks = ['m']

      // Insert at beginning
      ranks.unshift(between(undefined, ranks[0]))

      // Insert at end
      ranks.push(between(ranks[ranks.length - 1], undefined))

      // Insert in middle
      ranks.splice(1, 0, between(ranks[0], ranks[1]))

      // Verify order
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i]).toBeGreaterThan(ranks[i - 1])
      }
    })
  })

  describe('rankByTime()', () => {
    it('should generate time-based rank', () => {
      expect(rankByTime('2024-01-01', '09:30')).toBe('h09m30')
      expect(rankByTime('2024-01-01', '14:00')).toBe('h14m00')
    })

    it('should maintain chronological order', () => {
      const rank1 = rankByTime('2024-01-01', '09:00')
      const rank2 = rankByTime('2024-01-01', '10:30')
      const rank3 = rankByTime('2024-01-01', '14:15')

      expect(rank1).toBeLessThan(rank2)
      expect(rank2).toBeLessThan(rank3)
    })
  })
})
