/**
 * HERA Claude Contract Handshake System
 *
 * This system creates a mandatory "handshake" that Claude must complete before any implementation.
 * It enforces the contract-first development process and prevents Claude from "coding wrongly".
 */
import { z } from 'zod';
import ContractFirstEnforcer from './contract-first-enforcer';
import * as fs from 'fs';
import * as path from 'path';
// Claude Handshake Schema - What Claude must provide before implementation
const ClaudeHandshakeSchema = z.object({
    claude_version: z.string(),
    timestamp: z.string(),
    user_request: z.string().min(10, 'User request must be detailed'),
    understanding: z.object({
        feature_description: z.string().min(20, 'Feature description must be comprehensive'),
        business_impact: z.string().min(10, 'Business impact must be described'),
        smart_code_family: z.string().regex(/^HERA\.[A-Z]+/, 'Must specify HERA smart code family'),
        complexity_assessment: z.enum(['low', 'medium', 'high', 'critical']),
        estimated_effort: z.string()
    }).strict(),
    plan: z.object({
        contracts_to_create: z.array(z.object({
            contract_name: z.string(),
            contract_path: z.string(),
            purpose: z.string(),
            zod_schema_preview: z.string()
        })).min(1, 'At least one contract must be planned'),
        tests_to_create: z.array(z.object({
            test_name: z.string(),
            test_path: z.string(),
            test_type: z.enum(['unit', 'integration', 'e2e', 'type-safety']),
            initial_failure_reason: z.string()
        })).min(1, 'At least one test must be planned'),
        implementation_files: z.array(z.object({
            file_path: z.string(),
            purpose: z.string(),
            depends_on_contracts: z.array(z.string())
        })),
        acceptance_criteria: z.array(z.string()).min(3, 'At least 3 acceptance criteria required')
    }).strict(),
    dood_checklist: z.object({
        will_use_contract_imports_only: z.boolean(),
        will_use_exact_props_pattern: z.boolean(),
        will_write_tests_first: z.boolean(),
        will_ensure_initial_test_failures: z.boolean(),
        will_validate_with_strict_typescript: z.boolean(),
        will_follow_tdd_red_green_refactor: z.boolean(),
        acknowledges_implementation_blocking: z.boolean()
    }).strict(),
    self_critique: z.object({
        potential_issues_identified: z.array(z.string()),
        how_will_prevent_prop_drift: z.string(),
        how_will_ensure_type_safety: z.string(),
        how_will_handle_edge_cases: z.string(),
        fallback_plan_if_tests_fail: z.string()
    }).strict(),
    commitment: z.object({
        agrees_to_contract_first: z.literal(true),
        agrees_to_tdd_enforcement: z.literal(true),
        agrees_to_implementation_blocking: z.literal(true),
        agrees_to_dood_compliance: z.literal(true),
        claude_signature: z.string().min(10, 'Claude must provide a commitment signature')
    }).strict()
}).strict();
export class ClaudeContractHandshakeSystem {
    enforcer;
    handshakesDir = './handshakes';
    constructor() {
        this.enforcer = new ContractFirstEnforcer();
        this.ensureDirectoriesExist();
    }
    ensureDirectoriesExist() {
        if (!fs.existsSync(this.handshakesDir)) {
            fs.mkdirSync(this.handshakesDir, { recursive: true });
        }
    }
    /**
     * Step 1: Claude must provide a complete handshake before any coding
     */
    async validateClaudeHandshake(handshake) {
        const errors = [];
        const warnings = [];
        const nextSteps = [];
        try {
            // Validate handshake structure
            const validatedHandshake = ClaudeHandshakeSchema.parse(handshake);
            // Validate commitment requirements
            if (!validatedHandshake.commitment.agrees_to_contract_first) {
                errors.push('Claude must agree to contract-first development');
            }
            if (!validatedHandshake.commitment.agrees_to_tdd_enforcement) {
                errors.push('Claude must agree to TDD enforcement');
            }
            if (!validatedHandshake.commitment.agrees_to_implementation_blocking) {
                errors.push('Claude must agree to implementation blocking when requirements not met');
            }
            // Validate DOOD checklist
            const doodItems = Object.entries(validatedHandshake.dood_checklist);
            const uncheckedItems = doodItems.filter(([_, checked]) => !checked);
            if (uncheckedItems.length > 0) {
                errors.push(`DOOD checklist incomplete. Missing: ${uncheckedItems.map(([key]) => key).join(', ')}`);
            }
            // Validate plan completeness
            if (validatedHandshake.plan.contracts_to_create.length === 0) {
                errors.push('At least one contract must be planned');
            }
            if (validatedHandshake.plan.tests_to_create.length === 0) {
                errors.push('At least one test must be planned');
            }
            // Check for common anti-patterns in the plan
            const contractPaths = validatedHandshake.plan.contracts_to_create.map(c => c.contract_path);
            const nonContractImports = validatedHandshake.plan.implementation_files.some(file => file.depends_on_contracts.some(dep => !contractPaths.includes(dep)));
            if (nonContractImports) {
                warnings.push('Some implementation files depend on non-contract imports - ensure all types come from @/contracts');
            }
            // Validate smart code family
            if (!validatedHandshake.understanding.smart_code_family.match(/^HERA\.[A-Z]+\.[A-Z]+/)) {
                errors.push('Smart code family must be properly specified (e.g., HERA.CRM.GRANTS)');
            }
            // Create handshake ID and save
            const handshakeId = `handshake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const handshakePath = path.join(this.handshakesDir, `${handshakeId}.json`);
            const handshakeRecord = {
                ...validatedHandshake,
                handshakeId,
                createdAt: new Date().toISOString(),
                status: errors.length > 0 ? 'rejected' : 'approved',
                validation: {
                    errors,
                    warnings,
                    nextSteps
                }
            };
            fs.writeFileSync(handshakePath, JSON.stringify(handshakeRecord, null, 2));
            // Define next steps based on validation
            if (errors.length === 0) {
                nextSteps.push('1. Create contracts using enforcer.createMissingContracts()');
                nextSteps.push('2. Create failing tests using enforcer.createFailingTests()');
                nextSteps.push('3. Validate implementation readiness');
                nextSteps.push('4. Implement only after all validations pass');
            }
            else {
                nextSteps.push('Fix validation errors before proceeding');
                nextSteps.push('Re-submit handshake after corrections');
            }
            return {
                success: errors.length === 0,
                errors,
                warnings,
                handshakeId,
                nextSteps
            };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
                    warnings: [],
                    handshakeId: '',
                    nextSteps: ['Fix handshake structure and re-submit']
                };
            }
            return {
                success: false,
                errors: [`Unexpected error: ${error instanceof Error ? error.message : String(error)}`],
                warnings: [],
                handshakeId: '',
                nextSteps: ['Check handshake format and try again']
            };
        }
    }
    /**
     * Step 2: Convert approved handshake to contract-first plan
     */
    async createContractFirstPlanFromHandshake(handshakeId) {
        const handshake = this.loadHandshake(handshakeId);
        if (!handshake) {
            return { success: false, errors: ['Handshake not found'], planId: '' };
        }
        if (handshake.status !== 'approved') {
            return { success: false, errors: ['Handshake not approved'], planId: '' };
        }
        // Convert handshake to contract-first plan format
        const plan = {
            feature_name: handshake.understanding.feature_description,
            smart_code: `${handshake.understanding.smart_code_family}.FEATURE.v1`,
            description: handshake.understanding.feature_description,
            contracts_required: handshake.plan.contracts_to_create.map(contract => ({
                contract_path: contract.contract_path,
                contract_name: contract.contract_name,
                purpose: contract.purpose,
                exists: false,
                needs_update: false
            })),
            tests_required: handshake.plan.tests_to_create.map(test => ({
                test_path: test.test_path,
                test_name: test.test_name,
                test_type: test.test_type,
                should_fail_initially: true,
                exists: false
            })),
            implementation_files: handshake.plan.implementation_files,
            acceptance_criteria: handshake.plan.acceptance_criteria,
            dood_compliance: {
                contracts_defined: true,
                tests_failing_appropriately: true,
                type_safety_verified: handshake.dood_checklist.will_validate_with_strict_typescript,
                no_implementation_without_tests: handshake.dood_checklist.will_write_tests_first
            }
        };
        return await this.enforcer.createContractFirstPlan(plan);
    }
    /**
     * Step 3: Execute the complete contract-first workflow
     */
    async executeContractFirstWorkflow(handshakeId) {
        const errors = [];
        const nextActions = [];
        try {
            // Step 1: Create plan from handshake
            const planResult = await this.createContractFirstPlanFromHandshake(handshakeId);
            if (!planResult.success) {
                return {
                    success: false,
                    errors: planResult.errors,
                    status: 'plan_creation_failed',
                    nextActions: ['Fix handshake issues and retry']
                };
            }
            // Step 2: Create missing contracts
            const contractResult = await this.enforcer.createMissingContracts(planResult.planId);
            if (!contractResult.success) {
                errors.push(...contractResult.errors);
            }
            // Step 3: Create failing tests
            const testResult = await this.enforcer.createFailingTests(planResult.planId);
            if (!testResult.success) {
                errors.push(...testResult.errors);
            }
            // Step 4: Validate implementation readiness
            const validationResult = await this.enforcer.validateImplementationReadiness(planResult.planId);
            if (validationResult.canImplement) {
                nextActions.push('✅ Implementation can proceed');
                nextActions.push('✅ All contracts created');
                nextActions.push('✅ All tests created and failing appropriately');
                nextActions.push('✅ TypeScript and ESLint validation passed');
                nextActions.push('');
                nextActions.push('Next: Implement the feature following TDD red-green-refactor cycle');
                return {
                    success: true,
                    errors,
                    status: 'ready_for_implementation',
                    nextActions
                };
            }
            else {
                errors.push(...validationResult.errors);
                nextActions.push(...validationResult.requirements);
                return {
                    success: false,
                    errors,
                    status: 'implementation_blocked',
                    nextActions
                };
            }
        }
        catch (error) {
            return {
                success: false,
                errors: [`Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`],
                status: 'workflow_error',
                nextActions: ['Check logs and retry workflow']
            };
        }
    }
    /**
     * Utility: Create a template handshake for Claude to fill out
     */
    createHandshakeTemplate(userRequest) {
        return {
            claude_version: 'claude-3-5-sonnet-20241022',
            timestamp: new Date().toISOString(),
            user_request: userRequest,
            understanding: {
                feature_description: '[CLAUDE: Describe the feature comprehensively]',
                business_impact: '[CLAUDE: Explain the business value and impact]',
                smart_code_family: 'HERA.[DOMAIN].[MODULE]',
                complexity_assessment: 'medium',
                estimated_effort: '[CLAUDE: Estimate development time and complexity]'
            },
            plan: {
                contracts_to_create: [
                    {
                        contract_name: '[CLAUDE: Contract name in PascalCase]',
                        contract_path: './src/contracts/[domain]/[contract-name].ts',
                        purpose: '[CLAUDE: What this contract defines]',
                        zod_schema_preview: '[CLAUDE: Brief preview of main Zod schema]'
                    }
                ],
                tests_to_create: [
                    {
                        test_name: '[CLAUDE: Descriptive test name]',
                        test_path: './tests/type-safety/[feature-name].test.ts',
                        test_type: 'type-safety',
                        initial_failure_reason: '[CLAUDE: Why this test should fail initially]'
                    }
                ],
                implementation_files: [
                    {
                        file_path: '[CLAUDE: Path to implementation file]',
                        purpose: '[CLAUDE: What this file does]',
                        depends_on_contracts: ['[CLAUDE: List contract dependencies]']
                    }
                ],
                acceptance_criteria: [
                    '[CLAUDE: Specific, testable acceptance criterion 1]',
                    '[CLAUDE: Specific, testable acceptance criterion 2]',
                    '[CLAUDE: Specific, testable acceptance criterion 3]'
                ]
            },
            dood_checklist: {
                will_use_contract_imports_only: true,
                will_use_exact_props_pattern: true,
                will_write_tests_first: true,
                will_ensure_initial_test_failures: true,
                will_validate_with_strict_typescript: true,
                will_follow_tdd_red_green_refactor: true,
                acknowledges_implementation_blocking: true
            },
            self_critique: {
                potential_issues_identified: [
                    '[CLAUDE: What could go wrong with this approach?]',
                    '[CLAUDE: What edge cases need consideration?]'
                ],
                how_will_prevent_prop_drift: '[CLAUDE: Specific strategy for preventing prop drift]',
                how_will_ensure_type_safety: '[CLAUDE: Specific strategy for type safety]',
                how_will_handle_edge_cases: '[CLAUDE: Specific strategy for edge cases]',
                fallback_plan_if_tests_fail: '[CLAUDE: What to do if tests fail unexpectedly]'
            },
            commitment: {
                agrees_to_contract_first: true,
                agrees_to_tdd_enforcement: true,
                agrees_to_implementation_blocking: true,
                agrees_to_dood_compliance: true,
                claude_signature: '[CLAUDE: I commit to following this contract-first development process and acknowledge that implementation will be blocked if requirements are not met. Signed: Claude]'
            }
        };
    }
    loadHandshake(handshakeId) {
        const handshakePath = path.join(this.handshakesDir, `${handshakeId}.json`);
        if (!fs.existsSync(handshakePath)) {
            return null;
        }
        return JSON.parse(fs.readFileSync(handshakePath, 'utf-8'));
    }
}
export default ClaudeContractHandshakeSystem;
