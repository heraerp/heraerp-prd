/**
 * HERA Universal Onboarding - i18n Support
 * 
 * Type-safe internationalization for onboarding tours
 * Supports multi-language with fallback to English defaults
 */

/**
 * Default English messages for onboarding
 * Keys follow pattern: ui.onboard.{module}.{component}.{step}.{field}
 */
export const defaultMessages: Record<string, string> = {
  // Generic onboarding controls
  'ui.onboard.controls.next': 'Next',
  'ui.onboard.controls.back': 'Back',
  'ui.onboard.controls.close': 'Close',
  'ui.onboard.controls.skip': 'Skip Tour',
  'ui.onboard.controls.last': 'Finish',
  'ui.onboard.controls.open': 'Open',
  
  // Progress indicators
  'ui.onboard.progress.step': 'Step {{current}} of {{total}}',
  'ui.onboard.progress.complete': 'Tour Complete!',
  
  // Console Dashboard Tour
  'ui.onboard.console.dashboard.welcome.title': 'Welcome to HERA Dashboard',
  'ui.onboard.console.dashboard.welcome.body': 'This quick tour highlights the key areas you\'ll use every day. Let\'s explore the powerful features of your universal business platform.',
  
  'ui.onboard.console.dashboard.filters.title': 'Filter Your Data',
  'ui.onboard.console.dashboard.filters.body': 'Narrow results by date range, organization, and Smart Codes. These filters work across all six universal tables.',
  
  'ui.onboard.console.dashboard.kpis.title': 'KPI Cards',
  'ui.onboard.console.dashboard.kpis.body': 'Key Performance Indicators summarize your universal transactions at a glance. Each card uses Smart Codes for intelligent business context.',
  
  'ui.onboard.console.dashboard.create.title': 'Create an Entity',
  'ui.onboard.console.dashboard.create.body': 'Use this button to add any business object via core_entities table. Dynamic fields let you customize without schema changes.',
  
  // CRM Module Tour
  'ui.onboard.crm.customers.title': 'Customer Management',
  'ui.onboard.crm.customers.body': 'Manage all customer entities with unlimited custom fields. Every customer is an entity in the universal architecture.',
  
  'ui.onboard.crm.pipeline.title': 'Sales Pipeline',
  'ui.onboard.crm.pipeline.body': 'Track opportunities through stages using relationships. No status columns needed - everything flows through core_relationships.',
  
  // Financial Module Tour
  'ui.onboard.financial.gl.title': 'General Ledger',
  'ui.onboard.financial.gl.body': 'Chart of Accounts with IFRS compliance built-in. Every GL account is an entity with Smart Code intelligence.',
  
  'ui.onboard.financial.transactions.title': 'Universal Transactions',
  'ui.onboard.financial.transactions.body': 'All business activities flow through universal_transactions table. Automatic GL posting via Smart Codes.',
  
  // Inventory Module Tour
  'ui.onboard.inventory.products.title': 'Product Catalog',
  'ui.onboard.inventory.products.body': 'Products are entities with dynamic specifications. Add unlimited attributes without database changes.',
  
  'ui.onboard.inventory.movements.title': 'Stock Movements',
  'ui.onboard.inventory.movements.body': 'Track inventory through universal transactions. Real-time stock levels with complete audit trail.',
  
  // HR Module Tour
  'ui.onboard.hr.employees.title': 'Employee Records',
  'ui.onboard.hr.employees.body': 'Employees are entities with dynamic HR data. Organizational structure through relationships.',
  
  'ui.onboard.hr.payroll.title': 'Payroll Processing',
  'ui.onboard.hr.payroll.body': 'Payroll runs create universal transactions. Automatic journal entries with Smart Code routing.',
  
  // Settings Tour
  'ui.onboard.settings.organization.title': 'Organization Settings',
  'ui.onboard.settings.organization.body': 'Configure your organization details. Sacred boundary ensures complete data isolation.',
  
  'ui.onboard.settings.users.title': 'User Management',
  'ui.onboard.settings.users.body': 'Users are entities too! Manage permissions through dynamic role assignments.',
  
  // Progressive PWA Tours
  'ui.onboard.progressive.welcome.title': 'Progressive Mode',
  'ui.onboard.progressive.welcome.body': '30-day trial with full functionality. All data stored locally and syncs when you upgrade.',
  
  'ui.onboard.progressive.upgrade.title': 'Upgrade to Production',
  'ui.onboard.progressive.upgrade.body': 'Convert to full production with custom subdomain. Zero data loss - everything migrates seamlessly.',
  
  // Error and Status Messages
  'ui.onboard.error.timeout': 'Step timed out waiting for element',
  'ui.onboard.error.notfound': 'Target element not found',
  'ui.onboard.error.navigation': 'Failed to navigate to required route',
  'ui.onboard.status.loading': 'Loading tour...',
  'ui.onboard.status.complete': 'Tour completed successfully!',
  'ui.onboard.status.skipped': 'Tour skipped',
  
  // Accessibility
  'ui.onboard.a11y.spotlight': 'Highlighted area for current step',
  'ui.onboard.a11y.tooltip': 'Tour guide tooltip',
  'ui.onboard.a11y.overlay': 'Tour overlay - click to dismiss',
};

