/**
 * HERA Universal Onboarding System - Type Definitions
 *
 * Smart Code-driven onboarding with universal transaction tracking
 * Follows HERA DNA principles - 6 tables, infinite complexity
 */

// Smart Code pattern for onboarding
export type SmartCode = `HERA.UI.ONBOARD.${string}`

// Placement options for tour steps
export type StepPlacement = 'top' | 'right' | 'bottom' | 'left' | 'auto' | 'center'

// Tour and step status for analytics
export type OnboardingStatus = 'started' | 'shown' | 'completed' | 'skipped' | 'dismissed' | 'error'

/**
 * Individual onboarding step configuration
 * Maps to Joyride step internally but uses HERA concepts
 */
export interface HeraStep {
  /** Smart Code identifying this step */
  smartCode: SmartCode

  /** CSS selector for target element */
  selector: string

  /** i18n key for step title */
  titleKey: string

  /** i18n key for step body content */
  bodyKey: string

  /** Preferred placement of tooltip */
  placement?: StepPlacement

  /** Padding around spotlight area */
  spotlightPadding?: number

  /** Route to navigate to before showing step */
  route?: string | ((router: any) => Promise<void>)

  /** Wait condition before showing step */
  waitFor?: string | (() => boolean | Promise<boolean>)

  /** Timeout for wait condition (default: 5000ms) */
  timeoutMs?: number

  /** Disable beacon (pulsing indicator) */
  disableBeacon?: boolean

  /** Hide close button on this step */
  hideCloseButton?: boolean

  /** Hide back button on this step */
  hideBackButton?: boolean

  /** Explicit step ordering (optional) */
  stepIndex?: number

  /** Additional metadata for analytics */
  metadata?: Record<string, unknown>
}

/**
 * Complete tour configuration
 * Groups steps under a Smart Code identifier
 */
export interface HeraTour {
  /** Smart Code for the entire tour */
  tourSmartCode: SmartCode

  /** Ordered list of steps in the tour */
  steps: HeraStep[]

  /** Auto-start tour when component mounts */
  autoStart?: boolean

  /** Allow users to skip the tour */
  allowSkip?: boolean

  /** Smart Code to emit when tour is skipped */
  skipSmartCode?: SmartCode
}

/**
 * Universal transaction format for onboarding events
 * Follows HERA's sacred 6-table architecture
 */
export interface OnboardingTransaction {
  /** Unique transaction ID */
  id: string

  /** Organization isolation (sacred boundary) */
  organization_id: string

  /** Smart Code for the event */
  smart_code: SmartCode

  /** ISO timestamp */
  occurred_at: string

  /** AI confidence placeholder */
  ai_confidence: number | null

  /** AI insights placeholder */
  ai_insights: string | null

  /** Event metadata */
  metadata: {
    tour_id?: string
    step_id?: string
    user_id?: string
    session_id?: string
    [key: string]: unknown
  }
}

/**
 * Universal transaction line for step details
 * Captures granular onboarding interactions
 */
export interface OnboardingTransactionLine {
  /** Unique line ID */
  id: string

  /** Parent transaction ID */
  transaction_id: string

  /** Line order */
  line_index: number

  /** Step Smart Code */
  smart_code: SmartCode

  /** Step status */
  status: OnboardingStatus

  /** Time spent on step (milliseconds) */
  duration_ms?: number

  /** Step metadata */
  metadata: {
    selector?: string
    route?: string
    error_message?: string
    [key: string]: unknown
  }
}

/**
 * Theme configuration for onboarding UI
 */
export interface OnboardingTheme {
  name: 'light' | 'dark' | 'highContrast'
  tokens: {
    bubbleBackground: string
    bubbleText: string
    beaconColor: string
    overlayColor: string
    spotlightBorder: string
    buttonBackground: string
    buttonText: string
    buttonHover: string
    skipLinkColor: string
    progressBarBackground: string
    progressBarFill: string
  }
}

/**
 * Provider configuration options
 */
export interface HeraOnboardingConfig {
  /** Organization ID for multi-tenant isolation */
  organizationId: string

  /** Enabled tour Smart Codes (feature flags) */
  enabledTours?: SmartCode[]

  /** i18n message overrides */
  messages?: Record<string, string>

  /** Theme selection */
  theme?: 'light' | 'dark' | 'highContrast'

  /** Analytics callback for transaction emission */
  onEmit?: (transaction: OnboardingTransaction, lines: OnboardingTransactionLine[]) => void

  /** Router instance for navigation */
  router?: any

  /** Debug mode for development */
  debug?: boolean

  /** Global timeout for all steps */
  globalTimeout?: number

  /** Keyboard shortcuts enabled */
  keyboardNavigation?: boolean

  /** Respect prefers-reduced-motion */
  respectReducedMotion?: boolean
}

/**
 * Hook return type for onboarding control
 */
export interface UseOnboardingReturn {
  /** Start a tour by Smart Code */
  startTour: (code: SmartCode, options?: StartTourOptions) => void

  /** Stop current tour */
  stopTour: () => void

  /** Navigate to next step */
  next: () => void

  /** Navigate to previous step */
  back: () => void

  /** Get current state */
  getState: () => OnboardingState

  /** Check if tour is active */
  isActive: boolean

  /** Current step index */
  currentStep: number

  /** Total steps in current tour */
  totalSteps: number
}

/**
 * Options for starting a tour
 */
export interface StartTourOptions {
  /** Auto-start without user interaction */
  auto?: boolean

  /** Start from specific step index */
  startAt?: number

  /** Override tour configuration */
  overrides?: Partial<HeraTour>
}

/**
 * Current onboarding state
 */
export interface OnboardingState {
  /** Active tour Smart Code */
  activeTour: SmartCode | null

  /** Current step index */
  currentStep: number

  /** Total steps */
  totalSteps: number

  /** Tour running status */
  isRunning: boolean

  /** Loading state */
  isLoading: boolean

  /** Error state */
  error: string | null

  /** Start timestamp */
  startedAt: string | null

  /** Step durations */
  stepDurations: Record<string, number>
}

/**
 * Event emission context
 */
export interface EmitContext {
  organizationId: string
  tourCode: SmartCode
  stepCode?: SmartCode
  status: OnboardingStatus
  metadata?: Record<string, unknown>
  startTime?: number
  endTime?: number
}

// Joyride types removed - using React 18 compatible implementation
