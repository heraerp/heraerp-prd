/**
 * HERA Universal Onboarding - Step Registry
 * 
 * Central registry for all onboarding tours and steps
 * Maps Smart Codes to tour configurations
 */

import type { HeraTour, SmartCode, HeraStep } from './types';

/**
 * In-memory tour registry
 * In production, this could be backed by database
 */
class TourRegistry {
  private tours: Map<SmartCode, HeraTour> = new Map();
  
  /**
   * Register a new tour
   */
  registerTour(tour: HeraTour): void {
    if (!tour.tourSmartCode || !tour.steps.length) {
      throw new Error('Invalid tour: must have Smart Code and at least one step');
    }
    
    // Validate Smart Code format
    if (!this.isValidSmartCode(tour.tourSmartCode)) {
      throw new Error(`Invalid Smart Code format: ${tour.tourSmartCode}`);
    }
    
    // Sort steps by stepIndex if provided
    const sortedSteps = [...tour.steps].sort((a, b) => {
      if (a.stepIndex !== undefined && b.stepIndex !== undefined) {
        return a.stepIndex - b.stepIndex;
      }
      return 0;
    });
    
    this.tours.set(tour.tourSmartCode, {
      ...tour,
      steps: sortedSteps,
    });
  }
  
  /**
   * Get tour by Smart Code
   */
  getTourByCode(code: SmartCode): HeraTour | undefined {
    return this.tours.get(code);
  }
  
  /**
   * Get all registered tours
   */
  getAllTours(): HeraTour[] {
    return Array.from(this.tours.values());
  }
  
  /**
   * Get enabled tours based on feature flags
   */
  getEnabledTours(enabledCodes: SmartCode[]): HeraTour[] {
    return enabledCodes
      .map(code => this.tours.get(code))
      .filter((tour): tour is HeraTour => tour !== undefined);
  }
  
  /**
   * Remove a tour from registry
   */
  unregisterTour(code: SmartCode): boolean {
    return this.tours.delete(code);
  }
  
  /**
   * Clear all tours
   */
  clear(): void {
    this.tours.clear();
  }
  
  /**
   * Validate Smart Code format
   */
  private isValidSmartCode(code: string): code is SmartCode {
    return /^HERA\.UI\.ONBOARD\.[A-Z0-9_.]+\.v\d+$/.test(code);
  }
}

// Global registry instance
export const tourRegistry = new TourRegistry();

// Convenience exports
export const registerTour = tourRegistry.registerTour.bind(tourRegistry);
export const getTourByCode = tourRegistry.getTourByCode.bind(tourRegistry);
export const getAllTours = tourRegistry.getAllTours.bind(tourRegistry);
export const getEnabledTours = tourRegistry.getEnabledTours.bind(tourRegistry);

/**
 * Example Dashboard Tour
 * Demonstrates the standard HERA console experience
 */
const dashboardTour: HeraTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.CONSOLE.DASHBOARD.v1',
  autoStart: false,
  allowSkip: true,
  skipSmartCode: 'HERA.UI.ONBOARD.CONSOLE.DASHBOARD.SKIP.v1',
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.CONSOLE.DASHBOARD.WELCOME.v1',
      selector: '[data-testid="page-title"]',
      titleKey: 'ui.onboard.console.dashboard.welcome.title',
      bodyKey: 'ui.onboard.console.dashboard.welcome.body',
      placement: 'bottom',
      spotlightPadding: 8,
      waitFor: '[data-testid="page-title"]',
      timeoutMs: 6000,
      stepIndex: 0,
    },
    {
      smartCode: 'HERA.UI.ONBOARD.CONSOLE.DASHBOARD.FILTERS.v1',
      selector: '[data-testid="filters-panel"]',
      titleKey: 'ui.onboard.console.dashboard.filters.title',
      bodyKey: 'ui.onboard.console.dashboard.filters.body',
      placement: 'right',
      spotlightPadding: 12,
      waitFor: () => !!document.querySelector('[data-testid="filters-panel"]'),
      timeoutMs: 5000,
      stepIndex: 1,
    },
    {
      smartCode: 'HERA.UI.ONBOARD.CONSOLE.DASHBOARD.KPIS.v1',
      selector: '[data-testid="kpi-cards"]',
      titleKey: 'ui.onboard.console.dashboard.kpis.title',
      bodyKey: 'ui.onboard.console.dashboard.kpis.body',
      placement: 'top',
      spotlightPadding: 16,
      stepIndex: 2,
    },
    {
      smartCode: 'HERA.UI.ONBOARD.CONSOLE.DASHBOARD.CREATE.v1',
      selector: '[data-testid="create-entity-button"]',
      titleKey: 'ui.onboard.console.dashboard.create.title',
      bodyKey: 'ui.onboard.console.dashboard.create.body',
      placement: 'left',
      spotlightPadding: 8,
      stepIndex: 3,
    },
  ],
};

