// ================================================================================
// HERA UNIVERSAL POS CONFIGURATIONS
// Industry-specific presets for the Universal POS DNA Component
// Smart Code: HERA.UI.POS.CONFIG.PRESETS.V1
// ================================================================================

import {
  Scissors,
  Utensils,
  ShoppingBag,
  Stethoscope,
  Car,
  Star,
  Wrench,
  Dumbbell,
  Camera,
  Briefcase
} from 'lucide-react'
import { POSConfiguration } from '@/components/universal/UniversalPOS'

// ================================================================================
// SALON & SPA CONFIGURATION
// ================================================================================
export const salonPOSConfig: POSConfiguration = {
  businessName: 'Bella Salon & Spa',
  businessType: 'salon',
  currency: '$',
  taxRate: 0.08,
  receiptHeader: 'BELLA SALON & SPA',
  receiptFooter: 'Thank you for your visit!\nwww.bellasalon.com',
  theme: {
    primaryColor: 'from-pink-500/90',
    secondaryColor: 'to-purple-600/90',
    accentColor: 'bg-pink-600 hover:bg-pink-700',
    icon: Scissors
  },
  features: {
    splitPayments: true,
    printing: true,
    inventory: true,
    services: true,
    appointments: true,
    loyalty: true
  },
  paymentMethods: {
    cash: true,
    card: true,
    apple_pay: true,
    google_pay: true,
    venmo: true,
    gift_card: true,
    store_credit: true
  },
  itemCategories: [
    'Hair Services',
    'Color Services',
    "Men's Services",
    'Hair Treatments',
    'Hair Care',
    'Styling Products',
    'Nail Services',
    'Spa Services'
  ],
  serviceProviders: ['Emma', 'Sarah', 'David', 'Alex', 'Maria']
}

// ================================================================================
// RESTAURANT CONFIGURATION
// ================================================================================
export const restaurantPOSConfig: POSConfiguration = {
  businessName: "Mario's Restaurant",
  businessType: 'restaurant',
  currency: '$',
  taxRate: 0.0875,
  receiptHeader: "MARIO'S RESTAURANT",
  receiptFooter: 'Grazie! Come back soon!\nwww.mariosrestaurant.com',
  theme: {
    primaryColor: 'from-red-500/90',
    secondaryColor: 'to-orange-600/90',
    accentColor: 'bg-red-600 hover:bg-red-700',
    icon: Utensils
  },
  features: {
    splitPayments: true,
    printing: true,
    inventory: true,
    services: false,
    appointments: false,
    loyalty: true
  },
  paymentMethods: {
    cash: true,
    card: true,
    apple_pay: true,
    google_pay: true,
    venmo: false,
    gift_card: true,
    store_credit: false
  },
  itemCategories: [
    'Appetizers',
    'Salads',
    'Pasta',
    'Pizza',
    'Main Courses',
    'Desserts',
    'Beverages',
    'Wine & Beer'
  ]
}

// ================================================================================
// RETAIL STORE CONFIGURATION
// ================================================================================
export const retailPOSConfig: POSConfiguration = {
  businessName: 'StyleHub Boutique',
  businessType: 'retail',
  currency: '$',
  taxRate: 0.07,
  receiptHeader: 'STYLEHUB BOUTIQUE',
  receiptFooter: 'Thank you for shopping with us!\nReturn policy: 30 days\nwww.stylehub.com',
  theme: {
    primaryColor: 'from-blue-500/90',
    secondaryColor: 'to-indigo-600/90',
    accentColor: 'bg-blue-600 hover:bg-blue-700',
    icon: ShoppingBag
  },
  features: {
    splitPayments: true,
    printing: true,
    inventory: true,
    services: false,
    appointments: false,
    loyalty: true
  },
  paymentMethods: {
    cash: true,
    card: true,
    apple_pay: true,
    google_pay: true,
    venmo: true,
    gift_card: true,
    store_credit: true
  },
  itemCategories: [
    "Women's Clothing",
    "Men's Clothing",
    'Shoes',
    'Accessories',
    'Jewelry',
    'Bags',
    'Home Decor'
  ]
}

