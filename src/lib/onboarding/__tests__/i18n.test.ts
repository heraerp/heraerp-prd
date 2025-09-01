/**
 * Unit tests for HERA Onboarding i18n
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMessage,
  interpolate,
  validateMessageKeys,
  extractTourMessageKeys,
  detectLanguage,
  I18nManager,
  defaultMessages,
} from '../i18n';

describe('i18n', () => {
  describe('interpolate', () => {
    it('should replace variables in message', () => {
      const message = 'Step {{current}} of {{total}}';
      const result = interpolate(message, { current: 2, total: 5 });
      expect(result).toBe('Step 2 of 5');
    });

    it('should handle missing variables', () => {
      const message = 'Hello {{name}}, your ID is {{id}}';
      const result = interpolate(message, { name: 'John' });
      expect(result).toBe('Hello John, your ID is {{id}}');
    });

    it('should handle non-string values', () => {
      const message = 'Count: {{count}}, Active: {{active}}';
      const result = interpolate(message, { count: 42, active: true });
      expect(result).toBe('Count: 42, Active: true');
    });
  });

  describe('getMessage', () => {
    it('should return message from custom messages', () => {
      const custom = { 'test.key': 'Custom Message' };
      const result = getMessage('test.key', custom);
      expect(result).toBe('Custom Message');
    });

    it('should fallback to default messages', () => {
      const result = getMessage('ui.onboard.controls.next');
      expect(result).toBe('Next');
    });

    it('should return key if message not found', () => {
      const result = getMessage('non.existent.key');
      expect(result).toBe('non.existent.key');
    });

    it('should interpolate values', () => {
      const result = getMessage(
        'ui.onboard.progress.step',
        {},
        { current: 3, total: 7 }
      );
      expect(result).toBe('Step 3 of 7');
    });
  });

  describe('validateMessageKeys', () => {
    it('should identify found and missing keys', () => {
      const requiredKeys = [
        'ui.onboard.controls.next',
        'ui.onboard.controls.back',
        'missing.key.one',
        'missing.key.two',
      ];

      const result = validateMessageKeys(requiredKeys);
      
      expect(result.found).toContain('ui.onboard.controls.next');
      expect(result.found).toContain('ui.onboard.controls.back');
      expect(result.missing).toContain('missing.key.one');
      expect(result.missing).toContain('missing.key.two');
    });

    it('should check custom messages too', () => {
      const custom = { 'custom.key': 'Custom Value' };
      const result = validateMessageKeys(['custom.key'], custom);
      
      expect(result.found).toContain('custom.key');
      expect(result.missing).toHaveLength(0);
    });
  });

  describe('extractTourMessageKeys', () => {
    it('should extract all message keys from tour steps', () => {
      const steps = [
        { titleKey: 'step1.title', bodyKey: 'step1.body' },
        { titleKey: 'step2.title', bodyKey: 'step2.body' },
      ];

      const keys = extractTourMessageKeys(steps);
      
      expect(keys).toContain('step1.title');
      expect(keys).toContain('step1.body');
      expect(keys).toContain('step2.title');
      expect(keys).toContain('step2.body');
      
      // Should also include control keys
      expect(keys).toContain('ui.onboard.controls.next');
      expect(keys).toContain('ui.onboard.progress.step');
    });

    it('should return unique keys', () => {
      const steps = [
        { titleKey: 'duplicate.title', bodyKey: 'duplicate.body' },
        { titleKey: 'duplicate.title', bodyKey: 'unique.body' },
      ];

      const keys = extractTourMessageKeys(steps);
      const duplicateCount = keys.filter(k => k === 'duplicate.title').length;
      
      expect(duplicateCount).toBe(1);
    });
  });

  describe('detectLanguage', () => {
    beforeEach(() => {
      // Reset navigator.language mock
      vi.restoreAllMocks();
    });

    it('should return browser language', () => {
      Object.defineProperty(window.navigator, 'language', {
        value: 'es-ES',
        configurable: true,
      });

      expect(detectLanguage()).toBe('es');
    });

    it('should handle language without region', () => {
      Object.defineProperty(window.navigator, 'language', {
        value: 'fr',
        configurable: true,
      });

      expect(detectLanguage()).toBe('fr');
    });

    it('should return fallback if no language detected', () => {
      Object.defineProperty(window.navigator, 'language', {
        value: '',
        configurable: true,
      });

      expect(detectLanguage()).toBe('en');
      expect(detectLanguage('de')).toBe('de');
    });
  });

  describe('I18nManager', () => {
    it('should cache default messages', () => {
      const manager = new I18nManager();
      const cache = manager['cache'];
      
      expect(cache.has('en')).toBe(true);
      expect(cache.get('en')).toBe(defaultMessages);
    });

    it('should load messages from loader', async () => {
      const mockLoader = vi.fn().mockResolvedValue({
        'test.key': 'Test Value',
      });

      const manager = new I18nManager(mockLoader);
      const messages = await manager.loadMessages('es');
      
      expect(mockLoader).toHaveBeenCalledWith('es');
      expect(messages).toEqual({ 'test.key': 'Test Value' });
    });

    it('should cache loaded messages', async () => {
      const mockLoader = vi.fn().mockResolvedValue({
        'test.key': 'Test Value',
      });

      const manager = new I18nManager(mockLoader);
      
      // First call
      await manager.loadMessages('es');
      expect(mockLoader).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      await manager.loadMessages('es');
      expect(mockLoader).toHaveBeenCalledTimes(1);
    });

    it('should fallback to English on loader error', async () => {
      const mockLoader = vi.fn().mockRejectedValue(new Error('Network error'));
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const manager = new I18nManager(mockLoader);
      const messages = await manager.loadMessages('es');
      
      expect(messages).toBe(defaultMessages);
      expect(consoleWarn).toHaveBeenCalledWith(
        'Failed to load messages for es, falling back to English',
        expect.any(Error)
      );

      consoleWarn.mockRestore();
    });

    it('should clear cache', () => {
      const manager = new I18nManager();
      const cache = manager['cache'];
      
      cache.set('es', { 'test': 'value' });
      cache.set('fr', { 'test': 'valeur' });
      
      manager.clearCache();
      
      expect(cache.size).toBe(1);
      expect(cache.has('en')).toBe(true);
      expect(cache.has('es')).toBe(false);
      expect(cache.has('fr')).toBe(false);
    });
  });
});