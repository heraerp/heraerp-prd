import { DSLParser } from '../../src/dsl/parser';
import * as fs from 'fs/promises';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('DSLParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseYAML', () => {
    it('should parse valid YAML test definition', async () => {
      const mockYaml = `
version: "1.0"
metadata:
  name: "Test Order Process"
  description: "Test restaurant order processing"
  industry: "restaurant"
  process_type: "order-to-cash"
  
setup:
  organization:
    name: "Test Restaurant"
    business_type: "restaurant"

steps:
  - id: "customer"
    name: "Create customer"
    type: "create_entity"
    data:
      entity_type: "customer"
      entity_name: "Test Customer"
      entity_code: "CUST-001"
      smart_code: "HERA.REST.CUST.ENT.DINER.v1"

teardown:
  clean_data: true
      `;

      mockFs.readFile.mockResolvedValue(mockYaml);

      const result = await DSLParser.parseYAML('/path/to/test.yaml');

      expect(result).toEqual({
        version: '1.0',
        metadata: {
          name: 'Test Order Process',
          description: 'Test restaurant order processing',
          industry: 'restaurant',
          process_type: 'order-to-cash',
        },
        setup: {
          organization: {
            name: 'Test Restaurant',
            business_type: 'restaurant',
          },
        },
        steps: [
          {
            id: 'customer',
            name: 'Create customer',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'Test Customer',
              entity_code: 'CUST-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
          },
        ],
        teardown: {
          clean_data: true,
        },
      });

      expect(mockFs.readFile).toHaveBeenCalledWith('/path/to/test.yaml', 'utf-8');
    });

    it('should throw error for invalid YAML', async () => {
      mockFs.readFile.mockResolvedValue('invalid: yaml: content: [');

      await expect(DSLParser.parseYAML('/path/to/invalid.yaml'))
        .rejects.toThrow();
    });

    it('should validate schema and throw error for invalid structure', async () => {
      const invalidYaml = `
version: "1.0"
metadata:
  name: "Test"
# Missing required fields
      `;

      mockFs.readFile.mockResolvedValue(invalidYaml);

      await expect(DSLParser.parseYAML('/path/to/invalid.yaml'))
        .rejects.toThrow();
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON test definition', async () => {
      const mockJson = JSON.stringify({
        version: '1.0',
        metadata: {
          name: 'Test Process',
          description: 'Test description',
          industry: 'restaurant',
          process_type: 'order-to-cash',
        },
        setup: {
          organization: {
            name: 'Test Org',
            business_type: 'restaurant',
          },
        },
        steps: [],
      });

      mockFs.readFile.mockResolvedValue(mockJson);

      const result = await DSLParser.parseJSON('/path/to/test.json');

      expect(result.metadata.name).toBe('Test Process');
      expect(result.setup.organization.name).toBe('Test Org');
    });
  });

  describe('validate', () => {
    it('should return valid=true for correct test structure', () => {
      const validTest = {
        version: '1.0',
        metadata: {
          name: 'Test',
          description: 'Test description',
          industry: 'restaurant',
          process_type: 'order-to-cash',
        },
        setup: {
          organization: {
            name: 'Test Org',
            business_type: 'restaurant',
          },
        },
        steps: [
          {
            id: 'step1',
            name: 'Test Step',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'Test Customer',
              entity_code: 'CUST-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
          },
        ],
      };

      const result = DSLParser.validate(validTest);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return validation errors for invalid structure', () => {
      const invalidTest = {
        metadata: {
          name: 'Test',
          // Missing required fields
        },
        setup: {},
        steps: [],
      };

      const result = DSLParser.validate(invalidTest);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('parseString', () => {
    it('should parse YAML string content', () => {
      const yamlContent = `
version: "1.0"
metadata:
  name: "Test"
  description: "Test description"
  industry: "restaurant"
  process_type: "order-to-cash"
setup:
  organization:
    name: "Test Org"
    business_type: "restaurant"
steps: []
      `;

      const result = DSLParser.parseString(yamlContent, 'yaml');

      expect(result.metadata.name).toBe('Test');
    });

    it('should parse JSON string content', () => {
      const jsonContent = JSON.stringify({
        version: '1.0',
        metadata: {
          name: 'Test',
          description: 'Test description',
          industry: 'restaurant',
          process_type: 'order-to-cash',
        },
        setup: {
          organization: {
            name: 'Test Org',
            business_type: 'restaurant',
          },
        },
        steps: [],
      });

      const result = DSLParser.parseString(jsonContent, 'json');

      expect(result.metadata.name).toBe('Test');
    });
  });
});