// ================================================================================
// HEALTHCARE CONFIGURATION
// ================================================================================
export const healthcarePOSConfig: POSConfiguration = {
  businessName: 'WellCare Medical Center',
  businessType: 'healthcare',
  currency: '$',
  taxRate: 0.0,
  receiptHeader: 'WELLCARE MEDICAL CENTER',
  receiptFooter:
    'Your health is our priority\nNext appointment: See front desk\nwww.wellcaremedical.com',
  theme: {
    primaryColor: 'from-green-500/90',
    secondaryColor: 'to-teal-600/90',
    accentColor: 'bg-green-600 hover:bg-green-700',
    icon: Stethoscope
  },
  features: {
    splitPayments: true,
    printing: true,
    inventory: false,
    services: true,
    appointments: true,
    loyalty: false
  },
  paymentMethods: {
    cash: true,
    card: true,
    apple_pay: true,
    google_pay: false,
    venmo: false,
    gift_card: false,
    store_credit: false,
    insurance: true
  },
  itemCategories: [
    'Consultations',
    'Procedures',
    'Lab Tests',
    'Imaging',
    'Prescriptions',
    'Medical Supplies'
  ],
  serviceProviders: ['Dr. Smith', 'Dr. Johnson', 'Nurse Mary', 'Dr. Williams']
}

// ================================================================================
// AUTOMOTIVE SERVICE CONFIGURATION
// ================================================================================
export const automotivePOSConfig: POSConfiguration = {
  businessName: "Mike's Auto Service",
  businessType: 'automotive',
  currency: '$',
  taxRate: 0.06,
  receiptHeader: "MIKE'S AUTO SERVICE",
  receiptFooter:
    'Warranty: See terms & conditions\nNext service: Oil change in 3,000 miles\nwww.mikesauto.com',
  theme: {
    primaryColor: 'from-slate-500/90',
    secondaryColor: 'to-gray-600/90',
    accentColor: 'bg-slate-600 hover:bg-slate-700',
    icon: Car
  },
  features: {
    splitPayments: true,
    printing: true,
    inventory: true,
    services: true,
    appointments: true,
    loyalty: true
  },
  paymentMethods: {
    cash: true,
    card: true,
    apple_pay: true,
    google_pay: true,
    venmo: false,
    gift_card: false,
    store_credit: true,
    financing: true
  },
  itemCategories: [
    'Oil Changes',
    'Brake Service',
    'Engine Repair',
    'Transmission',
    'Tires',
    'Parts',
    'Accessories'
  ],
  serviceProviders: ['Mike', 'Tony', 'Steve', 'Carlos']
}

// ================================================================================
// FITNESS GYM CONFIGURATION
// ================================================================================
export const gymPOSConfig: POSConfiguration = {
  businessName: 'FitLife Gym',
  businessType: 'general',
  currency: '$',
  taxRate: 0.08,
  receiptHeader: 'FITLIFE GYM',
  receiptFooter: 'Keep crushing your goals!\nMembership expires: Check app\nwww.fitlifegym.com',
  theme: {
    primaryColor: 'from-orange-500/90',
    secondaryColor: 'to-red-600/90',
    accentColor: 'bg-orange-600 hover:bg-orange-700',
    icon: Dumbbell
  },
  features: {
    splitPayments: true,
    printing: true,
    inventory: true,
    services: true,
    appointments: true,
    loyalty: true
  },
  paymentMethods: {
    cash: true,
    card: true,
    apple_pay: true,
    google_pay: true,
    venmo: true,
    gift_card: true,
    store_credit: true
  },
  itemCategories: [
    'Personal Training',
    'Group Classes',
    'Supplements',
    'Apparel',
    'Equipment',
    'Memberships'
  ],
  serviceProviders: ['Jake', 'Lisa', 'Marcus', 'Sophie']
}