/**
 * CRM Module Tour
 * Customer relationship management features
 */
const crmTour: HeraTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.CRM.OVERVIEW.v1',
  autoStart: false,
  allowSkip: true,
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.CRM.CUSTOMERS.LIST.v1',
      selector: '[data-testid="customers-table"]',
      titleKey: 'ui.onboard.crm.customers.title',
      bodyKey: 'ui.onboard.crm.customers.body',
      placement: 'top',
      route: '/crm/customers',
      waitFor: '[data-testid="customers-table"]',
      timeoutMs: 5000,
    },
    {
      smartCode: 'HERA.UI.ONBOARD.CRM.PIPELINE.VIEW.v1',
      selector: '[data-testid="sales-pipeline"]',
      titleKey: 'ui.onboard.crm.pipeline.title',
      bodyKey: 'ui.onboard.crm.pipeline.body',
      placement: 'top',
      route: '/crm/pipeline',
      waitFor: '[data-testid="sales-pipeline"]',
      timeoutMs: 5000,
    },
  ],
};

/**
 * Financial Module Tour
 * General ledger and transaction features
 */
const financialTour: HeraTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.FINANCIAL.OVERVIEW.v1',
  autoStart: false,
  allowSkip: true,
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.FINANCIAL.GL.ACCOUNTS.v1',
      selector: '[data-testid="gl-accounts-tree"]',
      titleKey: 'ui.onboard.financial.gl.title',
      bodyKey: 'ui.onboard.financial.gl.body',
      placement: 'right',
      route: '/financial/gl',
      waitFor: '[data-testid="gl-accounts-tree"]',
      timeoutMs: 5000,
    },
    {
      smartCode: 'HERA.UI.ONBOARD.FINANCIAL.TRANSACTIONS.LIST.v1',
      selector: '[data-testid="transactions-table"]',
      titleKey: 'ui.onboard.financial.transactions.title',
      bodyKey: 'ui.onboard.financial.transactions.body',
      placement: 'top',
      route: '/financial/transactions',
      waitFor: '[data-testid="transactions-table"]',
      timeoutMs: 5000,
    },
  ],
};

/**
 * Progressive Mode Tour
 * Special tour for 30-day trial users
 */
const progressiveTour: HeraTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.PROGRESSIVE.WELCOME.v1',
  autoStart: true, // Auto-start for first-time trial users
  allowSkip: true,
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.PROGRESSIVE.WELCOME.INTRO.v1',
      selector: '[data-testid="progressive-banner"]',
      titleKey: 'ui.onboard.progressive.welcome.title',
      bodyKey: 'ui.onboard.progressive.welcome.body',
      placement: 'bottom',
      disableBeacon: true,
      hideBackButton: true,
    },
    {
      smartCode: 'HERA.UI.ONBOARD.PROGRESSIVE.UPGRADE.CTA.v1',
      selector: '[data-testid="upgrade-button"]',
      titleKey: 'ui.onboard.progressive.upgrade.title',
      bodyKey: 'ui.onboard.progressive.upgrade.body',
      placement: 'bottom',
      spotlightPadding: 12,
    },
  ],
};

// Register example tours
registerTour(dashboardTour);
registerTour(crmTour);
registerTour(financialTour);
registerTour(progressiveTour);

/**
 * Helper to create context-specific mini-tours
 * Useful for feature discovery
 */
export function createMiniTour(
  baseCode: string,
  steps: Array<Omit<HeraStep, 'smartCode'>>
): HeraTour {
  const tourSmartCode = `HERA.UI.ONBOARD.${baseCode}.v1` as SmartCode;
  
  const fullSteps: HeraStep[] = steps.map((step, index) => ({
    ...step,
    smartCode: `HERA.UI.ONBOARD.${baseCode}.STEP${index + 1}.v1` as SmartCode,
    stepIndex: index,
  }));
  
  return {
    tourSmartCode,
    steps: fullSteps,
    autoStart: false,
    allowSkip: true,
  };
}

/**
 * Get tour statistics for analytics
 */
export function getTourStats(): {
  totalTours: number;
  totalSteps: number;
  toursByModule: Record<string, number>;
} {
  const tours = getAllTours();
  const totalSteps = tours.reduce((sum, tour) => sum + tour.steps.length, 0);
  
  // Group tours by module (extract from Smart Code)
  const toursByModule = tours.reduce((acc, tour) => {
    const match = tour.tourSmartCode.match(/HERA\.UI\.ONBOARD\.([^.]+)\./);
    const module = match?.[1] || 'OTHER';
    acc[module] = (acc[module] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalTours: tours.length,
    totalSteps,
    toursByModule,
  };
}