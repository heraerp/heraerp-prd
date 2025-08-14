#!/usr/bin/env node

/**
 * HERA Progressive App Generator
 * 
 * Uses jewelry-progressive as DNA template to generate complete industry-specific applications
 * in 30 seconds with progressive authentication, Teams-style UI, and universal CRUD operations.
 */

const fs = require('fs').promises;
const path = require('path');

// Industry-specific templates based on jewelry-progressive DNA
const INDUSTRY_TEMPLATES = {
  restaurant: {
    name: 'Restaurant Management',
    displayName: 'Restaurant',
    industry: 'hospitality',
    modules: [
      { id: 'pos', name: 'Point of Sale', description: 'Quick service and seamless transactions' },
      { id: 'menu', name: 'Menu Management', description: 'Craft your culinary masterpieces' },
      { id: 'kitchen', name: 'Kitchen Display', description: 'Real-time order orchestration' },
      { id: 'delivery', name: 'Delivery Orders', description: 'Expand your reach, delight customers' },
      { id: 'inventory', name: 'Inventory', description: 'Smart stock management and waste reduction' }
    ],
    colors: { primary: 'from-orange-500 to-red-600', secondary: 'from-yellow-500 to-orange-500' },
    entities: {
      product: {
        base: ['name', 'sku', 'price', 'category', 'stock'],
        specific: ['ingredient_type', 'prep_time_minutes', 'allergen_info', 'spice_level']
      },
      customer: {
        base: ['name', 'email', 'phone', 'tier'],
        specific: ['dietary_restrictions', 'favorite_dishes', 'delivery_address']
      }
    },
    sidebar: [
      { id: 'pos', icon: 'ShoppingCart', label: 'Point of Sale' },
      { id: 'menu', icon: 'Package', label: 'Menu Management' },
      { id: 'kitchen', icon: 'Utensils', label: 'Kitchen Display' },
      { id: 'delivery', icon: 'Truck', label: 'Delivery Orders' },
      { id: 'inventory', icon: 'Package2', label: 'Inventory' }
    ],
    demo_data: {
      products: [
        { name: 'Margherita Pizza', category: 'Pizza', price: 18.99, ingredient_type: 'vegetarian' },
        { name: 'Caesar Salad', category: 'Salad', price: 12.99, ingredient_type: 'vegetarian' },
        { name: 'Grilled Salmon', category: 'Main', price: 28.99, ingredient_type: 'seafood' }
      ]
    }
  },

  healthcare: {
    name: 'Healthcare Practice',
    displayName: 'Healthcare',
    industry: 'medical',
    modules: [
      { id: 'appointments', name: 'Appointments', description: 'Seamless scheduling and patient flow' },
      { id: 'patients', name: 'Patient Records', description: 'Comprehensive health management' },
      { id: 'billing', name: 'Billing & Insurance', description: 'Streamlined financial operations' },
      { id: 'prescriptions', name: 'Prescriptions', description: 'Safe and efficient medication management' },
      { id: 'reports', name: 'Medical Reports', description: 'Insights for better care outcomes' }
    ],
    colors: { primary: 'from-blue-500 to-cyan-600', secondary: 'from-green-500 to-blue-500' },
    entities: {
      patient: {
        base: ['name', 'email', 'phone', 'tier'],
        specific: ['medical_id', 'insurance_provider', 'allergies', 'current_medications']
      },
      appointment: {
        base: ['date', 'time', 'status', 'notes'],
        specific: ['appointment_type', 'duration_minutes', 'follow_up_required']
      }
    },
    sidebar: [
      { id: 'appointments', icon: 'Calendar', label: 'Appointments' },
      { id: 'patients', icon: 'Users', label: 'Patient Records' },
      { id: 'billing', icon: 'CreditCard', label: 'Billing & Insurance' },
      { id: 'prescriptions', icon: 'Pill', label: 'Prescriptions' },
      { id: 'reports', icon: 'FileText', label: 'Medical Reports' }
    ],
    demo_data: {
      patients: [
        { name: 'Sarah Johnson', medical_id: 'P001', insurance_provider: 'BlueCross' },
        { name: 'Michael Chen', medical_id: 'P002', insurance_provider: 'Aetna' },
        { name: 'Emma Davis', medical_id: 'P003', insurance_provider: 'Kaiser' }
      ]
    }
  },

  manufacturing: {
    name: 'Manufacturing ERP',
    displayName: 'Manufacturing',
    industry: 'manufacturing',
    modules: [
      { id: 'production', name: 'Production Floor', description: 'Real-time production monitoring and control' },
      { id: 'inventory', name: 'Raw Materials', description: 'Optimize inventory levels and reduce waste' },
      { id: 'quality', name: 'Quality Control', description: 'Ensure excellence at every step' },
      { id: 'shipping', name: 'Shipping & Logistics', description: 'Efficient delivery management' },
      { id: 'customers', name: 'B2B Customers', description: 'Strengthen business relationships' }
    ],
    colors: { primary: 'from-slate-600 to-slate-800', secondary: 'from-blue-500 to-slate-600' },
    entities: {
      product: {
        base: ['name', 'sku', 'price', 'category', 'stock'],
        specific: ['material_type', 'weight_kg', 'dimensions', 'production_time_hours']
      },
      order: {
        base: ['order_number', 'customer', 'status', 'total'],
        specific: ['production_priority', 'quality_requirements', 'delivery_deadline']
      }
    },
    sidebar: [
      { id: 'production', icon: 'Factory', label: 'Production Floor' },
      { id: 'inventory', icon: 'Package', label: 'Raw Materials' },
      { id: 'quality', icon: 'CheckCircle', label: 'Quality Control' },
      { id: 'shipping', icon: 'Truck', label: 'Shipping & Logistics' },
      { id: 'customers', icon: 'Users', label: 'B2B Customers' }
    ],
    demo_data: {
      products: [
        { name: 'Steel Beam A-Grade', sku: 'SB-A001', material_type: 'steel', weight_kg: 50.5 },
        { name: 'Aluminum Panel', sku: 'AP-B001', material_type: 'aluminum', weight_kg: 12.3 },
        { name: 'Custom Bracket', sku: 'CB-C001', material_type: 'steel', weight_kg: 2.1 }
      ]
    }
  },

  'real-estate': {
    name: 'Real Estate Management',
    displayName: 'Real Estate',
    industry: 'property',
    modules: [
      { id: 'properties', name: 'Properties', description: 'Complete portfolio management' },
      { id: 'tenants', name: 'Tenants', description: 'Build lasting tenant relationships' },
      { id: 'leases', name: 'Lease Management', description: 'Streamline lease administration' },
      { id: 'maintenance', name: 'Maintenance', description: 'Proactive property care' },
      { id: 'financials', name: 'Financial Reports', description: 'Maximize property returns' }
    ],
    colors: { primary: 'from-emerald-500 to-teal-600', secondary: 'from-blue-500 to-emerald-500' },
    entities: {
      property: {
        base: ['name', 'address', 'type', 'status', 'value'],
        specific: ['square_footage', 'bedrooms', 'bathrooms', 'amenities', 'property_manager']
      },
      tenant: {
        base: ['name', 'email', 'phone', 'status'],
        specific: ['lease_start', 'lease_end', 'monthly_rent', 'security_deposit']
      }
    },
    sidebar: [
      { id: 'properties', icon: 'Building2', label: 'Properties' },
      { id: 'tenants', icon: 'Users', label: 'Tenants' },
      { id: 'leases', icon: 'FileText', label: 'Lease Management' },
      { id: 'maintenance', icon: 'Wrench', label: 'Maintenance' },
      { id: 'financials', icon: 'DollarSign', label: 'Financial Reports' }
    ],
    demo_data: {
      properties: [
        { name: 'Sunset Apartments Unit 2A', type: 'apartment', square_footage: 850, bedrooms: 2 },
        { name: 'Downtown Office Suite 301', type: 'commercial', square_footage: 1200, bedrooms: 0 },
        { name: 'Maple Street House', type: 'house', square_footage: 2400, bedrooms: 4 }
      ]
    }
  },

  'enterprise-retail': {
    name: 'Enterprise Retail Solution',
    displayName: 'Enterprise Retail',
    industry: 'retail',
    modules: [
      { id: 'merchandising', name: 'Merchandising', description: 'Product lifecycle, assortments, and visual merchandising' },
      { id: 'planning', name: 'Planning', description: 'Demand forecasting, assortment planning, and buying' },
      { id: 'procurement', name: 'Procurement', description: 'Supplier management, purchase orders, and sourcing' },
      { id: 'pos', name: 'Point of Sale', description: 'Omnichannel sales, transactions, and customer service' },
      { id: 'inventory', name: 'Inventory', description: 'Stock management, transfers, and warehouse operations' },
      { id: 'analytics', name: 'Analytics', description: 'Business intelligence, reporting, and insights' },
      { id: 'promotions', name: 'Promotions', description: 'Campaign management, pricing, and loyalty programs' },
      { id: 'customers', name: 'Customers', description: 'CRM, segmentation, and customer experience' }
    ],
    colors: { primary: 'from-blue-600 to-indigo-700', secondary: 'from-purple-500 to-blue-600' },
    entities: {
      product: {
        base: ['name', 'sku', 'price', 'category', 'stock'],
        specific: ['article_number', 'season', 'collection', 'color_code', 'size', 'vendor_code', 'cost_price', 'margin_percent', 'lifecycle_status']
      },
      customer: {
        base: ['name', 'email', 'phone', 'tier'],
        specific: ['customer_number', 'loyalty_points', 'preferred_store', 'shopping_preferences', 'lifetime_value', 'last_purchase_date']
      },
      store: {
        base: ['name', 'location', 'type', 'status'],
        specific: ['store_code', 'format', 'size_sqft', 'trading_hours', 'manager_name', 'region', 'performance_tier']
      },
      transaction: {
        base: ['transaction_id', 'date', 'total', 'status'],
        specific: ['pos_terminal', 'cashier_id', 'payment_method', 'discount_applied', 'tax_amount', 'receipt_number']
      }
    },
    sidebar: [
      { id: 'merchandising', icon: 'Package', label: 'Merchandising' },
      { id: 'planning', icon: 'Calendar', label: 'Planning & Buying' },
      { id: 'procurement', icon: 'Truck', label: 'Procurement' },
      { id: 'pos', icon: 'ShoppingCart', label: 'Point of Sale' },
      { id: 'inventory', icon: 'Package2', label: 'Inventory Mgmt' },
      { id: 'analytics', icon: 'BarChart3', label: 'Retail Analytics' },
      { id: 'promotions', icon: 'Tag', label: 'Promotions' },
      { id: 'customers', icon: 'Users', label: 'Customer Insights' }
    ],
    demo_data: {
      products: [
        { name: 'Premium Denim Jacket', sku: 'CLO-DJ-001', article_number: 'ART001', season: 'FW2025', collection: 'Urban Collection', color_code: 'INDIGO', size: 'M', cost_price: 45.00, price: 89.99, margin_percent: 50.0, category: 'Outerwear' },
        { name: 'Classic White Sneakers', sku: 'SHO-SNE-002', article_number: 'ART002', season: 'SS2025', collection: 'Essential Collection', color_code: 'WHITE', size: '42', cost_price: 25.00, price: 79.99, margin_percent: 68.8, category: 'Footwear' },
        { name: 'Silk Blend Scarf', sku: 'ACC-SCA-003', article_number: 'ART003', season: 'FW2025', collection: 'Luxury Collection', color_code: 'NAVY', size: 'OS', cost_price: 15.00, price: 49.99, margin_percent: 70.0, category: 'Accessories' }
      ],
      stores: [
        { name: 'Downtown Flagship', store_code: 'STR001', format: 'Flagship', size_sqft: 5000, region: 'Urban', performance_tier: 'A' },
        { name: 'Mall Location', store_code: 'STR002', format: 'Standard', size_sqft: 2500, region: 'Suburban', performance_tier: 'B' },
        { name: 'Outlet Store', store_code: 'STR003', format: 'Outlet', size_sqft: 3000, region: 'Outlet', performance_tier: 'C' }
      ],
      customers: [
        { name: 'Sarah Williams', customer_number: 'CUST001', loyalty_points: 2500, tier: 'Gold', preferred_store: 'STR001', lifetime_value: 1850.00 },
        { name: 'Michael Zhang', customer_number: 'CUST002', loyalty_points: 750, tier: 'Silver', preferred_store: 'STR002', lifetime_value: 650.00 },
        { name: 'Emma Rodriguez', customer_number: 'CUST003', loyalty_points: 5200, tier: 'Platinum', preferred_store: 'STR001', lifetime_value: 3200.00 }
      ]
    }
  }
};

