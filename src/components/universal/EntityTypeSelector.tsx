'use client'

/**
 * Entity Type Selector - Module-based entity type switching
 * Smart Code: HERA.UNIVERSAL.ENTITY.TYPE_SELECTOR.v1
 * 
 * Provides a visual interface for selecting entity types organized by modules,
 * similar to TransactionTypeSelector but optimized for master data management
 */

import React, { useState, useMemo } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter,
  Building2,
  Users,
  Package,
  FileText,
  Truck,
  X
} from 'lucide-react'
import { 
  EntityTypeConfig, 
  getAllModules, 
  getModuleEntityTypes,
  getEntityType
} from '@/lib/config/entity-types'

interface EntityTypeSelectorProps {
  selectedModule?: string
  selectedType?: string
  onTypeChange: (module: string, entityType: string) => void
  onModuleChange?: (module: string) => void
  showSearch?: boolean
  showFilter?: boolean
  compact?: boolean
  className?: string
}

interface ModuleInfo {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  entityCount: number
}

// Module metadata
const MODULE_INFO: Record<string, ModuleInfo> = {
  crm: {
    id: 'crm',
    name: 'Customer Relationship',
    description: 'Manage customers, leads, and contacts',
    icon: Users,
    color: '#10B981',
    entityCount: 0
  },
  procurement: {
    id: 'procurement',
    name: 'Procurement',
    description: 'Vendor and supplier management',
    icon: Building2,
    color: '#0070F3',
    entityCount: 0
  },
  inventory: {
    id: 'inventory',
    name: 'Inventory',
    description: 'Products and stock management',
    icon: Package,
    color: '#8B5CF6',
    entityCount: 0
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    description: 'Financial accounts and reporting',
    icon: FileText,
    color: '#F59E0B',
    entityCount: 0
  },
  wms: {
    id: 'wms',
    name: 'Waste Management',
    description: 'Waste collection and management',
    icon: Truck,
    color: '#059669',
    entityCount: 0
  }
}

export function EntityTypeSelector({
  selectedModule = '',
  selectedType = '',
  onTypeChange,
  onModuleChange,
  showSearch = true,
  showFilter = false,
  compact = false,
  className = ''
}: EntityTypeSelectorProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set([selectedModule]))
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchBox, setShowSearchBox] = useState(false)

  // Get available modules and entity types
  const modules = useMemo(() => {
    const moduleIds = getAllModules()
    return moduleIds.map(moduleId => {
      const moduleInfo = MODULE_INFO[moduleId]
      const entityTypes = getModuleEntityTypes(moduleId)
      
      return {
        ...moduleInfo,
        entityCount: entityTypes.length,
        entityTypes
      }
    }).filter(module => module.entityCount > 0)
  }, [])

  // Filter entity types based on search
  const filteredModules = useMemo(() => {
    if (!searchTerm) return modules

    return modules.map(module => ({
      ...module,
      entityTypes: module.entityTypes.filter(entityType =>
        entityType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entityType.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(module => module.entityTypes.length > 0)
  }, [modules, searchTerm])

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)

    if (onModuleChange) {
      onModuleChange(moduleId)
    }
  }

  const handleTypeSelect = (module: string, entityType: string) => {
    onTypeChange(module, entityType)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setShowSearchBox(false)
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-3">
          <select
            value={`${selectedModule}.${selectedType}`}
            onChange={(e) => {
              const [module, type] = e.target.value.split('.')
              if (module && type) {
                onTypeChange(module, type)
              }
            }}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Entity Type</option>
            {modules.map(module => (
              <optgroup key={module.id} label={module.name}>
                {module.entityTypes.map(entityType => (
                  <option
                    key={`${module.id}.${entityType.id}`}
                    value={`${module.id}.${entityType.id}`}
                  >
                    {entityType.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Entity Types</h3>
            <p className="text-sm text-gray-600">Choose the type of entity to create</p>
          </div>
          
          {showSearch && (
            <button
              onClick={() => setShowSearchBox(!showSearchBox)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Search entity types"
            >
              <Search size={18} />
            </button>
          )}
        </div>

        {/* Search box */}
        {showSearchBox && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search entity types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Module list */}
      <div className="p-6">
        <div className="space-y-3">
          {filteredModules.map(module => {
            const ModuleIcon = module.icon
            const isExpanded = expandedModules.has(module.id)
            const isSelected = selectedModule === module.id

            return (
              <div key={module.id} className="space-y-2">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200 text-blue-900'
                      : 'hover:bg-gray-50 border border-transparent text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${module.color}20`,
                        color: module.color 
                      }}
                    >
                      <ModuleIcon size={16} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{module.name}</div>
                      <div className="text-xs text-gray-500">
                        {module.entityCount} entity {module.entityCount === 1 ? 'type' : 'types'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Entity types */}
                {isExpanded && (
                  <div className="ml-4 space-y-1">
                    {module.entityTypes.map(entityType => {
                      const EntityIcon = entityType.icon
                      const isEntitySelected = selectedModule === module.id && selectedType === entityType.id

                      return (
                        <button
                          key={entityType.id}
                          onClick={() => handleTypeSelect(module.id, entityType.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                            isEntitySelected
                              ? 'bg-blue-100 border border-blue-300 text-blue-900 shadow-sm'
                              : 'hover:bg-gray-50 border border-transparent text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                            style={{ 
                              backgroundColor: `${entityType.color}20`,
                              color: entityType.color 
                            }}
                          >
                            <EntityIcon size={12} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{entityType.name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {entityType.description}
                            </div>
                          </div>

                          {isEntitySelected && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* No results */}
        {filteredModules.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <Search size={32} className="mx-auto" />
            </div>
            <p className="text-sm text-gray-600">
              No entity types found for "{searchTerm}"
            </p>
            <button
              onClick={clearSearch}
              className="text-sm text-blue-600 hover:text-blue-700 mt-2"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Quick stats */}
        {!searchTerm && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              {modules.length} modules • {modules.reduce((sum, m) => sum + m.entityCount, 0)} entity types
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EntityTypeSelector