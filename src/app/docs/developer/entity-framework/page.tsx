'use client'

import Link from 'next/link'
import {
  Database,
  Code,
  Layers,
  Zap,
  Shield,
  Sparkles,
  GitBranch,
  Settings,
  FileCode,
  Package,
  ArrowLeft,
  BookOpen,
  Terminal,
  Workflow
} from 'lucide-react'

export default function EntityFrameworkDocs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/docs/developer" className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-blue-200">Back to Portal</span>
              </Link>
              <div className="flex items-center gap-2">
                <Database className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-white">Universal Entity Framework</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Universal Entity Framework
          </h1>
          <p className="text-xl text-blue-200 max-w-4xl mx-auto mb-8">
            Revolutionary preset-driven entity management system that transforms 500+ lines of custom CRUD code 
            into 12 lines of configuration. Built on HERA's Sacred Six tables with complete type safety, 
            role-based permissions, and automatic diagram generation.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="px-4 py-2 bg-green-600/20 border border-green-500/50 rounded-lg">
              <span className="text-green-200">Status</span>
              <span className="ml-2 text-white font-semibold">✅ Production Ready</span>
            </div>
            <div className="px-4 py-2 bg-blue-600/20 border border-blue-500/50 rounded-lg">
              <span className="text-blue-200">Savings</span>
              <span className="ml-2 text-white font-semibold">95% Code Reduction</span>
            </div>
            <div className="px-4 py-2 bg-purple-600/20 border border-purple-500/50 rounded-lg">
              <span className="text-purple-200">Coverage</span>
              <span className="ml-2 text-white font-semibold">9 Entity Types</span>
            </div>
          </div>
        </section>

        {/* Architecture Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Architecture Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Entity Presets */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">Entity Presets</h3>
              </div>
              <p className="text-blue-200 mb-4">
                Configuration-driven entity definitions with dynamic fields, relationships, and permissions.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-blue-200">Dynamic Fields System</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-blue-200">Smart Code Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-blue-200">Role-based Permissions</span>
                </div>
              </div>
            </div>

            {/* Universal API */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Code className="h-6 w-6 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">Universal API</h3>
              </div>
              <p className="text-blue-200 mb-4">
                Single API endpoint handles all entity operations with automatic validation and relationships.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-blue-200">CRUD Operations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-blue-200">Relationship Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-blue-200">Type Safety</span>
                </div>
              </div>
            </div>

            {/* Universal UI */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-green-400" />
                <h3 className="text-xl font-semibold text-white">Universal UI</h3>
              </div>
              <p className="text-blue-200 mb-4">
                Auto-generated forms, tables, and CRUD interfaces from entity preset configuration.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-blue-200">EntityPage Component</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-blue-200">Dynamic Forms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-blue-200">Smart Tables</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Before vs After */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Revolutionary Impact</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Before */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">❌</span>
                <h3 className="text-xl font-semibold text-white">Traditional Approach</h3>
              </div>
              <div className="space-y-3 text-blue-200">
                <div className="flex justify-between">
                  <span>Custom Page Creation:</span>
                  <span className="text-red-400 font-semibold">500+ lines</span>
                </div>
                <div className="flex justify-between">
                  <span>Development Time:</span>
                  <span className="text-red-400 font-semibold">2-3 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Validation Code:</span>
                  <span className="text-red-400 font-semibold">Manual per field</span>
                </div>
                <div className="flex justify-between">
                  <span>Permissions:</span>
                  <span className="text-red-400 font-semibold">Hardcoded</span>
                </div>
                <div className="flex justify-between">
                  <span>API Integration:</span>
                  <span className="text-red-400 font-semibold">Custom hooks</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance:</span>
                  <span className="text-red-400 font-semibold">High complexity</span>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">✅</span>
                <h3 className="text-xl font-semibold text-white">Universal Framework</h3>
              </div>
              <div className="space-y-3 text-blue-200">
                <div className="flex justify-between">
                  <span>Page Creation:</span>
                  <span className="text-green-400 font-semibold">12 lines config</span>
                </div>
                <div className="flex justify-between">
                  <span>Development Time:</span>
                  <span className="text-green-400 font-semibold">30 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Validation:</span>
                  <span className="text-green-400 font-semibold">Auto-generated</span>
                </div>
                <div className="flex justify-between">
                  <span>Permissions:</span>
                  <span className="text-green-400 font-semibold">Role-based preset</span>
                </div>
                <div className="flex justify-between">
                  <span>API Integration:</span>
                  <span className="text-green-400 font-semibold">Universal hook</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance:</span>
                  <span className="text-green-400 font-semibold">Zero effort</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Implementation Sections */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Implementation Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Entity Presets */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileCode className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">1. Entity Presets</h3>
              </div>
              <p className="text-blue-200 text-sm mb-4">
                Define your entity structure with dynamic fields, relationships, and permissions.
              </p>
              <div className="bg-black/30 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
                <div>export const PRODUCT_PRESET = {'{}'}</div>
                <div className="pl-2">entity_type: 'PRODUCT',</div>
                <div className="pl-2">dynamicFields: [...],</div>
                <div className="pl-2">relationships: [...],</div>
                <div className="pl-2">permissions: {'{}'}...</div>
                <div>{'}'}</div>
              </div>
            </div>

            {/* Universal Hook */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Code className="h-6 w-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">2. Universal Hook</h3>
              </div>
              <p className="text-blue-200 text-sm mb-4">
                Single hook handles all entity operations with complete type safety.
              </p>
              <div className="bg-black/30 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
                <div>const products = useUniversalEntity({'{'}PRODUCT_PRESET{'}'});)</div>
                <div className="mt-1">// Auto: CRUD, validation, permissions</div>
              </div>
            </div>

            {/* Universal UI */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-6 w-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">3. Universal UI</h3>
              </div>
              <p className="text-blue-200 text-sm mb-4">
                Complete CRUD interface generated from preset configuration.
              </p>
              <div className="bg-black/30 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
                <div>{'<EntityPage'}</div>
                <div className="pl-2">preset={'{PRODUCT_PRESET}'}</div>
                <div className="pl-2">userRole={'{userRole}'}</div>
                <div className="pl-2">title="Products"</div>
                <div>{'/>'}</div>
              </div>
            </div>

            {/* Visual Diagrams */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <GitBranch className="h-6 w-6 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">4. Auto Diagrams</h3>
              </div>
              <p className="text-blue-200 text-sm mb-4">
                Automatic Mermaid diagram generation showing entity relationships.
              </p>
              <div className="bg-black/30 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
                <div>npm run docs:diagrams</div>
                <div className="mt-1"># Generates individual entity diagrams</div>
                <div className="mt-1">npm run docs:global-graph</div>
                <div className="mt-1"># Generates relationship map</div>
              </div>
            </div>

            {/* Testing */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">5. Testing</h3>
              </div>
              <p className="text-blue-200 text-sm mb-4">
                Comprehensive validation and permission testing included.
              </p>
              <div className="bg-black/30 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
                <div>validateDynamicFields(preset, values)</div>
                <div className="mt-1">// Returns: {'{valid, errors}'}</div>
              </div>
            </div>

            {/* Documentation */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-6 w-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">6. Documentation</h3>
              </div>
              <p className="text-blue-200 text-sm mb-4">
                Self-documenting system with visual architecture diagrams.
              </p>
              <div className="bg-black/30 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
                <div>npm run docs:all-diagrams</div>
                <div className="mt-1"># Complete visual documentation</div>
              </div>
            </div>
          </div>
        </section>

        {/* Entity Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Supported Entity Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'PRODUCT', fields: '7 fields, 3 rels', description: 'Physical items with pricing & inventory' },
              { name: 'SERVICE', fields: '5 fields, 3 rels', description: 'Salon treatments with duration & commission' },
              { name: 'CUSTOMER', fields: '7 fields, 2 rels', description: 'Customer profiles with loyalty tracking' },
              { name: 'EMPLOYEE', fields: '6 fields, 3 rels', description: 'Staff with roles & capabilities' },
              { name: 'APPOINTMENT', fields: '5 fields, 3 rels', description: 'Scheduling with customer/service links' },
              { name: 'VENDOR', fields: '6 fields, 1 rels', description: 'Suppliers with payment terms' },
              { name: 'CATEGORY', fields: '4 fields, 1 rels', description: 'Hierarchical organization system' },
              { name: 'BRAND', fields: '3 fields, 1 rels', description: 'Product manufacturers & providers' },
              { name: 'ROLE', fields: '3 fields, 0 rels', description: 'Permission sets & capabilities' }
            ].map((entity, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Database className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{entity.name}</h3>
                    <p className="text-xs text-blue-300">{entity.fields}</p>
                  </div>
                </div>
                <p className="text-sm text-blue-200">{entity.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Code Examples</h2>
          
          {/* Complete Example */}
          <div className="bg-black/30 rounded-xl border border-white/20 p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-green-400" />
              Complete Product Management Page
            </h3>
            <div className="bg-black/50 rounded-lg p-4 text-sm font-mono overflow-x-auto">
              <div className="text-gray-400 mb-2">// src/app/salon/products-universal/page.tsx</div>
              <div className="text-blue-400">{'\'use client\''}</div>
              <div className="mt-2 text-gray-400">import {'{ EntityPage }'} from {'\'@/components/entity/EntityPage\''}</div>
              <div className="text-gray-400">import {'{ PRODUCT_PRESET }'} from {'\'@/hooks/entityPresets\''}</div>
              <div className="text-gray-400">import {'{ useHERAAuth }'} from {'\'@/components/auth/HERAAuthProvider\''}</div>
              <div className="mt-4 text-purple-400">export default function</div> <div className="text-yellow-400">ProductsUniversalPage</div><div className="text-white">() {'{'}</div>
              <div className="pl-2 text-gray-400">const {'{ userRole = \'staff\' }'} = <div className="text-blue-400">useHERAAuth</div>() ?? {'{}'}</div>
              <div className="mt-2 pl-2 text-purple-400">return</div> <div className="text-white">(</div>
              <div className="pl-4 text-red-400">{'<EntityPage'}</div>
              <div className="pl-6 text-green-400">preset={'{PRODUCT_PRESET}'}</div>
              <div className="pl-6 text-green-400">userRole={'{userRole}'}</div>
              <div className="pl-6 text-green-400">title=<div className="text-orange-400">"Product Management"</div></div>
              <div className="pl-6 text-green-400">subtitle=<div className="text-orange-400">"Manage your salon\'s product inventory"</div></div>
              <div className="pl-4 text-red-400">{'/>'}</div>
              <div className="pl-2 text-white">)</div>
              <div className="text-white">{'}'}</div>
              <div className="mt-4 text-gray-400">{'// Total: 12 lines vs 500+ traditional'}</div>
            </div>
          </div>

          {/* Preset Configuration */}
          <div className="bg-black/30 rounded-xl border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-400" />
              Entity Preset Configuration
            </h3>
            <div className="bg-black/50 rounded-lg p-4 text-sm font-mono overflow-x-auto">
              <div className="text-gray-400 mb-2">// src/hooks/entityPresets.ts</div>
              <div className="text-purple-400">export const</div> <div className="text-yellow-400">PRODUCT_PRESET</div> <div className="text-white">= {'{'}</div>
              <div className="pl-2 text-green-400">entity_type: <div className="text-orange-400">'PRODUCT'</div>,</div>
              <div className="pl-2 text-green-400">labels: {'{'}</div>
              <div className="pl-4 text-green-400">singular: <div className="text-orange-400">'Product'</div>,</div>
              <div className="pl-4 text-green-400">plural: <div className="text-orange-400">'Products'</div></div>
              <div className="pl-2 text-white">{'},'}</div>
              <div className="pl-2 text-green-400">permissions: {'{'}</div>
              <div className="pl-4 text-green-400">create: <div className="text-blue-400">(role: Role) => ['owner', 'manager'].includes(role)</div>,</div>
              <div className="pl-4 text-green-400">edit: <div className="text-blue-400">(role: Role) => ['owner', 'manager', 'receptionist'].includes(role)</div>,</div>
              <div className="pl-4 text-green-400">delete: <div className="text-blue-400">(role: Role) => ['owner', 'manager'].includes(role)</div>,</div>
              <div className="pl-4 text-green-400">view: <div className="text-blue-400">() => true</div></div>
              <div className="pl-2 text-white">{'},'}</div>
              <div className="pl-2 text-green-400">dynamicFields: [</div>
              <div className="pl-4 text-white">{'{'}</div>
              <div className="pl-6 text-green-400">name: <div className="text-orange-400">'price_market'</div>,</div>
              <div className="pl-6 text-green-400">type: <div className="text-orange-400">'number'</div>,</div>
              <div className="pl-6 text-green-400">smart_code: <div className="text-orange-400">'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1'</div>,</div>
              <div className="pl-6 text-green-400">required: <div className="text-blue-400">true</div></div>
              <div className="pl-4 text-white">{'},'}</div>
              <div className="pl-4 text-gray-400">// ... more fields</div>
              <div className="pl-2 text-white">],</div>
              <div className="pl-2 text-green-400">relationships: [</div>
              <div className="pl-4 text-white">{'{'}</div>
              <div className="pl-6 text-green-400">type: <div className="text-orange-400">'HAS_CATEGORY'</div>,</div>
              <div className="pl-6 text-green-400">smart_code: <div className="text-orange-400">'HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1'</div>,</div>
              <div className="pl-6 text-green-400">cardinality: <div className="text-orange-400">'one'</div></div>
              <div className="pl-4 text-white">{'},'}</div>
              <div className="pl-4 text-gray-400">// ... more relationships</div>
              <div className="pl-2 text-white">]</div>
              <div className="text-white">{'}'}</div>
            </div>
          </div>
        </section>

        {/* Visual Documentation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Visual Documentation</h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Workflow className="h-6 w-6 text-green-400" />
              <h3 className="text-xl font-semibold text-white">Automatic Diagram Generation</h3>
            </div>
            <p className="text-blue-200 mb-6">
              The framework automatically generates comprehensive Mermaid diagrams showing entity structures, 
              relationships, and the complete system architecture. These diagrams update automatically when 
              your presets change, ensuring documentation is always current.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Generated Diagrams:</h4>
                <ul className="space-y-2 text-blue-200">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Individual entity diagrams (9 entities)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Global relationship map
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    HERA 6-table architecture
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Smart code integration
                  </li>
                </ul>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-2">Generation Commands:</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="text-green-400">npm run docs:diagrams</div>
                  <div className="text-gray-400"># Individual entity diagrams</div>
                  <div className="text-green-400 mt-2">npm run docs:global-graph</div>
                  <div className="text-gray-400"># Global relationship map</div>
                  <div className="text-green-400 mt-2">npm run docs:all-diagrams</div>
                  <div className="text-gray-400"># All diagrams at once</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Key Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center mt-1">
                  <Zap className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">95% Code Reduction</h3>
                  <p className="text-blue-200 text-sm">Transform 500+ lines of custom CRUD code into 12 lines of configuration</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center mt-1">
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Type Safety</h3>
                  <p className="text-blue-200 text-sm">Complete TypeScript integration with auto-generated types</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center mt-1">
                  <Settings className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Role-based Permissions</h3>
                  <p className="text-blue-200 text-sm">Granular access control at field and operation level</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center mt-1">
                  <Database className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Universal Architecture</h3>
                  <p className="text-blue-200 text-sm">Built on HERA's Sacred Six tables with zero schema changes</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center mt-1">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Auto Documentation</h3>
                  <p className="text-blue-200 text-sm">Self-updating visual diagrams and comprehensive documentation</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center mt-1">
                  <GitBranch className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Smart Code Integration</h3>
                  <p className="text-blue-200 text-sm">Automatic business intelligence and relationship detection</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center py-8 border-t border-white/10">
          <p className="text-blue-200 mb-4">
            The Universal Entity Framework proves that HERA's revolutionary architecture can eliminate 
            enterprise software complexity while maintaining complete functionality and type safety.
          </p>
          <Link
            href="/docs/developer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Developer Portal
          </Link>
        </section>
      </div>
    </div>
  )
}