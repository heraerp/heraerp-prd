/**
 * HERA Ice Cream Manufacturing - Onboarding Tours
 *
 * Comprehensive guided tours for the ice cream manufacturing ERP
 */

import type { HeraTour } from '../types'

/**
 * Main dashboard tour for new users
 */
export const iceCreamDashboardTour: HeraTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.ICECREAM.DASHBOARD.V1',
  autoStart: false,
  allowSkip: true,
  skipSmartCode: 'HERA.UI.ONBOARD.ICECREAM.DASHBOARD.SKIP.V1',
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.DASHBOARD.WELCOME.V1',
      selector: '[data-testid="ice-cream-header"]',
      titleKey: 'ui.onboard.icecream.dashboard.welcome.title',
      bodyKey: 'ui.onboard.icecream.dashboard.welcome.body',
      placement: 'bottom',
      spotlightPadding: 12,
      waitFor: '[data-testid="ice-cream-header"]',
      timeoutMs: 5000
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.DASHBOARD.STATS.V1',
      selector: '[data-testid="dashboard-stats"]',
      titleKey: 'ui.onboard.icecream.dashboard.stats.title',
      bodyKey: 'ui.onboard.icecream.dashboard.stats.body',
      placement: 'bottom',
      spotlightPadding: 16,
      waitFor: '[data-testid="dashboard-stats"]',
      timeoutMs: 5000
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.DASHBOARD.PRODUCTION.V1',
      selector: '[data-testid="production-status"]',
      titleKey: 'ui.onboard.icecream.dashboard.production.title',
      bodyKey: 'ui.onboard.icecream.dashboard.production.body',
      placement: 'right',
      spotlightPadding: 12,
      waitFor: '[data-testid="production-status"]'
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.DASHBOARD.INVENTORY.V1',
      selector: '[data-testid="inventory-levels"]',
      titleKey: 'ui.onboard.icecream.dashboard.inventory.title',
      bodyKey: 'ui.onboard.icecream.dashboard.inventory.body',
      placement: 'left',
      spotlightPadding: 12,
      waitFor: '[data-testid="inventory-levels"]'
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.DASHBOARD.SIDEBAR.V1',
      selector: '[data-testid="hera-sidebar-nav"]',
      titleKey: 'ui.onboard.icecream.dashboard.sidebar.title',
      bodyKey: 'ui.onboard.icecream.dashboard.sidebar.body',
      placement: 'right',
      spotlightPadding: 8,
      waitFor: '[data-testid="hera-sidebar-nav"]'
    }
  ]
}

/**
 * Production module tour
 */
export const iceCreamProductionTour: HeraTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.ICECREAM.PRODUCTION.V1',
  autoStart: false,
  allowSkip: true,
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.PRODUCTION.OVERVIEW.V1',
      selector: '[data-testid="production-header"]',
      titleKey: 'ui.onboard.icecream.production.overview.title',
      bodyKey: 'ui.onboard.icecream.production.overview.body',
      placement: 'bottom',
      route: '/icecream/production',
      waitFor: '[data-testid="production-header"]',
      timeoutMs: 5000
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.PRODUCTION.BATCH.V1',
      selector: '[data-testid="create-batch-button"]',
      titleKey: 'ui.onboard.icecream.production.batch.title',
      bodyKey: 'ui.onboard.icecream.production.batch.body',
      placement: 'left',
      spotlightPadding: 8,
      waitFor: '[data-testid="create-batch-button"]'
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.PRODUCTION.STATUS.V1',
      selector: '[data-testid="active-batches"]',
      titleKey: 'ui.onboard.icecream.production.status.title',
      bodyKey: 'ui.onboard.icecream.production.status.body',
      placement: 'top',
      waitFor: '[data-testid="active-batches"]'
    }
  ]
}

/**
 * Inventory management tour
 */
