/**
 * HERA Universal Onboarding System - Main Export
 * 
 * Central export point for all onboarding functionality
 */

// Provider and hooks
export { HeraOnboardingProvider, useOnboarding, useOnboardingConfig } from './HeraOnboardingProvider';

// Types
export type {
  SmartCode,
  HeraStep,
  HeraTour,
  OnboardingTransaction,
  OnboardingTransactionLine,
  OnboardingTheme,
  HeraOnboardingConfig,
  UseOnboardingReturn,
  StartTourOptions,
  OnboardingState,
  OnboardingStatus,
} from './types';

// Tour registry
export { 
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
  interpolate,
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
  heraColors,
  getJoyrideStyles,
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
  buildJoyrideStep,
  applyThemeToJoyride,
} from './transformers';