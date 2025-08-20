"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestGenerator = void 0;
const fs = __importStar(require("fs/promises"));
/**
 * Generate test files from DSL definitions
 */
class TestGenerator {
    /**
     * Generate Playwright test from DSL
     */
    static async generatePlaywrightTest(test, outputPath) {
        const testCode = `
import { test, expect } from '@playwright/test';
import { UniversalFixtures } from '@hera/testing';

test.describe('${test.metadata.name}', () => {
  const fixtures = new UniversalFixtures('${test.setup.organization.name}');

  test.beforeAll(async ({ page }) => {
    // Setup organization
    await page.goto('/setup');
    await page.fill('[name="organization_name"]', '${test.setup.organization.name}');
    await page.selectOption('[name="business_type"]', '${test.setup.organization.business_type}');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('${test.metadata.description}', async ({ page }) => {
    ${test.steps.map(step => this.generatePlaywrightStep(step)).join('\n    ')}
  });

  test.afterAll(async ({ page }) => {
    ${test.teardown?.clean_data ? '// Clean up test data' : ''}
  });
});
`;
        await fs.writeFile(outputPath, testCode);
    }
    static generatePlaywrightStep(step) {
        switch (step.type) {
            case 'create_entity':
                return `
    // ${step.name}
    await page.goto('/entities/new');
    await page.fill('[name="entity_type"]', '${step.data.entity_type}');
    await page.fill('[name="entity_name"]', '${step.data.entity_name}');
    await page.fill('[name="entity_code"]', '${step.data.entity_code}');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-message')).toBeVisible();`;
            case 'create_transaction':
                return `
    // ${step.name}
    await page.goto('/transactions/new');
    await page.selectOption('[name="transaction_type"]', '${step.data.transaction_type}');
    await page.fill('[name="total_amount"]', '${step.data.total_amount}');
    await page.click('button[type="submit"]');
    await expect(page.locator('.transaction-success')).toBeVisible();`;
            case 'validate':
                return `
    // Validate: ${step.name}
    ${step.validations?.map(v => `await expect(page.locator('[data-field="${v.field}"]')).toHaveText('${v.expected}');`).join('\n    ')}`;
            default:
                return `// Step: ${step.name} (${step.type})`;
        }
    }
    /**
     * Generate pgTAP database test from DSL
     */
    static async generatePgTAPTest(test, outputPath) {
        const testSQL = `
-- ${test.metadata.name}
-- ${test.metadata.description}

BEGIN;
SELECT plan(${test.steps.length + (test.validations?.length || 0)});

-- Setup organization
INSERT INTO core_organizations (organization_name, organization_code)
VALUES ('${test.setup.organization.name}', '${test.setup.organization.name.toUpperCase().replace(/\s+/g, '_')}');

${test.steps.map(step => this.generatePgTAPStep(step)).join('\n')}

-- Rollback test data
${test.teardown?.clean_data ? 'ROLLBACK;' : 'COMMIT;'}
`;
        await fs.writeFile(outputPath, testSQL);
    }
    static generatePgTAPStep(step) {
        switch (step.type) {
            case 'create_entity':
                return `
-- ${step.name}
INSERT INTO core_entities (
  organization_id, entity_type, entity_name, entity_code, smart_code
) VALUES (
  (SELECT id FROM core_organizations WHERE organization_name = '${step.data.organization_name}'),
  '${step.data.entity_type}',
  '${step.data.entity_name}',
  '${step.data.entity_code}',
  '${step.data.smart_code}'
);

SELECT ok(
  EXISTS(SELECT 1 FROM core_entities WHERE entity_code = '${step.data.entity_code}'),
  'Entity ${step.data.entity_name} created successfully'
);`;
            case 'create_transaction':
                return `
-- ${step.name}
INSERT INTO universal_transactions (
  organization_id, transaction_type, transaction_code, smart_code, total_amount
) VALUES (
  (SELECT id FROM core_organizations WHERE organization_name = '${step.data.organization_name}'),
  '${step.data.transaction_type}',
  '${step.data.transaction_code}',
  '${step.data.smart_code}',
  ${step.data.total_amount}
);

SELECT ok(
  EXISTS(SELECT 1 FROM universal_transactions WHERE transaction_code = '${step.data.transaction_code}'),
  'Transaction ${step.data.transaction_code} created successfully'
);`;
            default:
                return `-- Step: ${step.name} (${step.type})`;
        }
    }
    /**
     * Generate Jest unit test from DSL
     */
    static async generateJestTest(test, outputPath) {
        const testCode = `
import { universalApi } from '@/lib/universal-api';
import { UniversalFixtures } from '@hera/testing';

describe('${test.metadata.name}', () => {
  const fixtures = new UniversalFixtures('test-org-id');
  let organizationId: string;

  beforeAll(async () => {
    // Setup organization
    const org = await universalApi.setupBusiness({
      organization_name: '${test.setup.organization.name}',
      business_type: '${test.setup.organization.business_type}',
      owner_name: 'Test Owner',
    });
    organizationId = org.organization.id;
    universalApi.setOrganizationId(organizationId);
  });

  test('${test.metadata.description}', async () => {
    ${test.steps.map(step => this.generateJestStep(step)).join('\n    ')}
  });

  afterAll(async () => {
    ${test.teardown?.clean_data ? '// Clean up test data' : ''}
  });
});
`;
        await fs.writeFile(outputPath, testCode);
    }
    static generateJestStep(step) {
        switch (step.type) {
            case 'create_entity':
                return `
    // ${step.name}
    const ${step.id} = await universalApi.createEntity({
      entity_type: '${step.data.entity_type}',
      entity_name: '${step.data.entity_name}',
      entity_code: '${step.data.entity_code}',
      smart_code: '${step.data.smart_code}',
    });
    expect(${step.id}).toBeDefined();
    expect(${step.id}.entity_code).toBe('${step.data.entity_code}');`;
            case 'create_transaction':
                return `
    // ${step.name}
    const ${step.id} = await universalApi.createTransaction({
      transaction_type: '${step.data.transaction_type}',
      transaction_code: '${step.data.transaction_code}',
      smart_code: '${step.data.smart_code}',
      total_amount: ${step.data.total_amount},
      ${step.data.line_items ? `line_items: ${JSON.stringify(step.data.line_items)}` : ''}
    });
    expect(${step.id}).toBeDefined();
    expect(${step.id}.total_amount).toBe(${step.data.total_amount});`;
            case 'validate':
                return `
    // Validate: ${step.name}
    ${step.validations?.map(v => {
                    switch (v.type) {
                        case 'exists':
                            return `expect(${v.field}).toBeDefined();`;
                        case 'equals':
                            return `expect(${v.field}).toBe(${JSON.stringify(v.expected)});`;
                        case 'greater_than':
                            return `expect(${v.field}).toBeGreaterThan(${v.expected});`;
                        default:
                            return `// Validation: ${v.type}`;
                    }
                }).join('\n    ')}`;
            default:
                return `// Step: ${step.name} (${step.type})`;
        }
    }
    /**
     * Generate Agent/MCP test from DSL
     */
    static async generateAgentTest(test, outputPath) {
        const testCode = `
import { MCPTestRunner } from '@hera/testing';

describe('MCP Agent Test: ${test.metadata.name}', () => {
  const runner = new MCPTestRunner();

  test('${test.metadata.description}', async () => {
    // Initialize MCP connection
    await runner.connect();

    ${test.steps.map(step => this.generateAgentStep(step)).join('\n    ')}

    // Validate final state
    ${test.validations?.map(v => `await runner.expectState('${v.field}', '${v.expected}');`).join('\n    ')}
  });
});

// Natural language test scenarios
const scenarios = [
  ${test.steps.map(step => `"${this.stepToNaturalLanguage(step)}"`).join(',\n  ')}
];
`;
        await fs.writeFile(outputPath, testCode);
    }
    static generateAgentStep(step) {
        return `
    // ${step.name}
    await runner.executeCommand('${this.stepToNaturalLanguage(step)}');
    await runner.waitForCompletion();`;
    }
    static stepToNaturalLanguage(step) {
        switch (step.type) {
            case 'create_entity':
                return `Create a ${step.data.entity_type} named "${step.data.entity_name}"`;
            case 'create_transaction':
                return `Create a ${step.data.transaction_type} transaction for ${step.data.total_amount}`;
            case 'create_relationship':
                return `Link entity ${step.data.from_entity_id} to ${step.data.to_entity_id}`;
            default:
                return step.name;
        }
    }
}
exports.TestGenerator = TestGenerator;
