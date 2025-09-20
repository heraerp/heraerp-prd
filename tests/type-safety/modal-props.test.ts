/**
 * HERA Type Safety Tests - Modal Props
 * 
 * These tests ensure that modal prop interfaces are enforced
 * at both compile time and runtime, preventing prop drift.
 */

import { describe, it, expect } from 'vitest';

import { exact } from '@/utils/exact';
import { 
  CreateGrantModalPropsSchema,
  ReviewGrantModalPropsSchema 
} from '@/contracts/ui-components';

import type { 
  CreateGrantModalProps,
  ReviewGrantModalProps 
} from '@/contracts/ui-components';

describe('Modal Props Type Safety', () => {
  describe('CreateGrantModalProps', () => {
    it('accepts canonical props', () => {
      const validProps = exact<CreateGrantModalProps>()({
        isOpen: true,
        onClose: () => undefined,
      });

      expect(validProps.isOpen).toBe(true);
      expect(typeof validProps.onClose).toBe('function');
    });

    it('validates props with Zod schema', () => {
      const validProps = {
        isOpen: true,
        onClose: () => undefined,
      };

      const result = CreateGrantModalPropsSchema.safeParse(validProps);
      expect(result.success).toBe(true);
    });

    it('rejects props with wrong types', () => {
      const invalidProps = {
        isOpen: 'true', // ❌ Should be boolean
        onClose: () => undefined,
      };

      const result = CreateGrantModalPropsSchema.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });

    it('rejects props with missing required fields', () => {
      const invalidProps = {
        isOpen: true,
        // ❌ Missing onClose
      };

      const result = CreateGrantModalPropsSchema.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });

    it('rejects excess properties (prop drift protection)', () => {
      const invalidProps = {
        isOpen: true,
        onClose: () => undefined,
        extraProp: 'should not be allowed', // ❌ Excess property
      };

      const result = CreateGrantModalPropsSchema.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });

    // This test demonstrates compile-time safety
    it('prevents prop drift at compile time', () => {
      // This would cause a TypeScript compile error:
      // const props = exact<CreateGrantModalProps>()({
      //   open: true, // ❌ Wrong prop name - should be 'isOpen'
      //   onOpenChange: () => {}, // ❌ Wrong prop name - should be 'onClose'
      // });
      
      // The correct usage:
      const props = exact<CreateGrantModalProps>()({
        isOpen: true,
        onClose: () => undefined,
      });

      expect(props).toBeDefined();
    });
  });

  describe('ReviewGrantModalProps', () => {
    it('accepts canonical props', () => {
      const validProps = exact<ReviewGrantModalProps>()({
        isOpen: true,
        onClose: () => undefined,
        applicationId: 'app-123',
      });

      expect(validProps.isOpen).toBe(true);
      expect(typeof validProps.onClose).toBe('function');
      expect(validProps.applicationId).toBe('app-123');
    });

    it('validates props with Zod schema', () => {
      const validProps = {
        isOpen: false,
        onClose: () => undefined,
        applicationId: 'app-456',
      };

      const result = ReviewGrantModalPropsSchema.safeParse(validProps);
      expect(result.success).toBe(true);
    });

    it('rejects props with empty applicationId', () => {
      const invalidProps = {
        isOpen: true,
        onClose: () => undefined,
        applicationId: '', // ❌ Empty string not allowed
      };

      const result = ReviewGrantModalPropsSchema.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });

    it('rejects props missing applicationId', () => {
      const invalidProps = {
        isOpen: true,
        onClose: () => undefined,
        // ❌ Missing applicationId
      };

      const result = ReviewGrantModalPropsSchema.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });

    it('prevents prop drift for review modal', () => {
      // This demonstrates the protection against the exact issue we fixed:
      // const badProps = exact<ReviewGrantModalProps>()({
      //   open: true, // ❌ Would cause compile error
      //   onOpenChange: () => {}, // ❌ Would cause compile error
      //   applicationId: 'app-123',
      // });

      // The correct usage:
      const goodProps = exact<ReviewGrantModalProps>()({
        isOpen: true,
        onClose: () => undefined,
        applicationId: 'app-123',
      });

      expect(goodProps).toBeDefined();
    });
  });

  describe('Cross-Modal Consistency', () => {
    it('enforces consistent prop naming across all modals', () => {
      // Both modals should use the same base prop names
      const createProps = exact<CreateGrantModalProps>()({
        isOpen: true,
        onClose: () => undefined,
      });

      const reviewProps = exact<ReviewGrantModalProps>()({
        isOpen: true,
        onClose: () => undefined,
        applicationId: 'app-123',
      });

      // Both should have the same base prop structure
      expect(typeof createProps.isOpen).toBe('boolean');
      expect(typeof createProps.onClose).toBe('function');
      expect(typeof reviewProps.isOpen).toBe('boolean');
      expect(typeof reviewProps.onClose).toBe('function');
    });
  });

  describe('Function Signature Safety', () => {
    it('enforces correct onClose function signature', () => {
      let callbackCalled = false;
      
      const props = exact<CreateGrantModalProps>()({
        isOpen: true,
        onClose: () => {
          callbackCalled = true;
        },
      });

      // Call the function and verify it works
      props.onClose();
      expect(callbackCalled).toBe(true);
    });

    it('prevents incorrect function signatures', () => {
      // This would cause a compile error:
      // const props = exact<CreateGrantModalProps>()({
      //   isOpen: true,
      //   onClose: (param: string) => {}, // ❌ Wrong signature - should take no params
      // });

      // The correct signature:
      const props = exact<CreateGrantModalProps>()({
        isOpen: true,
        onClose: () => undefined, // ✅ Correct signature
      });

      expect(props).toBeDefined();
    });
  });
});