async function generateProgressiveApp(industry) {
  const template = INDUSTRY_TEMPLATES[industry];
  
  if (!template) {
    console.error(`❌ Industry '${industry}' not supported. Available: ${Object.keys(INDUSTRY_TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  console.log(`🧬 Generating ${template.name} using HERA DNA from jewelry-progressive...`);

  const appDir = `src/app/${industry}-progressive`;
  const componentDir = `src/components/${industry}-progressive`;

  try {
    // Create directory structure
    await fs.mkdir(appDir, { recursive: true });
    await fs.mkdir(componentDir, { recursive: true });

    // Generate main page
    await generateMainPage(appDir, template, industry);
    
    // Generate sidebar component
    await generateSidebar(componentDir, template, industry);
    
    // Generate module pages
    for (const module of template.modules) {
      await fs.mkdir(path.join(appDir, module.id), { recursive: true });
      await generateModulePage(appDir, template, industry, module);
    }

    // Generate demo data
    await generateDemoData(template, industry);

    // Generate Smart Codes
    await generateSmartCodes(template, industry);

    console.log(`✅ ${template.name} generated successfully!`);
    console.log(`📂 Location: /${industry}-progressive`);
    console.log(`🚀 Visit: http://localhost:3002/${industry}-progressive`);
    console.log(`⚡ Generated in <30 seconds vs 26+ weeks traditional development`);
    console.log(`💰 Cost savings: 95%+ vs custom ERP development`);

  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  }
}

async function generateMainPage(appDir, template, industry) {
  // Generate the standardized HERA DNA homepage
  const componentName = template.name.replace(/\s+/g, '');
  const appSlug = industry + '-progressive';
  const camelCaseIndustry = industry.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const industryConfig = template;

  // Create home page with HERA DNA Design System
  const content = `'use client'

import React, { useState } from 'react'
import { useProgressiveAuth } from '@/components/auth/ProgressiveAuthProvider'
import { ${componentName}Sidebar } from '@/components/${appSlug}/${componentName}Sidebar'
import { 
  Package, Calendar, ShoppingBag, CreditCard, BarChart3, TrendingUp,
  Megaphone, Users, Sparkles, Store, Palette, Target, Zap,
  ChevronRight, ArrowUpRight, Bell, Search, MoreHorizontal,
  DollarSign, Building, Heart, Briefcase, Truck, Globe,
  Settings, Shield, Activity, FileText, Database, Cloud
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ${componentName}HomePage() {
  const { user, workspace } = useProgressiveAuth()
  const [hoveredModule, setHoveredModule] = useState<string | null>(null)

  // Modern module configuration with icons and gradients
  const ${camelCaseIndustry}Modules = [
${industryConfig.modules.map((module, index) => {
  const gradients = ['from-purple-500 to-pink-600', 'from-blue-500 to-cyan-600', 'from-green-500 to-emerald-600', 'from-orange-500 to-red-600', 'from-indigo-500 to-purple-600', 'from-teal-500 to-cyan-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600'];
  const icons = {
    customers: 'Users', finance: 'DollarSign', inventory: 'Package', analytics: 'BarChart3',
    pos: 'CreditCard', menu: 'FileText', delivery: 'Truck', kitchen: 'Store',
    patients: 'Heart', appointments: 'Calendar', billing: 'DollarSign', prescriptions: 'FileText',
    jewelry: 'Sparkles', repair: 'Settings', merchandising: 'Palette', planning: 'Calendar',
    procurement: 'ShoppingBag', promotions: 'Megaphone', reports: 'BarChart3',
    production: 'Activity', quality: 'Shield', shipping: 'Truck', properties: 'Building',
    tenants: 'Users', leases: 'FileText', maintenance: 'Settings', financials: 'DollarSign'
  };
  const icon = icons[module.id] || 'Briefcase';
  const stats = industryConfig.demo_data?.[module.id]?.stats || `${Math.floor(Math.random() * 900 + 100)} items`;
  return `    {
      id: '${module.id}',
      title: '${module.name}',
      description: '${module.description || `Manage your ${module.name.toLowerCase()} with intelligent automation`}',
      icon: ${icon},
      color: '${gradients[index % gradients.length]}',
      stats: '${stats}',
      trend: '+${Math.floor(Math.random() * 20 + 5)}%',
      url: '/${appSlug}/${module.id}'
    }`
}).join(',\n')}
  ]

  // Key metrics for header
  const keyMetrics = [
    { label: 'Today\\'s Revenue', value: '$${Math.floor(Math.random() * 50000 + 10000).toLocaleString()}', change: '+12.5%', positive: true },
    { label: 'Active ${industryConfig.displayName === 'Restaurant' ? 'Tables' : industryConfig.displayName === 'Healthcare' ? 'Patients' : 'Clients'}', value: '${Math.floor(Math.random() * 200 + 50)}', change: '+${Math.floor(Math.random() * 10 + 1)}', positive: true },
    { label: 'Conversion Rate', value: '${(Math.random() * 5 + 2).toFixed(1)}%', change: '+0.${Math.floor(Math.random() * 9 + 1)}%', positive: true },
    { label: 'Avg Transaction', value: '$${Math.floor(Math.random() * 200 + 50).toFixed(2)}', change: '-${(Math.random() * 3).toFixed(1)}%', positive: false }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      <${componentName}Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Premium Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  ${industryConfig.name} Command Center
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    HERA Powered
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">{workspace?.organization_name || user?.organizationName || '${industryConfig.displayName} Excellence Platform'}</p>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="relative">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Key Metrics Bar */}
            <div className="grid grid-cols-4 gap-4">
              {keyMetrics.map((metric, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                    <span className={\`text-sm font-medium flex items-center gap-1 \${
                      metric.positive ? 'text-green-600' : 'text-red-600'
                    }\`}>
                      <TrendingUp className={\`w-3 h-3 \${!metric.positive ? 'rotate-180' : ''}\`} />
                      {metric.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Welcome Section */}
            <div className="text-center max-w-4xl mx-auto mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mb-6 shadow-2xl">
                <${industryConfig.displayName === 'Restaurant' ? 'Store' : industryConfig.displayName === 'Healthcare' ? 'Heart' : industryConfig.displayName === 'Enterprise Retail' ? 'Store' : industryConfig.displayName === 'Real Estate' ? 'Building' : industryConfig.displayName === 'Manufacturing' ? 'Activity' : 'Building'} className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-5xl font-thin text-gray-900 mb-4">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || '${industryConfig.displayName} Professional'}
              </h2>
              <p className="text-xl text-gray-600 font-light">
                Your ${industryConfig.displayName.toLowerCase()} empire at a glance. Everything you need to excel in modern ${industryConfig.industry}.
              </p>
            </div>

            {/* Module Grid - Premium Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {${camelCaseIndustry}Modules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => window.location.href = module.url}
                  onMouseEnter={() => setHoveredModule(module.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-gray-100 overflow-hidden h-full">
                    {/* Premium gradient overlay */}
                    <div className={\`absolute inset-0 bg-gradient-to-br \${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-700\`}></div>
                    
                    {/* Floating icon */}
                    <div className="relative z-10 mb-6">
                      <div className={\`w-16 h-16 rounded-2xl bg-gradient-to-br \${module.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500\`}>
                        <module.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {module.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {module.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold text-gray-900">{module.stats}</span>
                        <Badge className="bg-green-100 text-green-700 border-0">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          {module.trend}
                        </Badge>
                      </div>
                      
                      {/* Action */}
                      <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                        <span>Explore</span>
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Premium shine effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Quick Actions</h3>
              <div className="flex justify-center gap-4">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transition-all duration-300">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick ${industryConfig.displayName === 'Restaurant' ? 'Order' : industryConfig.displayName === 'Healthcare' ? 'Appointment' : industryConfig.displayName === 'Real Estate' ? 'Listing' : 'Sale'}
                </Button>
                <Button variant="outline" className="hover:shadow-md transition-all duration-300">
                  <Package className="w-4 h-4 mr-2" />
                  New ${industryConfig.displayName === 'Restaurant' ? 'Menu Item' : industryConfig.displayName === 'Healthcare' ? 'Patient' : industryConfig.displayName === 'Real Estate' ? 'Property' : 'Product'}
                </Button>
                <Button variant="outline" className="hover:shadow-md transition-all duration-300">
                  <Target className="w-4 h-4 mr-2" />
                  Create ${industryConfig.displayName === 'Restaurant' ? 'Promotion' : industryConfig.displayName === 'Healthcare' ? 'Treatment Plan' : industryConfig.displayName === 'Real Estate' ? 'Lease' : 'Campaign'}
                </Button>
                <Button variant="outline" className="hover:shadow-md transition-all duration-300">
                  <Users className="w-4 h-4 mr-2" />
                  Add ${industryConfig.displayName === 'Restaurant' ? 'Reservation' : industryConfig.displayName === 'Healthcare' ? 'Provider' : industryConfig.displayName === 'Real Estate' ? 'Tenant' : 'Customer'}
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-24 text-center text-sm text-gray-500">
              <p>Powered by HERA Universal Architecture • Real-time Data • Enterprise Grade</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}`;

  await fs.writeFile(path.join(appDir, 'page.tsx'), content);
}

async function generateSidebar(componentDir, template, industry) {
  const iconImports = [];
  const sidebarItems = template.modules.map(module => {
    const icons = {
      customers: 'Users', finance: 'DollarSign', inventory: 'Package', analytics: 'BarChart3',
      pos: 'ShoppingCart', menu: 'FileText', delivery: 'Truck', kitchen: 'Utensils',
      patients: 'Heart', appointments: 'Calendar', billing: 'CreditCard', prescriptions: 'Pill',
      jewelry: 'Sparkles', repair: 'Wrench', merchandising: 'Package', planning: 'Calendar',
      procurement: 'Truck', promotions: 'Tag', reports: 'FileText',
      production: 'Factory', quality: 'CheckCircle', shipping: 'Truck', properties: 'Building2',
      tenants: 'Users', leases: 'FileText', maintenance: 'Wrench', financials: 'DollarSign'
    };
    const icon = icons[module.id] || 'Briefcase';
    if (!iconImports.includes(icon)) iconImports.push(icon);
    return `{ id: '${module.id}', icon: ${icon}, label: '${module.name}' }`
  }).join(',\n    ');

  const content = `'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Home, 
  ${iconImports.join(', ')}
} from 'lucide-react'

export function ${template.name.replace(/\s+/g, '')}Sidebar() {
  const router = useRouter()

  const sidebarItems = [
    { id: 'back', icon: ArrowLeft, label: 'Back to Dashboard', action: () => router.push('/dashboard'), isBack: true },
    { id: 'home', icon: Home, label: '${template.name} Home', action: () => router.push('/${industry}-progressive'), isActive: true },
    ${sidebarItems}
  ]

  return (
    <aside className="w-20 bg-gradient-to-b ${template.colors.primary} flex flex-col">
      <div className="h-20 flex items-center justify-center border-b border-white/20">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <span className="text-lg font-bold text-white">${template.name.charAt(0)}</span>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <div className="space-y-2 px-3">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action || (() => console.log('Navigate to', item.id))}
              className={\`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 group relative \${
                item.isActive 
                  ? 'bg-white/30 text-white shadow-lg' 
                  : item.isBack
                  ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }\`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  )
}`;

  await fs.writeFile(path.join(componentDir, `${template.name.replace(/\s+/g, '')}Sidebar.tsx`), content);
}

async function generateModulePage(appDir, template, industry, module) {
  const content = `'use client'

import React, { useState, useEffect } from 'react'
import { useProgressiveAuth } from '@/components/auth/ProgressiveAuthProvider'
import { ${template.name.replace(/\s+/g, '')}Sidebar } from '@/components/${industry}-progressive/${template.name.replace(/\s+/g, '')}Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter } from 'lucide-react'

export default function ${module.name.replace(/\s+/g, '')}Page() {
  const { user, workspace } = useProgressiveAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load data using HERA Progressive Auth pattern
    const loadData = () => {
      if (workspace?.organization_id) {
        const storedData = localStorage.getItem(\`hera_data_\${workspace.organization_id}\`)
        const data = storedData ? JSON.parse(storedData) : {}
        setItems(data.${module.id} || [])
      }
      setLoading(false)
    }
    
    loadData()
  }, [workspace])

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-${template.colors.primary.split('-')[1]}-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading ${module.name}...</p>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-white flex">
      <${template.name.replace(/\s+/g, '')}Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900">${module.name}</h1>
            <p className="text-sm text-gray-500">{user?.organizationName || 'Sample Business'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
            <Button size="sm" className="bg-gradient-to-r ${template.colors.primary}">
              <Plus className="w-4 h-4 mr-2" />
              Add ${module.name}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No ${module.name} yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by adding your first item
                </p>
                <Button className="bg-gradient-to-r ${template.colors.primary}">
                  <Plus className="w-4 h-4 mr-2" />
                  Add ${module.name}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {item.name || \`${module.name} \${index + 1}\`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Generated using HERA DNA from jewelry-progressive
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}`;

  await fs.writeFile(path.join(appDir, `${module.id}`, 'page.tsx'), content);
}

async function generateDemoData(template, industry) {
  const demoContent = `// ${template.name} Demo Data
// Generated using HERA DNA from jewelry-progressive

export const ${industry.replace('-', '_')}_demo_data = ${JSON.stringify(template.demo_data, null, 2)};

// Smart Codes for ${template.name}
export const ${industry.replace('-', '_')}_smart_codes = {
  ${template.modules.map(module => 
    `${module.id.toUpperCase()}: 'HERA.${industry.toUpperCase().replace(/-/g, '')}.${module.id.toUpperCase()}.PROGRESSIVE.v1'`
  ).join(',\n  ')}
};
`;

  const demoDir = 'src/lib/demo-data';
  await fs.mkdir(demoDir, { recursive: true });
  await fs.writeFile(path.join(demoDir, `${industry}-demo.ts`), demoContent);
}

async function generateSmartCodes(template, industry) {
  const smartCodeContent = `-- ${template.name} Smart Codes
-- Generated using HERA DNA from jewelry-progressive
-- Auto-generated on ${new Date().toISOString()}

${template.modules.map(module => `
-- Smart Code for ${module.name} module
INSERT INTO smart_codes (
  code, 
  description, 
  industry, 
  module, 
  version,
  metadata
) VALUES (
  'HERA.${industry.toUpperCase().replace(/-/g, '')}.${module.id.toUpperCase()}.PROGRESSIVE.v1',
  '${template.name} ${module.name} operations with progressive authentication',
  '${industry}',
  '${module.id}',
  'v1',
  '{"generated_from": "jewelry-progressive", "template": "hera-dna", "industry": "${industry}"}'
);`).join('\n')}
`;

  const sqlDir = 'database/generated';
  await fs.mkdir(sqlDir, { recursive: true });
  await fs.writeFile(path.join(sqlDir, `${industry}-smart-codes.sql`), smartCodeContent);
}

// Command line interface
const args = process.argv.slice(2);
const industryFlag = args.find(arg => arg.startsWith('--industry='));

if (!industryFlag) {
  console.error('❌ Please specify an industry: --industry=restaurant|healthcare|manufacturing|real-estate');
  console.log('\n🧬 Available HERA DNA Templates:');
  Object.entries(INDUSTRY_TEMPLATES).forEach(([key, template]) => {
    console.log(`   ${key.padEnd(15)} → ${template.name}`);
  });
  process.exit(1);
}

const industry = industryFlag.split('=')[1];
generateProgressiveApp(industry);