// HERA Version Configuration
export const APP_VERSION = {
  current: '1.2.0',
  build: '20250825055733',
  releaseDate: '2025-08-25',
  features: [
    'Universal 6-table architecture',
    'PWA support with offline capability',
    'Multi-tenant security',
    'AI-native fields',
    'Real-time data sync',
    'Complete GSPU 2025 audit workflow system',
    'Supabase document management with 31 GSPU documents',
    'Individual client dashboards',
    'Steve Jobs-inspired audit interface',
    'Multi-tenant architecture: GSPU as HERA client with isolated organization per audit client',
    '🧬 HERA DNA: Universal Dropdown Visibility Fix across all applications'
  ]
};

export const VERSION_HISTORY = [
  {
    version: '1.2.0',
    date: '2025-08-10',
    changes: [
      '🚀 HERA Profitability & Cost Accounting Module - Complete implementation with progressive authentication',
      '✨ Enhanced PWA Update System - Automatic update detection every 30 seconds with visual notifications',
      '🔄 Network-First Strategy - App routes now use network-first caching for immediate updates',
      '🔧 Fixed duplicate loadData function declarations across all financial modules (AP, AR, GL, Banks, Budgets, Fixed Assets)',
      '📦 Production Bundle - Successfully compiled and optimized 1.9GB bundle in 4.1 minutes',
      '🎯 Smart Code Integration - 40+ profitability analysis patterns with BOM integration',
      '💰 Activity-Based Costing - Multiple allocation methods with profit center management',
      '📊 Progressive Data Persistence - Local storage for anonymous users with seamless upgrades',
      '🔔 UpdateNotification Component - Active version checking with forced cache clearing',
      '🛠️ Version API Enhancement - No-cache headers to ensure fresh version checks'
    ]
  },
  {
    version: '1.1.2',
    date: '2025-08-09',
    changes: [
      '🧬 HERA DNA BREAKTHROUGH: Universal Dropdown Visibility Fix now standard across all applications',
      'Fixed transparent Radix Select dropdown issue globally via globals.css with automatic theme support',
      'Added .hera-select-content and .hera-select-item classes as HERA DNA standard components',
      'Integrated dropdown fix into all generators (generate-module.js, generate-progressive-app.js)',
      'Enhanced accessibility with proper contrast ratios and focus states in all dropdown components',
      'Implemented z-index management for proper modal and overlay compatibility',
      'Created comprehensive documentation at docs/HERA-DNA-DROPDOWN-FIX.md with usage examples',
      'Updated salon-progressive module with complete dropdown fixes across all pages',
      'Backward compatibility maintained with .salon-select-content class support',
      'Zero configuration required - fix automatically applies to all existing and new HERA applications'
    ]
  },
  {
    version: '1.1.1',
    date: '2025-08-02',
    changes: [
      'Updated multi-tenant architecture to reflect GSPU as HERA client',
      'Each GSPU audit client now gets dedicated organization_id for perfect data isolation',
      'Enhanced metadata structure with gspu_client_id and audit_firm fields',
      'Updated API endpoints to use new organization structure',
      'Revised documentation to clarify multi-tenant architecture',
      'Improved Supabase Storage structure for better client isolation',
      'Fixed React hooks rule violation in AuditDashboard component - moved all useState calls before conditional logic',
      'Added organization ID display throughout audit dashboard and client dashboard',
      'Dynamic organization ID generation based on client code for perfect isolation',
      'Enhanced UI to show GSPU client tracking and audit firm information',
      'Fixed TypeScript compilation errors in restaurant-reservations components (invalid function names with hyphens)',
      'Resolved runtime TypeError by fixing syntax errors and cleaning Next.js cache',
      'Fixed production build issues in documentation system - analytics and dynamic pages now build successfully',
      'Improved build time handling for documentation API calls with proper fallbacks',
      'Build completes successfully with all 225 pages generated - production ready'
    ]
  },
  {
    version: '1.1.0',
    date: '2025-08-02',
    changes: [
      'Complete HERA Audit Workflow System implementation',
      'GSPU 2025 compliant audit management with all 9 phases',
      'Supabase Document Management System with 31 GSPU documents',
      'Individual client dashboards with comprehensive document tracking',
      'Professional audit interface with Steve Jobs-inspired design',
      'New Engagement Modal with 5-step wizard and materiality calculation',
      'Document requisition system with real-time status tracking',
      'Hybrid architecture supporting both Supabase and mock data',
      'Complete audit trail with universal transaction logging',
      'Multi-tenant document isolation with organization_id filtering'
    ]
  },
  {
    version: '1.0.1',
    date: '2025-07-29',
    changes: [
      'Fixed all TypeScript compilation errors',
      'Created Calendar component with react-day-picker',
      'Fixed WebSocket hooks type compatibility',
      'Updated Next.js 15 route handlers',
      'Resolved hydration mismatches',
      'Added comprehensive table management system',
      'Cache-busting build version update'
    ]
  },
  {
    version: '1.0.0',
    date: '2025-01-27',
    changes: [
      'Initial release',
      'Core 6-table architecture',
      'PWA implementation',
      'Service worker for offline support',
      'Version tracking system'
    ]
  }
];

// Check if update is available
export const checkForUpdates = async (): Promise<boolean> => {
  try {
    // In production, this would check against a version endpoint
    const response = await fetch('/api/version');
    const data = await response.json();
    return data.version !== APP_VERSION.current;
  } catch {
    return false;
  }
};