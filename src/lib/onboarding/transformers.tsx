/**
 * HERA Universal Onboarding - Transformers
 * 
 * Converts HERA tour definitions to Joyride-compatible format
 * Handles i18n, theming, and step configuration
 */

import * as React from 'react';
import type { Step as JoyrideStep } from 'react-joyride';
import type { HeraStep, HeraTour, OnboardingTheme } from './types';
import { getMessage } from './i18n';
import { getProgressStyles } from './themes';

/**
 * Transform HERA steps to Joyride steps
 */
export function toJoyrideSteps(
  heraSteps: HeraStep[],
  messages: Record<string, string>,
  theme: OnboardingTheme,
  currentStep?: number
): JoyrideStep[] {
  const totalSteps = heraSteps.length;
  
  return heraSteps.map((step, index) => {
    const stepNumber = index + 1;
    const isLastStep = index === heraSteps.length - 1;
    
    // Build content with progress indicator
    const progressHtml = buildProgressIndicator(stepNumber, totalSteps, theme);
    const titleText = getMessage(step.titleKey, messages);
    const bodyText = getMessage(step.bodyKey, messages);
    
    const content = (
      <div className="hera-onboarding-content">
        {progressHtml}
        <h3 className="hera-onboarding-title">{titleText}</h3>
        <div className="hera-onboarding-body">{bodyText}</div>
      </div>
    );
    
    // Transform to Joyride step
    const joyrideStep: JoyrideStep = {
      target: step.selector,
      content,
      placement: step.placement || 'auto',
      disableBeacon: step.disableBeacon || false,
      disableCloseOnEsc: false,
      disableOverlay: false,
      disableOverlayClose: false,
      disableScrolling: false,
      hideBackButton: step.hideBackButton || false,
      hideCloseButton: step.hideCloseButton || false,
      hideFooter: false,
      locale: {
        back: getMessage('ui.onboard.controls.back', messages),
        close: getMessage('ui.onboard.controls.close', messages),
        last: getMessage('ui.onboard.controls.last', messages),
        next: getMessage('ui.onboard.controls.next', messages),
        open: getMessage('ui.onboard.controls.open', messages),
        skip: getMessage('ui.onboard.controls.skip', messages),
      },
      showProgress: false, // We handle progress ourselves
      showSkipButton: !isLastStep,
      spotlightPadding: step.spotlightPadding || 8,
      styles: {
        spotlight: {
          borderRadius: '8px',
        },
      },
      // Custom data for analytics
      data: {
        smartCode: step.smartCode,
        stepIndex: index,
        metadata: step.metadata,
      },
    };
    
    return joyrideStep;
  });
}

/**
 * Build progress indicator component
 */
function buildProgressIndicator(
  current: number,
  total: number,
  theme: OnboardingTheme
): React.ReactElement {
  const styles = getProgressStyles(theme, current, total);
  
  return (
    <div className="hera-onboarding-progress">
      <div style={styles.container}>
        <div style={styles.bar} />
      </div>
      <div className="hera-onboarding-progress-text">
        {getMessage('ui.onboard.progress.step', {}, { current, total })}
      </div>
    </div>
  );
}

/**
 * Transform tour options to Joyride props
 */
export function tourToJoyrideProps(tour: HeraTour) {
  return {
    continuous: true,
    showProgress: false, // We handle progress
    showSkipButton: tour.allowSkip || true,
    scrollToFirstStep: true,
    scrollOffset: 20,
    spotlightClicks: false,
    disableOverlay: false,
    disableOverlayClose: false,
  };
}

/**
 * Extract route requirements from steps
 * Returns map of step index to route
 */
export function extractRouteMap(steps: HeraStep[]): Map<number, string | ((router: any) => Promise<void>)> {
  const routeMap = new Map<number, string | ((router: any) => Promise<void>)>();
  
  steps.forEach((step, index) => {
    if (step.route) {
      routeMap.set(index, step.route);
    }
  });
  
  return routeMap;
}

/**
 * Extract wait conditions from steps
 * Returns map of step index to wait condition
 */
export function extractWaitMap(steps: HeraStep[]): Map<number, string | (() => boolean | Promise<boolean>)> {
  const waitMap = new Map<number, string | (() => boolean | Promise<boolean>)>();
  
  steps.forEach((step, index) => {
    if (step.waitFor) {
      waitMap.set(index, step.waitFor);
    }
  });
  
  return waitMap;
}

/**
 * Build step metadata for analytics
 */
export function buildStepMetadata(
  step: HeraStep,
  index: number,
  tour: HeraTour
): Record<string, unknown> {
  return {
    ...step.metadata,
    tourCode: tour.tourSmartCode,
    stepCode: step.smartCode,
    stepIndex: index,
    totalSteps: tour.steps.length,
    selector: step.selector,
    placement: step.placement,
    hasRoute: !!step.route,
    hasWaitCondition: !!step.waitFor,
    timeoutMs: step.timeoutMs,
  };
}

/**
 * Validate tour structure
 * Throws if invalid
 */
export function validateTour(tour: HeraTour): void {
  if (!tour.tourSmartCode) {
    throw new Error('Tour must have a Smart Code');
  }
  
  if (!tour.steps || tour.steps.length === 0) {
    throw new Error('Tour must have at least one step');
  }
  
  // Validate each step
  tour.steps.forEach((step, index) => {
    if (!step.smartCode) {
      throw new Error(`Step ${index} must have a Smart Code`);
    }
    
    if (!step.selector) {
      throw new Error(`Step ${index} must have a selector`);
    }
    
    if (!step.titleKey || !step.bodyKey) {
      throw new Error(`Step ${index} must have titleKey and bodyKey`);
    }
    
    // Validate Smart Code format
    if (!step.smartCode.startsWith('HERA.UI.ONBOARD.')) {
      throw new Error(`Step ${index} has invalid Smart Code format: ${step.smartCode}`);
    }
  });
}

/**
 * Merge tour overrides
 * Used when starting tour with custom options
 */
export function mergeTourOverrides(
  baseTour: HeraTour,
  overrides?: Partial<HeraTour>
): HeraTour {
  if (!overrides) {
    return baseTour;
  }
  
  return {
    ...baseTour,
    ...overrides,
    // Don't override tourSmartCode
    tourSmartCode: baseTour.tourSmartCode,
    // Merge steps array properly
    steps: overrides.steps || baseTour.steps,
  };
}

/**
 * Filter steps based on conditions
 * Useful for conditional tours
 */
export function filterSteps(
  steps: HeraStep[],
  predicate: (step: HeraStep, index: number) => boolean
): HeraStep[] {
  return steps
    .filter(predicate)
    .map((step, newIndex) => ({
      ...step,
      stepIndex: newIndex,
    }));
}

/**
 * Create error step for fallback
 */
export function createErrorStep(error: string, messages: Record<string, string>): JoyrideStep {
  return {
    target: 'body',
    content: (
      <div className="hera-onboarding-error">
        <h3>{getMessage('ui.onboard.error.title', messages)}</h3>
        <p>{error}</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    hideBackButton: true,
    hideFooter: false,
    locale: {
      close: getMessage('ui.onboard.controls.close', messages),
    },
  };
}