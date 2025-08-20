"use strict";
/**
 * HERA Playwright Generator
 * Converts business process tests to Playwright test files
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightGenerator = void 0;
const handlebars_1 = __importDefault(require("handlebars"));
class PlaywrightGenerator {
    constructor() {
        this.template = this.compileTemplate();
        this.registerHelpers();
    }
    /**
     * Generate Playwright test from business process test
     */
    async generateTest(businessTest) {
        const context = this.buildTemplateContext(businessTest);
        return this.template(context);
    }
    /**
     * Build template context from business test
     */
    buildTemplateContext(test) {
        return {
            testId: test.id,
            title: test.title,
            description: test.description,
            industry: test.industry,
            organizationId: test.context.organization_id,
            baseUrl: '{{BASE_URL}}', // Will be replaced at runtime
            personas: this.buildPersonasContext(test.personas),
            setupActions: test.setup?.map(action => this.buildActionContext(action)) || [],
            steps: test.steps.map(step => this.buildStepContext(step)),
            assertions: test.assertions.map(assertion => this.buildAssertionContext(assertion)),
            cleanupActions: test.cleanup?.map(action => this.buildActionContext(action)) || [],
            metadata: test.metadata,
            imports: this.buildImports(test),
            fixtures: this.buildFixtures(test)
        };
    }
    /**
     * Build personas context for template
     */
    buildPersonasContext(personas) {
        return Object.entries(personas).map(([key, persona]) => ({
            name: key,
            role: persona.role,
            permissions: persona.permissions || [],
            organizationId: persona.organization_id
        }));
    }
    /**
     * Build step context for template
     */
    buildStepContext(step) {
        return {
            id: step.id,
            description: step.description,
            persona: step.persona,
            timeout: step.timeout || 30000,
            actions: step.actions.map((action) => this.buildActionContext(action)),
            preconditions: step.preconditions || [],
            postconditions: step.postconditions || []
        };
    }
    /**
     * Build action context for template
     */
    buildActionContext(action) {
        const baseAction = {
            type: action.action_type,
            storeAs: action.store_as
        };
        switch (action.action_type) {
            case 'ui_interaction':
                return {
                    ...baseAction,
                    selector: action.selector,
                    interaction: action.interaction,
                    value: action.value,
                    timeout: action.timeout
                };
            case 'api_call':
                return {
                    ...baseAction,
                    endpoint: action.endpoint,
                    method: action.method,
                    data: action.data
                };
            case 'create_entity':
                return {
                    ...baseAction,
                    entityData: action.data
                };
            case 'create_transaction':
                return {
                    ...baseAction,
                    transactionData: action.data
                };
            case 'wait':
                return {
                    ...baseAction,
                    duration: action.duration,
                    condition: action.condition
                };
            default:
                return baseAction;
        }
    }
    /**
     * Build assertion context for template
     */
    buildAssertionContext(assertion) {
        return {
            type: assertion.type,
            assertions: assertion.assertions.map((assert) => {
                if (assertion.type === 'ui') {
                    return {
                        selector: assert.selector,
                        condition: assert.condition,
                        value: assert.value,
                        timeout: assert.timeout || 5000
                    };
                }
                else if (assertion.type === 'database') {
                    return {
                        table: assert.table,
                        condition: assert.condition,
                        filters: assert.filters,
                        expected: assert.expected
                    };
                }
                else if (assertion.type === 'business') {
                    return {
                        oracle: assert.oracle,
                        expected: assert.expected,
                        tolerance: assert.tolerance
                    };
                }
                return assert;
            })
        };
    }
    /**
     * Build imports needed for the test
     */
    buildImports(test) {
        const imports = [
            "import { test, expect } from '@playwright/test';",
            "import { createClient } from '@supabase/supabase-js';"
        ];
        // Add industry-specific imports
        if (test.industry) {
            imports.push(`import { ${test.industry}Helpers } from '../helpers/${test.industry}-helpers';`);
        }
        // Add persona-specific imports if auth is required
        if (test.metadata.requires_auth) {
            imports.push("import { AuthHelpers } from '../helpers/auth-helpers';");
        }
        return imports;
    }
    /**
     * Build fixtures for the test
     */
    buildFixtures(test) {
        const fixtures = {
            hasAuth: test.metadata.requires_auth,
            hasDatabase: test.metadata.requires_data,
            personas: Object.keys(test.personas)
        };
        return fixtures;
    }
    /**
     * Register Handlebars helpers
     */
    registerHelpers() {
        // Helper for generating UI interaction code
        handlebars_1.default.registerHelper('generateUIAction', function (action) {
            switch (action.interaction) {
                case 'click':
                    return `await page.locator('${action.selector}').click();`;
                case 'fill':
                    return `await page.locator('${action.selector}').fill('${action.value}');`;
                case 'select':
                    return `await page.locator('${action.selector}').selectOption('${action.value}');`;
                case 'wait':
                    return `await page.locator('${action.selector}').waitFor({ timeout: ${action.timeout} });`;
                default:
                    return `// Unknown interaction: ${action.interaction}`;
            }
        });
        // Helper for generating API calls
        handlebars_1.default.registerHelper('generateAPICall', function (action) {
            const dataParam = action.data ? `, ${JSON.stringify(action.data, null, 2)}` : '';
            return `const ${action.storeAs || 'response'} = await page.request.${action.method.toLowerCase()}('${action.endpoint}'${dataParam});`;
        });
        // Helper for generating database queries
        handlebars_1.default.registerHelper('generateDatabaseQuery', function (assertion) {
            let query = `supabase.from('${assertion.table}')`;
            if (assertion.filters) {
                Object.entries(assertion.filters).forEach(([key, value]) => {
                    query += `.eq('${key}', '${value}')`;
                });
            }
            query += '.select()';
            return query;
        });
        // Helper for generating business assertions
        handlebars_1.default.registerHelper('generateBusinessAssertion', function (assertion) {
            switch (assertion.oracle) {
                case 'accounting_equation':
                    return `expect(await businessOracles.validateAccountingEquation(glAccounts, transactions)).toEqual({ valid: ${assertion.expected} });`;
                case 'smart_code_validation':
                    return `expect(await businessOracles.validateSmartCodePatterns(entities, transactions, relationships)).toEqual({ valid: ${assertion.expected} });`;
                default:
                    return `// Business oracle not implemented: ${assertion.oracle}`;
            }
        });
        // Helper for conditional blocks
        handlebars_1.default.registerHelper('if_eq', function (a, b, options) {
            if (a === b) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
    }
    /**
     * Compile the Playwright test template
     */
    compileTemplate() {
        const templateSource = `
{{#each imports}}
{{{this}}}
{{/each}}

// Generated HERA Business Process Test: {{title}}
// Industry: {{industry}}
// Test ID: {{testId}}

describe('{{title}}', () => {
  let supabase: any;
  {{#if fixtures.hasAuth}}
  let authHelpers: AuthHelpers;
  {{/if}}
  
  beforeAll(async () => {
    {{#if fixtures.hasDatabase}}
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    {{/if}}
    {{#if fixtures.hasAuth}}
    authHelpers = new AuthHelpers();
    {{/if}}
  });

  {{#each personas}}
  test.describe('As {{role}} ({{name}})', () => {
    let page: Page;
    
    beforeEach(async ({ browser }) => {
      page = await browser.newPage();
      await page.goto(process.env.BASE_URL || 'http://localhost:3000');
      
      {{#if ../fixtures.hasAuth}}
      // Authenticate as {{name}}
      await authHelpers.loginAs(page, '{{name}}', {
        role: '{{role}}',
        organizationId: '{{organizationId}}',
        permissions: [{{#each permissions}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}]
      });
      {{/if}}
    });

    afterEach(async () => {
      await page?.close();
    });
  {{/each}}

    test('{{testId}} - {{description}}', async () => {
      // Test context variables
      const context = {
        organizationId: '{{organizationId}}',
        testId: '{{testId}}',
        timestamp: Date.now()
      };

      {{#if setupActions.length}}
      // Setup Phase
      {{#each setupActions}}
      {{#if_eq type 'create_entity'}}
      const {{storeAs}} = await supabase
        .from('core_entities')
        .insert({
          ...{{{json entityData}}},
          organization_id: context.organizationId
        })
        .select()
        .single();
      expect({{storeAs}}.error).toBeNull();
      context.{{storeAs}} = {{storeAs}}.data;
      {{/if_eq}}

      {{#if_eq type 'create_transaction'}}
      const {{storeAs}} = await supabase
        .from('universal_transactions')
        .insert({
          ...{{{json transactionData}}},
          organization_id: context.organizationId
        })
        .select()
        .single();
      expect({{storeAs}}.error).toBeNull();
      context.{{storeAs}} = {{storeAs}}.data;
      {{/if_eq}}
      {{/each}}
      {{/if}}

      {{#each steps}}
      // Step: {{description}}
      {{#each actions}}
      {{#if_eq type 'ui_interaction'}}
      {{{generateUIAction this}}}
      {{/if_eq}}

      {{#if_eq type 'api_call'}}
      {{{generateAPICall this}}}
      {{/if_eq}}

      {{#if_eq type 'wait'}}
      await page.waitForTimeout({{duration}});
      {{#if condition}}
      // Wait condition: {{condition}}
      {{/if}}
      {{/if_eq}}

      {{#if_eq type 'create_entity'}}
      const {{storeAs}} = await supabase
        .from('core_entities')
        .insert({
          ...{{{json entityData}}},
          organization_id: context.organizationId
        })
        .select()
        .single();
      expect({{storeAs}}.error).toBeNull();
      context.{{storeAs}} = {{storeAs}}.data;
      {{/if_eq}}
      {{/each}}
      {{/each}}

      {{#if assertions.length}}
      // Assertions Phase
      {{#each assertions}}
      {{#if_eq type 'ui'}}
      {{#each assertions}}
      {{#if_eq condition 'visible'}}
      await expect(page.locator('{{selector}}')).toBeVisible({ timeout: {{timeout}} });
      {{/if_eq}}
      {{#if_eq condition 'contains'}}
      await expect(page.locator('{{selector}}')).toContainText('{{value}}', { timeout: {{timeout}} });
      {{/if_eq}}
      {{#if_eq condition 'count'}}
      await expect(page.locator('{{selector}}')).toHaveCount({{value}});
      {{/if_eq}}
      {{/each}}
      {{/if_eq}}

      {{#if_eq type 'database'}}
      {{#each assertions}}
      const dbResult{{@index}} = await {{{generateDatabaseQuery this}}};
      {{#if_eq condition 'exists'}}
      expect(dbResult{{@index}}.data?.length).toBeGreaterThan(0);
      {{/if_eq}}
      {{#if_eq condition 'count'}}
      expect(dbResult{{@index}}.data?.length).toBe({{expected}});
      {{/if_eq}}
      {{/each}}
      {{/if_eq}}

      {{#if_eq type 'business'}}
      {{#each assertions}}
      {{{generateBusinessAssertion this}}}
      {{/each}}
      {{/if_eq}}
      {{/each}}
      {{/if}}

      {{#if cleanupActions.length}}
      // Cleanup Phase
      {{#each cleanupActions}}
      {{#if_eq type 'api_call'}}
      {{{generateAPICall this}}}
      {{/if_eq}}
      {{/each}}
      {{/if}}
    });

  {{#each personas}}
  });
  {{/each}}
});
`;
        return handlebars_1.default.compile(templateSource);
    }
}
exports.PlaywrightGenerator = PlaywrightGenerator;
// Helper function to convert object to JSON string for templates
handlebars_1.default.registerHelper('json', function (context) {
    return JSON.stringify(context, null, 2);
});
