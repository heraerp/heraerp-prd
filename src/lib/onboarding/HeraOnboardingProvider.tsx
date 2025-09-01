'use client';

/**
 * HERA Universal Onboarding Provider
 * 
 * Wraps ReactJoyride and provides HERA-specific onboarding functionality
 * Manages tours, themes, i18n, and analytics events
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import type { Step as JoyrideStep } from 'react-joyride';
import type {
  HeraOnboardingConfig,
  OnboardingState,
  SmartCode,
  HeraTour,
  StartTourOptions,
  UseOnboardingReturn,
} from './types';
import { getTourByCode, getEnabledTours } from './stepRegistry';
import { toJoyrideSteps, tourToJoyrideProps, extractRouteMap, extractWaitMap, validateTour, mergeTourOverrides } from './transformers';
import { getTheme, getJoyrideStyles, getA11yStyles, getReducedMotionStyles } from './themes';
import { defaultMessages } from './i18n';
import { isStepReady, isSSR, prefersReducedMotion } from './guards';
import { OnboardingEventEmitter } from './events';

// Context for provider state
const OnboardingContext = createContext<UseOnboardingReturn | null>(null);

/**
 * HERA Onboarding Provider Component
 */
export function HeraOnboardingProvider({
  children,
  organizationId,
  enabledTours = [],
  messages = {},
  theme = 'light',
  onEmit,
  router,
  debug = false,
  globalTimeout = 5000,
  keyboardNavigation = true,
  respectReducedMotion = true,
}: HeraOnboardingConfig & { children: React.ReactNode }) {
  // State
  const [state, setState] = useState<OnboardingState>({
    activeTour: null,
    currentStep: 0,
    totalSteps: 0,
    isRunning: false,
    isLoading: false,
    error: null,
    startedAt: null,
    stepDurations: {},
  });
  
  // Refs
  const eventEmitterRef = useRef<OnboardingEventEmitter | null>(null);
  const joyrideRef = useRef<any>(null);
  const stepStartTimeRef = useRef<number>(Date.now());
  
  // Current tour data
  const [currentTour, setCurrentTour] = useState<HeraTour | null>(null);
  const [joyrideSteps, setJoyrideSteps] = useState<JoyrideStep[]>([]);
  
  // Get theme and styles
  const selectedTheme = getTheme(theme);
  let joyrideStyles = getJoyrideStyles(selectedTheme);
  
  // Apply accessibility styles
  if (keyboardNavigation) {
    joyrideStyles = getA11yStyles(joyrideStyles);
  }
  
  // Apply reduced motion if preferred
  if (respectReducedMotion && prefersReducedMotion()) {
    joyrideStyles = getReducedMotionStyles(joyrideStyles);
  }
  
  // Merge messages
  const allMessages = { ...defaultMessages, ...messages };
  
  // Start tour implementation
  const startTour = useCallback(async (code: SmartCode, options?: StartTourOptions) => {
    if (debug) console.log('[HERA Onboarding] Starting tour:', code, options);
    
    // Check if tour is enabled
    if (!enabledTours.includes(code)) {
      console.warn(`[HERA Onboarding] Tour ${code} is not enabled`);
      return;
    }
    
    // Get tour definition
    let tour = getTourByCode(code);
    if (!tour) {
      console.error(`[HERA Onboarding] Tour ${code} not found`);
      setState(prev => ({ ...prev, error: `Tour ${code} not found` }));
      return;
    }
    
    // Apply overrides if provided
    if (options?.overrides) {
      tour = mergeTourOverrides(tour, options.overrides);
    }
    
    // Validate tour
    try {
      validateTour(tour);
    } catch (error) {
      console.error('[HERA Onboarding] Invalid tour:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Invalid tour' }));
      return;
    }
    
    // Set loading state
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Extract route and wait maps
    const routeMap = extractRouteMap(tour.steps);
    const waitMap = extractWaitMap(tour.steps);
    
    // Check if first step is ready
    const firstStep = tour.steps[options?.startAt || 0];
    const isReady = await isStepReady(firstStep.selector, {
      route: routeMap.get(0),
      waitFor: waitMap.get(0),
      timeoutMs: firstStep.timeoutMs || globalTimeout,
      router,
    });
    
    if (!isReady) {
      console.error('[HERA Onboarding] First step not ready');
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'First step target not found' 
      }));
      return;
    }
    
    // Transform steps
    const transformedSteps = toJoyrideSteps(tour.steps, allMessages, selectedTheme);
    
    // Create event emitter
    eventEmitterRef.current = new OnboardingEventEmitter(organizationId, tour.tourSmartCode, onEmit);
    eventEmitterRef.current.tourStart({ auto: options?.auto });
    
    // Update state
    setCurrentTour(tour);
    setJoyrideSteps(transformedSteps);
    setState({
      activeTour: tour.tourSmartCode,
      currentStep: options?.startAt || 0,
      totalSteps: tour.steps.length,
      isRunning: true,
      isLoading: false,
      error: null,
      startedAt: new Date().toISOString(),
      stepDurations: {},
    });
    
    stepStartTimeRef.current = Date.now();
  }, [enabledTours, organizationId, onEmit, router, globalTimeout, allMessages, selectedTheme, debug]);
  
  // Stop tour implementation
  const stopTour = useCallback(() => {
    if (debug) console.log('[HERA Onboarding] Stopping tour');
    
    if (eventEmitterRef.current && state.activeTour) {
      eventEmitterRef.current.tourDismissed(
        'dismissed',
        state.currentStep,
        state.totalSteps,
        { manual: true }
      );
    }
    
    // Reset state
    setState({
      activeTour: null,
      currentStep: 0,
      totalSteps: 0,
      isRunning: false,
      isLoading: false,
      error: null,
      startedAt: null,
      stepDurations: {},
    });
    
    setCurrentTour(null);
    setJoyrideSteps([]);
    eventEmitterRef.current = null;
  }, [state, debug]);
  
  // Navigation methods
  const next = useCallback(() => {
    if (joyrideRef.current) {
      joyrideRef.current.next();
    }
  }, []);
  
  const back = useCallback(() => {
    if (joyrideRef.current) {
      joyrideRef.current.prev();
    }
  }, []);
  
  // Get state method
  const getState = useCallback(() => state, [state]);
  
  // Joyride callback handler
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    if (debug) console.log('[HERA Onboarding] Joyride event:', data);
    
    const { status, action, index, type } = data;
    const tour = currentTour;
    
    if (!tour || !eventEmitterRef.current) return;
    
    // Update current step
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      setState(prev => ({ ...prev, currentStep: index + 1 }));
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
      setState(prev => ({ ...prev, currentStep: index - 1 }));
    }
    
    // Handle step events
    if (type === EVENTS.STEP_AFTER) {
      const prevStep = tour.steps[index];
      if (prevStep) {
        const duration = Date.now() - stepStartTimeRef.current;
        eventEmitterRef.current.stepCompleted(
          prevStep.smartCode,
          index,
          { action }
        );
        setState(prev => ({
          ...prev,
          stepDurations: {
            ...prev.stepDurations,
            [prevStep.smartCode]: duration,
          },
        }));
      }
    }
    
    if (type === EVENTS.STEP_BEFORE) {
      stepStartTimeRef.current = Date.now();
      const currentStep = tour.steps[index];
      if (currentStep) {
        eventEmitterRef.current.stepShown(
          currentStep.smartCode,
          index,
          { action }
        );
      }
    }
    
    // Handle tour completion
    if (status === STATUS.FINISHED) {
      eventEmitterRef.current.tourCompleted(
        tour.steps.length,
        index + 1,
        { status: 'finished' }
      );
      stopTour();
    } else if (status === STATUS.SKIPPED) {
      eventEmitterRef.current.tourDismissed(
        'skipped',
        index,
        tour.steps.length,
        { action }
      );
      stopTour();
    }
  }, [currentTour, debug, stopTour]);
  
  // Auto-start tour on mount if configured
  useEffect(() => {
    if (!isSSR() && currentTour?.autoStart && !state.isRunning) {
      startTour(currentTour.tourSmartCode, { auto: true });
    }
  }, [currentTour, state.isRunning, startTour]);
  
  // Context value
  const contextValue: UseOnboardingReturn = {
    startTour,
    stopTour,
    next,
    back,
    getState,
    isActive: state.isRunning,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
  };
  
  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      {!isSSR() && state.isRunning && joyrideSteps.length > 0 && (
        <Joyride
          ref={joyrideRef}
          steps={joyrideSteps}
          run={state.isRunning}
          stepIndex={state.currentStep}
          continuous={true}
          showProgress={false}
          showSkipButton={currentTour?.allowSkip || true}
          scrollToFirstStep={true}
          scrollOffset={20}
          spotlightClicks={false}
          disableOverlay={false}
          disableOverlayClose={false}
          styles={joyrideStyles}
          floaterProps={{
            disableAnimation: respectReducedMotion && prefersReducedMotion(),
          }}
          callback={handleJoyrideCallback}
          debug={debug}
        />
      )}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to access onboarding functionality
 */
export function useOnboarding(): UseOnboardingReturn {
  const context = useContext(OnboardingContext);
  
  if (!context) {
    throw new Error('useOnboarding must be used within HeraOnboardingProvider');
  }
  
  return context;
}