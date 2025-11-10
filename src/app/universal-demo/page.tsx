'use client'

/**
 * Universal Entity Dynamic System Demo
 * Shows all access points and functionality for the HERA Universal Entity system
 * Created for demonstration of the complete Universal Entity Dynamic architecture
 */

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Database, 
  Layers, 
  Zap, 
  Brain, 
  Settings,
  ArrowRight,
  Building2,
  Truck,
  Users,
  Package,
  Route,
  Trash,
  User
} from 'lucide-react'

export default function UniversalEntityDemoPage() {
  const router = useRouter()

  const universalEntityComponents = [
    {
      title: "Universal Entity Builder",
      description: "Complete entity creation wizard with AI assistance and validation",
      path: "/enterprise/universal/entities",
      icon: <Layers className="w-5 h-5" />,
      color: "bg-blue-500",
      features: [
        "Dynamic form generation based on entity type",
        "Real-time validation and Smart Code generation",
        "AI-powered insights and auto-completion",
        "Relationship management",
        "Three-panel interface with progress tracking"
      ]
    },
    {
      title: "Universal Entity List Manager", 
      description: "Dynamic list views with filtering, sorting, and bulk operations",
      path: "/enterprise/universal/entities/list",
      icon: <Database className="w-5 h-5" />,
      color: "bg-green-500",
      features: [
        "Configurable list columns based on metadata",
        "Advanced filtering and search capabilities",
        "Bulk operations (delete, export, edit)",
        "Real-time data switching (HERA DB ↔ Mock data)",
        "Responsive design with mobile optimization"
      ]
    },
    {
      title: "Universal Entity Hook System",
      description: "React hooks for entity management with RPC integration",
      path: "/src/hooks/useUniversalEntityV1.ts",
      icon: <Zap className="w-5 h-5" />,
      color: "bg-purple-500",
      features: [
        "useUniversalEntityV1 - RPC-based CRUD operations",
        "Atomic transactions with hera_entities_crud_v1",
        "Real-time query invalidation",
        "Dynamic field management",
        "Relationship handling"
      ]
    },
    {
      title: "Entity Builder Core",
      description: "Self-assembling entity handler with UCR rule validation",
      path: "/src/lib/universal/entity-builder.ts",
      icon: <Brain className="w-5 h-5" />,
      color: "bg-amber-500",
      features: [
        "Dynamic Zod schema generation from UCR rules",
        "Field validation and type inference",
        "Smart Code pattern enforcement",
        "Procedure orchestration",
        "Dynamic field storage in core_dynamic_data"
      ]
    },
    {
      title: "Universal Entity Shell",
      description: "Foundation component for all entity management interfaces",
      path: "/src/components/universal/UniversalEntityShell.tsx",
      icon: <Settings className="w-5 h-5" />,
      color: "bg-rose-500",
      features: [
        "Three-panel responsive layout",
        "AI assistant panel integration",
        "Breadcrumb navigation",
        "Auto-save functionality",
        "Mobile-first design with touch optimization"
      ]
    }
  ]

  const wmsEntityTypes = [
    {
      type: 'vehicle',
      name: 'Vehicles',
      icon: <Truck className="w-4 h-4" />,
      description: 'Waste collection vehicles',
      smartCode: 'HERA.WMS.ENTITY.VEHICLE.v1'
    },
    {
      type: 'driver',
      name: 'Drivers',
      icon: <User className="w-4 h-4" />,
      description: 'Vehicle operators',
      smartCode: 'HERA.WMS.ENTITY.DRIVER.v1'
    },
    {
      type: 'customer',
      name: 'Customers',
      icon: <Building2 className="w-4 h-4" />,
      description: 'Service customers',
      smartCode: 'HERA.WMS.ENTITY.CUSTOMER.v1'
    },
    {
      type: 'route',
      name: 'Routes',
      icon: <Route className="w-4 h-4" />,
      description: 'Collection routes',
      smartCode: 'HERA.WMS.ENTITY.ROUTE.v1'
    },
    {
      type: 'waste_type',
      name: 'Waste Types',
      icon: <Trash className="w-4 h-4" />,
      description: 'Waste classifications',
      smartCode: 'HERA.WMS.ENTITY.WASTE_TYPE.v1'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Universal Entity Dynamic System</h1>
              <p className="text-gray-600">Complete demonstration of HERA's metadata-driven entity management</p>
            </div>
            <Link
              href="/enterprise"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Back to Enterprise
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* System Overview */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Architecture Overview</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What is Universal Entity Dynamic?</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                A metadata-driven entity management system that automatically generates UI components, 
                validation rules, and database operations based on Smart Code definitions. No hardcoded 
                forms or tables - everything is configured through metadata.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Database className="w-4 h-4 text-blue-600" />
                  Powered by HERA Sacred Six architecture
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Zap className="w-4 h-4 text-purple-600" />
                  RPC-based operations with hera_entities_crud_v1
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Brain className="w-4 h-4 text-amber-600" />
                  AI-powered Smart Code generation
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Key Benefits</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 🚀 <strong>Zero Code Entity Creation</strong> - Define metadata, get full CRUD</li>
                <li>• 🎯 <strong>Smart Code Integration</strong> - Automatic HERA DNA compliance</li>
                <li>• 📱 <strong>Mobile-First UI</strong> - Responsive components out of the box</li>
                <li>• 🔄 <strong>Real-time Sync</strong> - Live data updates with React Query</li>
                <li>• 🛡️ <strong>Enterprise Security</strong> - Organization isolation built-in</li>
                <li>• 📊 <strong>Rich Relationships</strong> - Complex entity relationships supported</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Universal Entity Components */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Universal Entity Components</h2>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {universalEntityComponents.map((component, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-lg overflow-hidden hover:shadow-xl transition-all">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${component.color} p-3 rounded-lg text-white flex-shrink-0`}>
                      {component.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{component.title}</h3>
                      <p className="text-sm text-gray-600">{component.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {component.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <ArrowRight className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {component.path.startsWith('/') && !component.path.startsWith('/src') ? (
                    <Link
                      href={component.path}
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Open Component <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-500 font-mono">{component.path}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WMS Entity Examples */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Live WMS Entity Examples</h2>
          <p className="text-gray-600">
            These entities were created using the Universal Entity Dynamic system for the Waste Management System.
            Each entity demonstrates different aspects of the metadata-driven approach.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wmsEntityTypes.map((entity, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-lg p-4 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {entity.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{entity.name}</h3>
                    <p className="text-xs text-gray-600">{entity.description}</p>
                  </div>
                </div>
                
                <div className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1 mb-3">
                  {entity.smartCode}
                </div>
                
                <div className="flex gap-2">
                  <Link
                    href={`/enterprise/universal/entities/list?module=wms&type=${entity.type}`}
                    className="flex-1 text-center py-2 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    View List
                  </Link>
                  <Link
                    href={`/enterprise/universal/entities?module=wms&type=${entity.type}`}
                    className="flex-1 text-center py-2 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Create New
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access Links */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Quick Access - Universal Entity Dynamic System</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/enterprise/universal/entities?module=wms&type=vehicle"
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-all text-center"
            >
              <Layers className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Entity Builder</div>
              <div className="text-xs opacity-75">Create WMS Vehicle</div>
            </Link>
            
            <Link
              href="/enterprise/universal/entities/list?module=wms&type=customer"
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-all text-center"
            >
              <Database className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Entity List</div>
              <div className="text-xs opacity-75">Manage Customers</div>
            </Link>
            
            <Link
              href="/waste-management"
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-all text-center"
            >
              <Truck className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">WMS Dashboard</div>
              <div className="text-xs opacity-75">Main System</div>
            </Link>
            
            <Link
              href="/enterprise"
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-all text-center"
            >
              <Building2 className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Enterprise Hub</div>
              <div className="text-xs opacity-75">All Modules</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}