/**
 * Message interpolation function
 * Replaces {{variable}} with provided values
 */
export function interpolate(message: string, values: Record<string, any>): string {
  return message.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key]?.toString() || match;
  });
}

/**
 * Get message by key with fallback
 * @param key - Message key
 * @param messages - Custom message overrides
 * @param values - Interpolation values
 */
export function getMessage(
  key: string,
  messages: Record<string, string> = {},
  values?: Record<string, any>
): string {
  const message = messages[key] || defaultMessages[key] || key;
  return values ? interpolate(message, values) : message;
}

/**
 * Validate message keys exist
 * Useful for development to catch missing translations
 */
export function validateMessageKeys(
  requiredKeys: string[],
  messages: Record<string, string> = {}
): { missing: string[]; found: string[] } {
  const allMessages = { ...defaultMessages, ...messages };
  const missing: string[] = [];
  const found: string[] = [];
  
  requiredKeys.forEach(key => {
    if (allMessages[key]) {
      found.push(key);
    } else {
      missing.push(key);
    }
  });
  
  return { missing, found };
}

/**
 * Extract all message keys from a tour
 * Helps identify what translations are needed
 */
export function extractTourMessageKeys(steps: Array<{ titleKey: string; bodyKey: string }>): string[] {
  const keys = new Set<string>();
  
  // Add control keys
  Object.keys(defaultMessages).forEach(key => {
    if (key.startsWith('ui.onboard.controls.') || key.startsWith('ui.onboard.progress.')) {
      keys.add(key);
    }
  });
  
  // Add step keys
  steps.forEach(step => {
    keys.add(step.titleKey);
    keys.add(step.bodyKey);
  });
  
  return Array.from(keys);
}

/**
 * Language detection helper
 * Returns browser language or fallback
 */
export function detectLanguage(fallback: string = 'en'): string {
  if (typeof window === 'undefined') return fallback;
  
  const browserLang = window.navigator.language;
  return browserLang.split('-')[0] || fallback;
}

/**
 * Message loader type for async i18n
 * Can be used to load translations from API
 */
export type MessageLoader = (lang: string) => Promise<Record<string, string>>;

/**
 * Async message loading wrapper
 * Caches loaded messages by language
 */
export class I18nManager {
  private cache: Map<string, Record<string, string>> = new Map();
  private loader?: MessageLoader;
  
  constructor(loader?: MessageLoader) {
    this.loader = loader;
    // Pre-cache default messages
    this.cache.set('en', defaultMessages);
  }
  
  async loadMessages(lang: string): Promise<Record<string, string>> {
    // Return cached if available
    if (this.cache.has(lang)) {
      return this.cache.get(lang)!;
    }
    
    // Load from loader if provided
    if (this.loader) {
      try {
        const messages = await this.loader(lang);
        this.cache.set(lang, messages);
        return messages;
      } catch (error) {
        console.warn(`Failed to load messages for ${lang}, falling back to English`, error);
      }
    }
    
    // Fallback to English
    return defaultMessages;
  }
  
  clearCache(): void {
    this.cache.clear();
    this.cache.set('en', defaultMessages);
  }
}