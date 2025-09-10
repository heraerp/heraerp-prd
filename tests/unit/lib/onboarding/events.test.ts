/**
 * Unit tests for HERA Onboarding events
 */

import { describe, it, expect, vi } from 'vitest';
import {
  emitTourStart,
  emitStepShown,
  emitStepCompleted,
  emitTourCompleted,
  emitTourDismissed,
  emitStepError,
  OnboardingEventEmitter,
} from '../events';
import type { OnboardingTransaction, OnboardingTransactionLine } from '../types';

describe('Events', () => {
  const mockOrganizationId = 'org_test_123';
  const mockTourCode = 'HERA.UI.ONBOARD.TEST.v1' as const;
  const mockStepCode = 'HERA.UI.ONBOARD.TEST.STEP1.v1' as const;

  describe('Event emission functions', () => {
    it('should emit tour start event', () => {
      const onEmit = vi.fn();
      const metadata = { user_id: 'user_123' };

      emitTourStart(mockOrganizationId, mockTourCode, metadata, onEmit);

      expect(onEmit).toHaveBeenCalledTimes(1);
      const [transaction, lines] = onEmit.mock.calls[0];

      expect(transaction).toMatchObject({
        organization_id: mockOrganizationId,
        smart_code: mockTourCode,
        ai_confidence: null,
        ai_insights: null,
      });

      expect(transaction.metadata).toMatchObject({
        user_id: 'user_123',
        event: 'tour_start',
      });

      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({
        transaction_id: transaction.id,
        line_index: 0,
        smart_code: mockTourCode,
        status: 'started',
      });
    });

    it('should emit step shown event', () => {
      const onEmit = vi.fn();

      emitStepShown(mockOrganizationId, mockTourCode, mockStepCode, 0, undefined, onEmit);

      expect(onEmit).toHaveBeenCalledTimes(1);
      const [transaction, lines] = onEmit.mock.calls[0];

      expect(transaction.smart_code).toBe(mockTourCode);
      expect(lines[0]).toMatchObject({
        smart_code: mockStepCode,
        status: 'shown',
      });
      expect(lines[0].metadata.step_index).toBe(0);
    });

    it('should emit step completed event with duration', () => {
      const onEmit = vi.fn();
      const startTime = Date.now() - 5000; // 5 seconds ago

      emitStepCompleted(mockOrganizationId, mockTourCode, mockStepCode, 0, startTime, undefined, onEmit);

      expect(onEmit).toHaveBeenCalledTimes(1);
      const [, lines] = onEmit.mock.calls[0];

      expect(lines[0].status).toBe('completed');
      expect(lines[0].duration_ms).toBeGreaterThanOrEqual(5000);
      expect(lines[0].duration_ms).toBeLessThan(6000);
    });

    it('should emit tour completed event with statistics', () => {
      const onEmit = vi.fn();
      const startTime = Date.now() - 30000; // 30 seconds ago
      const stepDurations = {
        'HERA.UI.ONBOARD.TEST.STEP1.v1': 5000,
        'HERA.UI.ONBOARD.TEST.STEP2.v1': 8000,
        'HERA.UI.ONBOARD.TEST.STEP3.v1': 10000,
      };

      emitTourCompleted(mockOrganizationId, mockTourCode, 3, 3, startTime, stepDurations, undefined, onEmit);

      expect(onEmit).toHaveBeenCalledTimes(1);
      const [transaction, lines] = onEmit.mock.calls[0];

      expect(transaction.metadata).toMatchObject({
        event: 'tour_completed',
        total_steps: 3,
        completed_steps: 3,
        completion_rate: 100,
      });

      expect(transaction.metadata.avg_step_duration_ms).toBeCloseTo(7666.67, 0);
      expect(transaction.metadata.total_duration_ms).toBeGreaterThanOrEqual(30000);

      // Should have summary line + 3 step duration lines
      expect(lines).toHaveLength(4);
      expect(lines[0].status).toBe('completed');
      expect(lines[1].duration_ms).toBe(5000);
      expect(lines[2].duration_ms).toBe(8000);
      expect(lines[3].duration_ms).toBe(10000);
    });

    it('should emit tour dismissed event', () => {
      const onEmit = vi.fn();
      const startTime = Date.now() - 15000;

      emitTourDismissed(mockOrganizationId, mockTourCode, 'skipped', 2, 5, startTime, undefined, onEmit);

      expect(onEmit).toHaveBeenCalledTimes(1);
      const [transaction, lines] = onEmit.mock.calls[0];

      expect(transaction.metadata).toMatchObject({
        event: 'tour_skipped',
        current_step: 2,
        total_steps: 5,
        progress_percentage: 40,
      });

      expect(lines[0].status).toBe('skipped');
    });

    it('should emit step error event', () => {
      const onEmit = vi.fn();
      const errorMessage = 'Element not found';

      emitStepError(mockOrganizationId, mockTourCode, mockStepCode, 0, errorMessage, undefined, onEmit);

      expect(onEmit).toHaveBeenCalledTimes(1);
      const [, lines] = onEmit.mock.calls[0];

      expect(lines[0]).toMatchObject({
        status: 'error',
        smart_code: mockStepCode,
      });
      expect(lines[0].metadata.error_message).toBe(errorMessage);
    });

    it('should not emit if onEmit is not provided', () => {
      // Should not throw
      expect(() => {
        emitTourStart(mockOrganizationId, mockTourCode);
      }).not.toThrow();
    });
  });

  describe('OnboardingEventEmitter', () => {
    it('should track step durations', () => {
      const onEmit = vi.fn();
      const emitter = new OnboardingEventEmitter(mockOrganizationId, mockTourCode, onEmit);

      // Show step
      emitter.stepShown(mockStepCode, 0);

      // Wait a bit
      vi.advanceTimersByTime(3000);

      // Complete step
      emitter.stepCompleted(mockStepCode, 0);

      const durations = emitter.getStepDurations();
      expect(durations[mockStepCode]).toBeGreaterThanOrEqual(2900);
      expect(durations[mockStepCode]).toBeLessThan(3100);
    });

    it('should track total duration', () => {
      const onEmit = vi.fn();
      const emitter = new OnboardingEventEmitter(mockOrganizationId, mockTourCode, onEmit);

      // Wait
      vi.advanceTimersByTime(5000);

      const totalDuration = emitter.getTotalDuration();
      expect(totalDuration).toBeGreaterThanOrEqual(4900);
      expect(totalDuration).toBeLessThan(5100);
    });

    it('should emit tour start event', () => {
      const onEmit = vi.fn();
      const emitter = new OnboardingEventEmitter(mockOrganizationId, mockTourCode, onEmit);

      emitter.tourStart({ source: 'manual' });

      expect(onEmit).toHaveBeenCalledTimes(1);
      const [transaction] = onEmit.mock.calls[0];
      expect(transaction.smart_code).toBe(mockTourCode);
      expect(transaction.metadata.source).toBe('manual');
    });

    it('should emit tour completed event with collected durations', () => {
      const onEmit = vi.fn();
      const emitter = new OnboardingEventEmitter(mockOrganizationId, mockTourCode, onEmit);

      // Simulate tour
      emitter.stepShown('HERA.UI.ONBOARD.TEST.STEP1.v1' as const, 0);
      vi.advanceTimersByTime(2000);
      emitter.stepCompleted('HERA.UI.ONBOARD.TEST.STEP1.v1' as const, 0);

      emitter.stepShown('HERA.UI.ONBOARD.TEST.STEP2.v1' as const, 1);
      vi.advanceTimersByTime(3000);
      emitter.stepCompleted('HERA.UI.ONBOARD.TEST.STEP2.v1' as const, 1);

      emitter.tourCompleted(2, 2);

      // Should have emitted: 2 shown + 2 completed + 1 tour completed = 5 events
      expect(onEmit).toHaveBeenCalledTimes(5);

      // Check the tour completed event (last call)
      const [, lines] = onEmit.mock.calls[4];
      expect(lines).toHaveLength(3); // summary + 2 step durations
    });

    it('should include metadata in all events', () => {
      const onEmit = vi.fn();
      const emitter = new OnboardingEventEmitter(mockOrganizationId, mockTourCode, onEmit);

      const metadata = { session_id: 'session_123' };
      emitter.tourDismissed('dismissed', 1, 3, metadata);

      expect(onEmit).toHaveBeenCalledTimes(1);
      const [transaction] = onEmit.mock.calls[0];
      expect(transaction.metadata.session_id).toBe('session_123');
    });
  });
});