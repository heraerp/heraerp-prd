import { universalApi } from '@/lib/universal-api';

// Mock universal API for testing
jest.mock('@/lib/universal-api', () => ({
  universalApi: {
    setOrganizationId: jest.fn(),
    setupBusiness: jest.fn(),
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    createTransaction: jest.fn(),
    createRelationship: jest.fn(),
    setDynamicField: jest.fn(),
  },
}));

// Global test setup
beforeAll(() => {
  console.log('🧪 HERA Testing Framework - Global Setup');
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/hera_test';
  
  // Mock fetch for API calls
  global.fetch = jest.fn();
});

afterAll(() => {
  console.log('🧪 HERA Testing Framework - Global Teardown');
  
  // Clean up mocks
  jest.clearAllMocks();
  
  // Clear environment
  delete process.env.NODE_ENV;
});

// Helper functions for tests
global.mockUniversalApiResponse = (data: any) => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
  organization_id: 'test-org-id',
});

global.mockUniversalApiError = (message: string) => ({
  success: false,
  error: { message },
  timestamp: new Date().toISOString(),
});