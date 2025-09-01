/**
 * Unit tests for HERA Onboarding guards
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { awaitSelector, awaitCondition, isElementVisible, prefersReducedMotion } from '../guards';

describe('Guards', () => {
  beforeEach(() => {
    // Mock DOM
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('awaitSelector', () => {
    it('should resolve immediately if element exists', async () => {
      const element = document.createElement('div');
      element.className = 'test-element';
      document.body.appendChild(element);

      const promise = awaitSelector('.test-element', 1000);
      const result = await promise;

      expect(result).toBe(element);
    });

    it('should wait for element to appear', async () => {
      const promise = awaitSelector('.delayed-element', 1000);

      // Add element after delay
      setTimeout(() => {
        const element = document.createElement('div');
        element.className = 'delayed-element';
        document.body.appendChild(element);
      }, 500);

      vi.advanceTimersByTime(600);
      const result = await promise;

      expect(result).toBeTruthy();
      expect(result?.className).toBe('delayed-element');
    });

    it('should timeout if element never appears', async () => {
      const promise = awaitSelector('.missing-element', 500);

      vi.advanceTimersByTime(600);
      const result = await promise;

      expect(result).toBeNull();
    });

    it('should check element visibility', async () => {
      const element = document.createElement('div');
      element.className = 'hidden-element';
      element.style.display = 'none';
      document.body.appendChild(element);

      const promise = awaitSelector('.hidden-element', 500);
      vi.advanceTimersByTime(600);
      const result = await promise;

      expect(result).toBeNull();
    });
  });

  describe('awaitCondition', () => {
    it('should resolve immediately if condition is true', async () => {
      const condition = () => true;
      const result = await awaitCondition(condition, 1000);
      expect(result).toBe(true);
    });

    it('should wait for condition to become true', async () => {
      let flag = false;
      const condition = () => flag;
      const promise = awaitCondition(condition, 1000);

      setTimeout(() => { flag = true; }, 500);
      vi.advanceTimersByTime(600);
      
      const result = await promise;
      expect(result).toBe(true);
    });

    it('should timeout if condition never becomes true', async () => {
      const condition = () => false;
      const promise = awaitCondition(condition, 500);
      
      vi.advanceTimersByTime(600);
      const result = await promise;
      
      expect(result).toBe(false);
    });

    it('should handle async conditions', async () => {
      const condition = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      };
      
      const promise = awaitCondition(condition, 1000);
      vi.advanceTimersByTime(200);
      
      const result = await promise;
      expect(result).toBe(true);
    });

    it('should handle condition errors gracefully', async () => {
      const condition = () => {
        throw new Error('Test error');
      };
      
      const promise = awaitCondition(condition, 500);
      vi.advanceTimersByTime(600);
      
      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('isElementVisible', () => {
    it('should return true for visible element', () => {
      const element = document.createElement('div');
      element.style.width = '100px';
      element.style.height = '100px';
      document.body.appendChild(element);

      // Mock getBoundingClientRect
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      expect(isElementVisible(element)).toBe(true);
    });

    it('should return false for display: none', () => {
      const element = document.createElement('div');
      element.style.display = 'none';
      document.body.appendChild(element);

      expect(isElementVisible(element)).toBe(false);
    });

    it('should return false for visibility: hidden', () => {
      const element = document.createElement('div');
      element.style.visibility = 'hidden';
      document.body.appendChild(element);

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      expect(isElementVisible(element)).toBe(false);
    });

    it('should return false for zero dimensions', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      expect(isElementVisible(element)).toBe(false);
    });

    it('should return false for opacity: 0', () => {
      const element = document.createElement('div');
      element.style.opacity = '0';
      document.body.appendChild(element);

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      expect(isElementVisible(element)).toBe(false);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return false when media query does not match', () => {
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      vi.stubGlobal('matchMedia', mockMatchMedia);

      expect(prefersReducedMotion()).toBe(false);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('should return true when media query matches', () => {
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      vi.stubGlobal('matchMedia', mockMatchMedia);

      expect(prefersReducedMotion()).toBe(true);
    });
  });
});