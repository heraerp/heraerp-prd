/**
 * HERA Universal Onboarding System
 * 
 * Smart Code-driven onboarding tours with universal transaction tracking
 * Built on React-Joyride with HERA-specific abstractions
 */

// Core components and hooks
export { HeraOnboardingProvider, useOnboarding } from './HeraOnboardingProvider';

// Types
export type {
  SmartCode,
  StepPlacement,
  OnboardingStatus,
  HeraStep,
  HeraTour,
  OnboardingTransaction,
  OnboardingTransactionLine,
  OnboardingTheme,
  HeraOnboardingConfig,
  UseOnboardingReturn,
  StartTourOptions,
  OnboardingState,
  EmitContext,
} from './types';

// Step registry
export {
  tourRegistry,
  registerTour,
  getTourByCode,
  getAllTours,
  getEnabledTours,
  createMiniTour,
  getTourStats,
} from './stepRegistry';

// i18n
export {
  defaultMessages,
  getMessage,
  validateMessageKeys,
  extractTourMessageKeys,
  detectLanguage,
  I18nManager,
} from './i18n';

// Themes
export {
  lightTheme,
  darkTheme,
  highContrastTheme,
  getTheme,
  getJoyrideStyles,
  getA11yStyles,
  getReducedMotionStyles,
  getProgressStyles,
} from './themes';

// Guards
export {
  awaitSelector,
  awaitCondition,
  isElementVisible,
  ensureRoute,
  isStepReady,
  awaitMultipleSelectors,
  isSSR,
  prefersReducedMotion,
  createResizeObserver,
} from './guards';

// Events
export {
  emitTourStart,
  emitStepShown,
  emitStepCompleted,
  emitTourCompleted,
  emitTourDismissed,
  emitStepError,
  OnboardingEventEmitter,
} from './events';

// Transformers
export {
  toJoyrideSteps,
  tourToJoyrideProps,
  extractRouteMap,
  extractWaitMap,
  buildStepMetadata,
  validateTour,
  mergeTourOverrides,
  filterSteps,
  createErrorStep,
} from './transformers';