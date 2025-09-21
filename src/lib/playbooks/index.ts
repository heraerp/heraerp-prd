/**
 * HERA Playbooks - Sprint 1 Scaffolding
 *
 * Main entry point for the HERA Playbooks system providing
 * authentication, smart codes, and data access layer.
 */

// Authentication & Organization Context
export {
  type PlaybookUser,
  type PlaybookOrganization,
  type PlaybookAuthContext,
  type PlaybookAuthState,
  PlaybookAuthService,
  playbookAuthService,
  usePlaybookAuth
} from './auth/playbook-auth'

// Smart Code Management
export {
  type SmartCodeComponents,
  type SmartCodeValidationResult,
  type SmartCodeGenerationOptions,
  PLAYBOOK_SMART_CODE_PATTERNS,
  INDUSTRY_CODES,
  MODULE_CODES,
  PlaybookSmartCodeService,
  playbookSmartCodeService,
  PlaybookSmartCodes
} from './smart-codes/playbook-smart-codes'

// Data Access Layer
export {
  type PlaybookDefinition,
  type StepDefinition,
  type PlaybookRun,
  type StepExecution,
  type PlaybookContract,
  type PlaybookRelationship,
  type PlaybookQueryOptions,
  type PlaybookDataResult,
  PlaybookDataLayer,
  playbookDataLayer,
  usePlaybookDataLayer
} from './data/playbook-data-layer'

/**
 * HERA Playbooks System - Sprint 1 Features
 *
 * This sprint provides the foundational scaffolding for the HERA Playbooks system:
 *
 * 1. **Authentication & Organization Context**
 *    - Multi-tenant authentication service
 *    - Organization ID propagation to all operations
 *    - Permission-based access control
 *    - Session management with localStorage
 *    - Integration with HERA universal API
 *
 * 2. **Smart Code Generator & Validator**
 *    - Comprehensive smart code generation for all playbook components
 *    - Validation engine with detailed error reporting
 *    - Industry and module-specific code patterns
 *    - Version management and template system
 *    - HERA-compliant smart code structure
 *
 * 3. **Six-Table Data Access Layer**
 *    - Typed interfaces for all playbook data structures
 *    - Organization-aware CRUD operations
 *    - Smart code enforcement in all operations
 *    - Query builder with filtering and pagination
 *    - Automatic mapping between HERA tables and playbook types
 *
 * ## Quick Start
 *
 * ```typescript
 * import {
 *   usePlaybookAuth,
 *   PlaybookSmartCodes,
 *   usePlaybookDataLayer
 * } from '@/lib/playbooks';
 *
 * // In your component
 * function MyPlaybookComponent() {
 *   const auth = usePlaybookAuth();
 *   const dataLayer = usePlaybookDataLayer();
 *
 *   // Check authentication
 *   if (!auth.isAuthenticated) {
 *     return <LoginForm />;
 *   }
 *
 *   // Generate smart codes
 *   const playbookCode = PlaybookSmartCodes.forPlaybookDefinition(
 *     'PUBLICSECTOR',
 *     'GRANTS_INTAKE'
 *   );
 *
 *   // Create playbook
 *   const playbook = await dataLayer.createPlaybookDefinition({
 *     name: 'Grants Intake Process',
 *     smart_code: playbookCode,
 *     status: 'active',
 *     version: '1',
 *     ai_confidence: 0.95,
 *     ai_insights: 'Generated from template',
 *     metadata: {
 *       industry: 'PUBLICSECTOR',
 *       module: 'GRANTS',
 *       estimated_duration_hours: 6,
 *       worker_types: ['human', 'system', 'ai'],
 *       step_count: 5,
 *       input_schema_ref: 'input_contract',
 *       output_schema_ref: 'output_contract',
 *       created_by: auth.user?.id || 'system'
 *     }
 *   });
 *
 *   return <PlaybookDashboard playbook={playbook} />;
 * }
 * ```
 *
 * ## Architecture Benefits
 *
 * - **Zero Schema Changes**: Uses existing HERA 6-table architecture
 * - **Perfect Multi-Tenancy**: Organization isolation enforced at all levels
 * - **Smart Code Integration**: Every operation includes business intelligence
 * - **Type Safety**: Full TypeScript support with comprehensive interfaces
 * - **Authentication Ready**: Built-in permission checks and role validation
 * - **Universal Compatible**: Seamless integration with existing HERA systems
 *
 * ## Next Sprints
 *
 * - Sprint 2: Playbook Definition Builder & Step Management
 * - Sprint 3: Orchestration Engine & Worker Framework
 * - Sprint 4: Contract Validation & Policy Enforcement
 * - Sprint 5: Dashboard & Monitoring UI Components
 */

// Version and metadata
export const PLAYBOOKS_VERSION = '1.0.0-sprint1'
export const PLAYBOOKS_BUILD_DATE = new Date().toISOString()

/**
 * Initialize HERA Playbooks system
 */
export async function initializePlaybooks(options?: {
  organizationId?: string
  autoAuth?: boolean
}) {
  try {
    // Set organization context if provided
    if (options?.organizationId) {
      playbookDataLayer.setOrganizationContext(options.organizationId)
    }

    // Auto-initialize authentication if requested
    if (options?.autoAuth) {
      await playbookAuthService.refreshAuth()
    }

    return {
      success: true,
      version: PLAYBOOKS_VERSION,
      buildDate: PLAYBOOKS_BUILD_DATE,
      organizationId:
        options?.organizationId || (playbookAuthService?.getOrganizationId?.() ?? null),
      authenticated: playbookAuthService?.getState?.()?.isAuthenticated ?? false
    }
  } catch (error) {
    console.error('Failed to initialize HERA Playbooks:', error)
    return {
      success: false,
      error: error.message || 'Unknown initialization error'
    }
  }
}

/**
 * Get system health status
 */
export function getPlaybooksHealth() {
  const authState = playbookAuthService?.getState?.() ?? {
    isAuthenticated: false,
    organization: null,
    user: null
  }

  return {
    version: PLAYBOOKS_VERSION,
    buildDate: PLAYBOOKS_BUILD_DATE,
    authentication: {
      enabled: true,
      authenticated: authState.isAuthenticated,
      organizationId: authState.organization?.id,
      user: authState.user?.id
    },
    smartCodes: {
      enabled: true,
      templates: Object.keys(playbookSmartCodeService?.getSmartCodeTemplates?.() ?? {}).length,
      validator: 'active'
    },
    dataLayer: {
      enabled: true,
      organizationContext: playbookDataLayer?.getOrganizationId?.() !== null,
      universalApiConnected: true
    },
    overall:
      authState.isAuthenticated && playbookDataLayer?.getOrganizationId?.()
        ? 'healthy'
        : 'requires_setup'
  }
}
