// Jest setup file
require('@testing-library/jest-dom');

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.DEFAULT_ORGANIZATION_ID = 'test-org-123';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid UUID`
        : `expected ${received} to be a valid UUID`,
    };
  },
  toBeValidSmartCode(received) {
    const smartCodeRegex = /^HERA\.[A-Z]+(\.[A-Z]+)*\.v\d+$/;
    const pass = smartCodeRegex.test(received);
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid Smart Code`
        : `expected ${received} to be a valid Smart Code`,
    };
  },
});