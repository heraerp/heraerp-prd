/**
 * MatrixIT World Constants
 * Organization-specific configuration for PC & Mobile retail platform
 */

export const MATRIXITWORLD_CONFIG = {
  // Organization
  ORGANIZATION_ID: process.env.NEXT_PUBLIC_MATRIXITWORLD_ORGANIZATION_ID || '1663df3c-f0ac-4176-b163-caf0601a61b1',
  ORGANIZATION_NAME: 'MatrixIT World',
  ORGANIZATION_CODE: 'MATRIXITWORLD',
  
  // Business Details
  INDUSTRY: 'PC & Mobile Retail Distribution',
  LOCATION: 'Kerala, India',
  BRANCH_COUNT: 6,
  BUSINESS_MODEL: 'Multi-branch retail and distribution',
  
  // Branches
  BRANCHES: [
    {
      id: 'kochi-main',
      name: 'Kochi Main',
      type: 'Main Branch',
      city: 'Kochi',
      district: 'Ernakulam',
      code: 'KOCHI_MAIN'
    },
    {
      id: 'trivandrum-main',
      name: 'Trivandrum Main', 
      type: 'Main Branch',
      city: 'Trivandrum',
      district: 'Thiruvananthapuram',
      code: 'TRIVANDRUM_MAIN'
    },
    {
      id: 'kozhikode-distributor',
      name: 'Kozhikode Distributor',
      type: 'Distributor',
      city: 'Kozhikode', 
      district: 'Kozhikode',
      code: 'KOZHIKODE_DISTRIBUTOR'
    },
    {
      id: 'thrissur-retail',
      name: 'Thrissur Retail',
      type: 'Retail',
      city: 'Thrissur',
      district: 'Thrissur', 
      code: 'THRISSUR_RETAIL'
    },
    {
      id: 'kannur-service',
      name: 'Kannur Service',
      type: 'Service Center',
      city: 'Kannur',
      district: 'Kannur',
      code: 'KANNUR_SERVICE'
    },
    {
      id: 'kollam-retail',
      name: 'Kollam Retail',
      type: 'Retail', 
      city: 'Kollam',
      district: 'Kollam',
      code: 'KOLLAM_RETAIL'
    }
  ],
  
  // Product Categories
  PRODUCT_CATEGORIES: [
    { id: 'mobile-phones', name: 'Mobile Phones', icon: 'Smartphone' },
    { id: 'laptops', name: 'Laptops', icon: 'Laptop' },
    { id: 'desktop-pcs', name: 'Desktop PCs', icon: 'Monitor' },
    { id: 'components', name: 'PC Components', icon: 'HardDrive' },
    { id: 'accessories', name: 'Accessories', icon: 'Package' }
  ],
  
  // Smart Codes
  SMART_CODES: {
    ORGANIZATION: 'HERA.RETAIL.ORGANIZATION.MATRIXITWORLD.v1',
    BRANCH: 'HERA.RETAIL.LOCATION.BRANCH.v1',
    PRODUCT: 'HERA.RETAIL.PRODUCT.ENTITY.v1',
    CUSTOMER: 'HERA.RETAIL.CUSTOMER.ENTITY.v1',
    SALES_ORDER: 'HERA.RETAIL.SALES.ORDER.v1',
    PURCHASE_ORDER: 'HERA.RETAIL.PURCHASE.ORDER.v1',
    STOCK_TRANSFER: 'HERA.RETAIL.STOCK.TRANSFER.v1'
  },
  
  // Branding
  BRANDING: {
    PRIMARY_COLOR: '#2563EB', // Blue-600
    SECONDARY_COLOR: '#64748B', // Slate-500
    ACCENT_COLOR: '#10B981', // Emerald-500
    LOGO_TEXT: 'MatrixIT World',
    TAGLINE: 'Kerala\'s Premier Tech Retail Platform',
    THEME_NAME: 'MatrixIT World - Tech Distribution'
  }
}

export default MATRIXITWORLD_CONFIG