// ================================================================================
// PHOTOGRAPHY STUDIO CONFIGURATION
// ================================================================================
export const photographyPOSConfig: POSConfiguration = {
  businessName: 'Capture Moments Studio',
  businessType: 'general',
  currency: '$',
  taxRate: 0.085,
  receiptHeader: 'CAPTURE MOMENTS STUDIO',
  receiptFooter:
    'Thank you for choosing us!\nPhotos ready in 3-5 business days\nwww.capturemoments.com',
  theme: {
    primaryColor: 'from-purple-500/90',
    secondaryColor: 'to-pink-600/90',
    accentColor: 'bg-purple-600 hover:bg-purple-700',
    icon: Camera
  },
  features: {
    splitPayments: true,
    printing: true,
    inventory: false,
    services: true,
    appointments: true,
    loyalty: true
  },
  paymentMethods: {
    cash: true,
    card: true,
    apple_pay: true,
    google_pay: true,
    venmo: true,
    gift_card: true,
    store_credit: false
  },
  itemCategories: [
    'Portrait Sessions',
    'Event Photography',
    'Wedding Packages',
    'Product Photography',
    'Photo Prints',
    'Albums & Frames'
  ],
  serviceProviders: ['Sarah', 'Michael', 'Emma', 'David']
}

// ================================================================================
// LEGAL SERVICES CONFIGURATION
// ================================================================================
export const legalPOSConfig: POSConfiguration = {
  businessName: 'Johnson & Associates Law',
  businessType: 'general',
  currency: '$',
  taxRate: 0.0,
  receiptHeader: 'JOHNSON & ASSOCIATES LAW',
  receiptFooter: 'Confidential Attorney-Client\nNext consultation: TBD\nwww.johnsonlaw.com',
  theme: {
    primaryColor: 'from-blue-500/90',
    secondaryColor: 'to-slate-600/90',
    accentColor: 'bg-blue-600 hover:bg-blue-700',
    icon: Briefcase
  },
  features: {
    splitPayments: false,
    printing: true,
    inventory: false,
    services: true,
    appointments: true,
    loyalty: false
  },
  paymentMethods: {
    cash: true,
    card: true,
    apple_pay: false,
    google_pay: false,
    venmo: false,
    gift_card: false,
    store_credit: false
  },
  itemCategories: [
    'Consultations',
    'Document Preparation',
    'Court Representation',
    'Contract Review',
    'Legal Research'
  ],
  serviceProviders: ['Mr. Johnson', 'Ms. Smith', 'Mr. Davis']
}

// ================================================================================
// CONFIGURATION REGISTRY
// ================================================================================
export const posConfigurations = {
  salon: salonPOSConfig,
  restaurant: restaurantPOSConfig,
  retail: retailPOSConfig,
  healthcare: healthcarePOSConfig,
  automotive: automotivePOSConfig,
  gym: gymPOSConfig,
  photography: photographyPOSConfig,
  legal: legalPOSConfig
} as const

export type POSConfigurationType = keyof typeof posConfigurations

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

export function getPOSConfiguration(type: POSConfigurationType): POSConfiguration {
  return posConfigurations[type]
}

export function getAllPOSConfigurations(): Record<POSConfigurationType, POSConfiguration> {
  return posConfigurations
}

export function createCustomPOSConfiguration(
  baseType: POSConfigurationType,
  overrides: Partial<POSConfiguration>
): POSConfiguration {
  const baseConfig = getPOSConfiguration(baseType)
  return {
    ...baseConfig,
    ...overrides,
    theme: {
      ...baseConfig.theme,
      ...overrides.theme
    },
    features: {
      ...baseConfig.features,
      ...overrides.features
    },
    paymentMethods: {
      ...baseConfig.paymentMethods,
      ...overrides.paymentMethods
    }
  }
}
