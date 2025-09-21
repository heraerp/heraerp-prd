// ============================================================================
// HERA • Kanban Playbook Hook Tests
// ============================================================================

import { renderHook, act } from '@testing-library/react';
import { useKanbanPlaybook } from '../useKanbanPlaybook';
import { ALLOWED_TRANSITIONS } from '@/schemas/kanban';

describe('useKanbanPlaybook', () => {
  describe('Status Transitions', () => {
    it('should allow valid transitions from DRAFT', () => {
      const { result } = renderHook(() =>
        useKanbanPlaybook({
          organization_id: 'test-org',
          branch_id: 'test-branch',
          date: '2024-01-01',
          userId: 'test-user'
        })
      );

      expect(result.current.canTransition('DRAFT', 'BOOKED')).toBe(true);
      expect(result.current.canTransition('DRAFT', 'CANCELLED')).toBe(true);
      expect(result.current.canTransition('DRAFT', 'IN_SERVICE')).toBe(false);
    });

    it('should allow valid transitions from BOOKED', () => {
      const { result } = renderHook(() =>
        useKanbanPlaybook({
          organization_id: 'test-org',
          branch_id: 'test-branch',
          date: '2024-01-01',
          userId: 'test-user'
        })
      );

      expect(result.current.canTransition('BOOKED', 'CHECKED_IN')).toBe(true);
      expect(result.current.canTransition('BOOKED', 'CANCELLED')).toBe(true);
      expect(result.current.canTransition('BOOKED', 'NO_SHOW')).toBe(true);
      expect(result.current.canTransition('BOOKED', 'DONE')).toBe(false);
    });

    it('should prevent transitions from terminal states', () => {
      const { result } = renderHook(() =>
        useKanbanPlaybook({
          organization_id: 'test-org',
          branch_id: 'test-branch',
          date: '2024-01-01',
          userId: 'test-user'
        })
      );

      expect(result.current.canTransition('DONE', 'BOOKED')).toBe(false);
      expect(result.current.canTransition('CANCELLED', 'BOOKED')).toBe(false);
      expect(result.current.canTransition('NO_SHOW', 'CHECKED_IN')).toBe(false);
    });

    it('should validate complete transition matrix', () => {
      const { result } = renderHook(() =>
        useKanbanPlaybook({
          organization_id: 'test-org',
          branch_id: 'test-branch',
          date: '2024-01-01',
          userId: 'test-user'
        })
      );

      // Test every transition in ALLOWED_TRANSITIONS
      Object.entries(ALLOWED_TRANSITIONS).forEach(([from, allowedTo]) => {
        allowedTo.forEach(to => {
          expect(result.current.canTransition(from as any, to)).toBe(true);
        });
      });
    });
  });
});