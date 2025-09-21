// ================================================================================
// HERA DNA INDUSTRY DASHBOARD EXAMPLES - UNIFIED EXPORTS
// Smart Code: HERA.DNA.EXAMPLE.DASHBOARDS.EXPORT.V1
// ================================================================================

// Industry-specific dashboard examples
export { RestaurantDashboard } from './RestaurantDashboard'
export type {
  RestaurantDashboardProps,
  RestaurantMetrics,
  MenuItem,
  RecentOrder
} from './RestaurantDashboard'

export { SalonDashboard } from './SalonDashboard'
export type {
  SalonDashboardProps,
  SalonMetrics,
  Appointment,
  Service,
  Stylist
} from './SalonDashboard'

export { HealthcareDashboard } from './HealthcareDashboard'
export type {
  HealthcareDashboardProps,
  HealthcareMetrics,
  Patient,
  Doctor
} from './HealthcareDashboard'

// Dashboard registry for dynamic loading
export const INDUSTRY_DASHBOARDS = {
  restaurant: () => import('./RestaurantDashboard'),
  salon: () => import('./SalonDashboard'),
  healthcare: () => import('./HealthcareDashboard')
} as const

// Dashboard metadata
export const DASHBOARD_INFO = {
  restaurant: {
    name: 'Restaurant Dashboard',
    description: 'Complete restaurant operations dashboard with real-time metrics',
    smartCode: 'HERA.DNA.EXAMPLE.DASHBOARD.RESTAURANT.V1',
    features: ['Daily Sales', 'Order Management', 'Menu Performance', 'Kitchen Status'],
    industry: 'restaurant'
  },
  salon: {
    name: 'Salon Dashboard',
    description: 'Complete salon & spa operations dashboard with appointment management',
    smartCode: 'HERA.DNA.EXAMPLE.DASHBOARD.SALON.V1',
    features: [
      'Appointment Scheduling',
      'Staff Management',
      'Service Performance',
      'Client Satisfaction'
    ],
    industry: 'salon'
  },
  healthcare: {
    name: 'Healthcare Dashboard',
    description: 'Complete healthcare practice dashboard with patient management',
    smartCode: 'HERA.DNA.EXAMPLE.DASHBOARD.HEALTHCARE.V1',
    features: ['Patient Management', 'Doctor Scheduling', 'Medical Records', 'Emergency Alerts'],
    industry: 'healthcare'
  }
} as const

// Helper function for dynamic dashboard loading
export const loadIndustryDashboard = async (industry: keyof typeof INDUSTRY_DASHBOARDS) => {
  try {
    const dashboardModule = await INDUSTRY_DASHBOARDS[industry]()
    return dashboardModule
  } catch (error) {
    console.error(`Failed to load dashboard: ${industry}`, error)
    throw new Error(`Dashboard ${industry} not found`)
  }
}

// Get dashboard info
export const getDashboardInfo = (industry: keyof typeof DASHBOARD_INFO) => {
  return DASHBOARD_INFO[industry]
}

// Get all available dashboards
export const getAvailableDashboards = () => {
  return Object.keys(DASHBOARD_INFO) as Array<keyof typeof DASHBOARD_INFO>
}

// Default export
export default {
  dashboards: INDUSTRY_DASHBOARDS,
  info: DASHBOARD_INFO,
  load: loadIndustryDashboard,
  getInfo: getDashboardInfo,
  getAvailable: getAvailableDashboards
}
