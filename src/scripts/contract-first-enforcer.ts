/**
 * HERA Contract-First Development Enforcer
 *
 * This system prevents Claude from implementing features without proper contracts and failing tests.
 * It enforces the "red-green-refactor" TDD cycle by requiring contracts and failing tests first.
 */

import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Contract-First Plan Schema
const ContractFirstPlanSchema = z
  .object({
    feature_name: z.string().min(1, 'Feature name is required'),
    smart_code: z
      .string()
      .regex(/^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/, 'Must be valid HERA smart code'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    contracts_required: z
      .array(
        z.object({
          contract_path: z.string(),
          contract_name: z.string(),
          purpose: z.string(),
          exists: z.boolean(),
          needs_update: z.boolean()
        })
      )
      .min(1, 'At least one contract is required'),
    tests_required: z
      .array(
        z.object({
          test_path: z.string(),
          test_name: z.string(),
          test_type: z.enum(['unit', 'integration', 'e2e', 'type-safety']),
          should_fail_initially: z.boolean(),
          exists: z.boolean(),
          currently_failing: z.boolean().optional()
        })
      )
      .min(1, 'At least one test is required'),
    implementation_files: z.array(
      z.object({
        file_path: z.string(),
        purpose: z.string(),
        depends_on_contracts: z.array(z.string())
      })
    ),
    acceptance_criteria: z.array(z.string()).min(1, 'At least one acceptance criterion required'),
    dood_compliance: z.object({
      contracts_defined: z.boolean(),
      tests_failing_appropriately: z.boolean(),
      type_safety_verified: z.boolean(),
      no_implementation_without_tests: z.boolean()
    })
  })
  .strict()

type ContractFirstPlan = z.infer<typeof ContractFirstPlanSchema>

export class ContractFirstEnforcer {
  private readonly contractsDir = './src/contracts'
  private readonly testsDir = './tests'
  private readonly plansDir = './plans'

  constructor() {
    // Ensure directories exist
    this.ensureDirectoriesExist()
  }

  private ensureDirectoriesExist(): void {
    ;[this.contractsDir, this.testsDir, this.plansDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  /**
   * Step 1: Claude must create a detailed plan before any implementation
   */
  async createContractFirstPlan(
    plan: ContractFirstPlan
  ): Promise<{ success: boolean; errors: string[]; planId: string }> {
    const errors: string[] = []

    try {
      // Validate the plan structure
      const validatedPlan = ContractFirstPlanSchema.parse(plan)

      // Check if contracts exist and are up to date
      for (const contract of validatedPlan.contracts_required) {
        const contractExists = fs.existsSync(contract.contract_path)
        if (!contractExists && !contract.exists) {
          errors.push(
            `Contract ${contract.contract_name} does not exist at ${contract.contract_path}`
          )
        }
      }

      // Check if tests exist and would fail appropriately
      for (const test of validatedPlan.tests_required) {
        const testExists = fs.existsSync(test.test_path)
        if (!testExists && !test.exists) {
          errors.push(`Test ${test.test_name} does not exist at ${test.test_path}`)
        }

        if (test.should_fail_initially && testExists) {
          // Run the test to verify it fails
          try {
            await execAsync(`npm run test:type-safety ${test.test_path}`)
            errors.push(`Test ${test.test_name} should fail initially but is currently passing`)
          } catch {
            // Test failing is expected and good
          }
        }
      }

      // Verify DOOD compliance requirements
      if (!validatedPlan.dood_compliance.contracts_defined) {
        errors.push('DOOD violation: Contracts must be defined before implementation')
      }

      if (!validatedPlan.dood_compliance.tests_failing_appropriately) {
        errors.push('DOOD violation: Tests must fail appropriately before implementation')
      }

      // Save the plan
      const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const planPath = path.join(this.plansDir, `${planId}.json`)

      fs.writeFileSync(
        planPath,
        JSON.stringify(
          {
            ...validatedPlan,
            planId,
            createdAt: new Date().toISOString(),
            status: errors.length > 0 ? 'rejected' : 'approved'
          },
          null,
          2
        )
      )

      return {
        success: errors.length === 0,
        errors,
        planId
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          planId: ''
        }
      }

      return {
        success: false,
        errors: [`Unexpected error: ${error instanceof Error ? error.message : String(error)}`],
        planId: ''
      }
    }
  }

  /**
   * Step 2: Create missing contracts with Zod schemas
   */
  async createMissingContracts(planId: string): Promise<{ success: boolean; errors: string[] }> {
    const plan = this.loadPlan(planId)
    if (!plan) {
      return { success: false, errors: ['Plan not found'] }
    }

    const errors: string[] = []

    for (const contract of plan.contracts_required) {
      if (!contract.exists || contract.needs_update) {
        try {
          await this.generateContractFile(contract)
        } catch (error) {
          errors.push(
            `Failed to create contract ${contract.contract_name}: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }
    }

    return { success: errors.length === 0, errors }
  }

  /**
   * Step 3: Create failing tests that validate contracts
   */
  async createFailingTests(planId: string): Promise<{ success: boolean; errors: string[] }> {
    const plan = this.loadPlan(planId)
    if (!plan) {
      return { success: false, errors: ['Plan not found'] }
    }

    const errors: string[] = []

    for (const test of plan.tests_required) {
      if (!test.exists) {
        try {
          await this.generateTestFile(test, plan)
        } catch (error) {
          errors.push(
            `Failed to create test ${test.test_name}: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }
    }

    // Verify tests fail appropriately
    try {
      await execAsync('npm run test:type-safety')
      errors.push(
        'Tests should be failing but all tests are passing. This violates TDD principles.'
      )
    } catch {
      // Tests failing is expected and good for TDD
      console.log('✅ Tests are failing appropriately - ready for implementation')
    }

    return { success: errors.length === 0, errors }
  }

  /**
   * Step 4: Validate that implementation can proceed
   */
  async validateImplementationReadiness(planId: string): Promise<{
    canImplement: boolean
    errors: string[]
    requirements: string[]
  }> {
    const plan = this.loadPlan(planId)
    if (!plan) {
      return { canImplement: false, errors: ['Plan not found'], requirements: [] }
    }

    const errors: string[] = []
    const requirements: string[] = []

    // Check contracts exist
    for (const contract of plan.contracts_required) {
      if (!fs.existsSync(contract.contract_path)) {
        errors.push(`Missing contract: ${contract.contract_path}`)
        requirements.push(`Create contract ${contract.contract_name}`)
      }
    }

    // Check tests exist and fail appropriately
    for (const test of plan.tests_required) {
      if (!fs.existsSync(test.test_path)) {
        errors.push(`Missing test: ${test.test_path}`)
        requirements.push(`Create test ${test.test_name}`)
      }
    }

    // Verify TypeScript compilation
    try {
      await execAsync('npm run typecheck:strict')
    } catch (error) {
      errors.push('TypeScript compilation fails - fix type errors before implementation')
      requirements.push('Fix TypeScript compilation errors')
    }

    // Verify ESLint passes
    try {
      await execAsync('npm run lint')
    } catch (error) {
      errors.push('ESLint validation fails - fix linting errors before implementation')
      requirements.push('Fix ESLint errors')
    }

    return {
      canImplement: errors.length === 0,
      errors,
      requirements
    }
  }

  /**
   * Step 5: Block implementation if requirements not met
   */
  async blockImplementationIfNotReady(
    planId: string
  ): Promise<{ blocked: boolean; reason: string }> {
    const validation = await this.validateImplementationReadiness(planId)

    if (!validation.canImplement) {
      return {
        blocked: true,
        reason: `Implementation blocked. Requirements not met:\n${validation.requirements.join('\n')}\n\nErrors:\n${validation.errors.join('\n')}`
      }
    }

    return { blocked: false, reason: '' }
  }

  private loadPlan(
    planId: string
  ): (ContractFirstPlan & { planId: string; createdAt: string; status: string }) | null {
    const planPath = path.join(this.plansDir, `${planId}.json`)
    if (!fs.existsSync(planPath)) {
      return null
    }

    return JSON.parse(fs.readFileSync(planPath, 'utf-8'))
  }

  private async generateContractFile(contract: {
    contract_path: string
    contract_name: string
    purpose: string
  }): Promise<void> {
    const contractTemplate = `/**
 * ${contract.contract_name} Contract
 * Purpose: ${contract.purpose}
 * Generated by HERA Contract-First Enforcer
 */

import { z } from 'zod';

// Base schema for ${contract.contract_name}
export const ${contract.contract_name}Schema = z.object({
  // TODO: Define the actual schema based on requirements
  id: z.string().uuid('Must be a valid UUID'),
  name: z.string().min(1, 'Name is required'),
  createdAt: z.date(),
  updatedAt: z.date()
}).strict();

export type ${contract.contract_name} = z.infer<typeof ${contract.contract_name}Schema>;

// Request/Response schemas
export const Create${contract.contract_name}RequestSchema = ${contract.contract_name}Schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).strict();

export const Update${contract.contract_name}RequestSchema = Create${contract.contract_name}RequestSchema.partial().strict();

export type Create${contract.contract_name}Request = z.infer<typeof Create${contract.contract_name}RequestSchema>;
export type Update${contract.contract_name}Request = z.infer<typeof Update${contract.contract_name}RequestSchema>;
`

    const dir = path.dirname(contract.contract_path)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(contract.contract_path, contractTemplate)
  }

  private async generateTestFile(
    test: {
      test_path: string
      test_name: string
      test_type: string
      should_fail_initially: boolean
    },
    plan: ContractFirstPlan
  ): Promise<void> {
    const testTemplate = `/**
 * ${test.test_name} - Contract-First Test
 * This test should initially FAIL and pass only after implementation
 */

import { describe, it, expect } from 'vitest';
// TODO: Import contracts from @/contracts when they are defined
// import { ${plan.contracts_required.map(c => c.contract_name + 'Schema').join(', ')} } from '@/contracts';

describe('${test.test_name}', () => {
  it('should fail initially - contract validation', () => {
    // This test MUST fail initially to enforce TDD
    expect(false).toBe(true); // Intentional failure
    
    // TODO: Replace with actual contract validation once contracts are defined
    // const result = SomeContractSchema.safeParse({});
    // expect(result.success).toBe(true);
  });

  it('should validate contract schemas are strict', () => {
    // This test MUST fail initially
    expect(() => {
      // TODO: Add actual schema validation
      throw new Error('Contract not implemented yet');
    }).not.toThrow();
  });

  it('should prevent prop drift with exact types', () => {
    // This test MUST fail initially
    expect(() => {
      // TODO: Add exact type validation
      throw new Error('Exact types not implemented yet');
    }).not.toThrow();
  });
});
`

    const dir = path.dirname(test.test_path)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(test.test_path, testTemplate)
  }
}

// CLI Interface for Contract-First Enforcer
export async function runContractFirstEnforcer(): Promise<void> {
  const enforcer = new ContractFirstEnforcer()

  console.log('🔒 HERA Contract-First Development Enforcer')
  console.log(
    'This tool ensures TDD compliance and prevents implementation without contracts and failing tests.'
  )
  console.log('')

  // Example usage
  console.log('Usage:')
  console.log('1. Create a plan: enforcer.createContractFirstPlan(plan)')
  console.log('2. Create contracts: enforcer.createMissingContracts(planId)')
  console.log('3. Create failing tests: enforcer.createFailingTests(planId)')
  console.log('4. Validate readiness: enforcer.validateImplementationReadiness(planId)')
  console.log('5. Implement only if validation passes')
}

// Export the main enforcer for use in other scripts
export default ContractFirstEnforcer