export const iceCreamInventoryTour: HeraTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.ICECREAM.INVENTORY.V1',
  autoStart: false,
  allowSkip: true,
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.INVENTORY.OVERVIEW.V1',
      selector: '[data-testid="inventory-header"]',
      titleKey: 'ui.onboard.icecream.inventory.overview.title',
      bodyKey: 'ui.onboard.icecream.inventory.overview.body',
      placement: 'bottom',
      route: '/icecream/inventory',
      waitFor: '[data-testid="inventory-header"]',
      timeoutMs: 5000
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.INVENTORY.MATERIALS.V1',
      selector: '[data-testid="raw-materials-section"]',
      titleKey: 'ui.onboard.icecream.inventory.materials.title',
      bodyKey: 'ui.onboard.icecream.inventory.materials.body',
      placement: 'top',
      waitFor: '[data-testid="raw-materials-section"]'
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.INVENTORY.PRODUCTS.V1',
      selector: '[data-testid="finished-products-section"]',
      titleKey: 'ui.onboard.icecream.inventory.products.title',
      bodyKey: 'ui.onboard.icecream.inventory.products.body',
      placement: 'top',
      waitFor: '[data-testid="finished-products-section"]'
    }
  ]
}

/**
 * POS terminal tour
 */
export const iceCreamPOSTour: HeraTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.ICECREAM.POS.V1',
  autoStart: false,
  allowSkip: true,
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.POS.INTRO.V1',
      selector: '[data-testid="pos-header"]',
      titleKey: 'ui.onboard.icecream.pos.intro.title',
      bodyKey: 'ui.onboard.icecream.pos.intro.body',
      placement: 'bottom',
      route: '/icecream/pos',
      waitFor: '[data-testid="pos-header"]',
      timeoutMs: 5000
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.POS.PRODUCTS.V1',
      selector: '[data-testid="product-grid"]',
      titleKey: 'ui.onboard.icecream.pos.products.title',
      bodyKey: 'ui.onboard.icecream.pos.products.body',
      placement: 'right',
      spotlightPadding: 16,
      waitFor: '[data-testid="product-grid"]'
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.POS.CART.V1',
      selector: '[data-testid="pos-cart"]',
      titleKey: 'ui.onboard.icecream.pos.cart.title',
      bodyKey: 'ui.onboard.icecream.pos.cart.body',
      placement: 'left',
      spotlightPadding: 12,
      waitFor: '[data-testid="pos-cart"]'
    }
  ]
}

/**
 * Quality control tour
 */
export const iceCreamQualityTour: HeraTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.ICECREAM.QUALITY.V1',
  autoStart: false,
  allowSkip: true,
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.QUALITY.INTRO.V1',
      selector: '[data-testid="quality-header"]',
      titleKey: 'ui.onboard.icecream.quality.intro.title',
      bodyKey: 'ui.onboard.icecream.quality.intro.body',
      placement: 'bottom',
      route: '/icecream/quality',
      waitFor: '[data-testid="quality-header"]',
      timeoutMs: 5000
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.QUALITY.PENDING.V1',
      selector: '[data-testid="pending-checks"]',
      titleKey: 'ui.onboard.icecream.quality.pending.title',
      bodyKey: 'ui.onboard.icecream.quality.pending.body',
      placement: 'top',
      waitFor: '[data-testid="pending-checks"]'
    },
    {
      smartCode: 'HERA.UI.ONBOARD.ICECREAM.QUALITY.ACTIONS.V1',
      selector: '[data-testid="quality-actions"]',
      titleKey: 'ui.onboard.icecream.quality.actions.title',
      bodyKey: 'ui.onboard.icecream.quality.actions.body',
      placement: 'left',
      waitFor: '[data-testid="quality-actions"]'
    }
  ]
}

/**
 * All ice cream tours for registration
 */
export const allIceCreamTours = [
  iceCreamDashboardTour,
  iceCreamProductionTour,
  iceCreamInventoryTour,
  iceCreamPOSTour,
  iceCreamQualityTour
]
