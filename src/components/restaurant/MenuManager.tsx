'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AddMenuItemForm } from './AddMenuItemForm'
import { EditMenuItemForm } from './EditMenuItemForm'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  DollarSign,
  Clock,
  Users,
  Leaf
} from 'lucide-react'

// Menu Item interface (maps to core_entities + core_dynamic_data)
interface MenuItem {
  id: string
  entity_name: string  // Menu item name
  entity_code: string  // Item code (e.g., PIZZA_MARG)
  price: number
  description: string
  category: string
  prep_time: number
  dietary_tags: string[]
  ingredients: string
  image_url?: string
  status: 'active' | 'inactive'
  popularity: number
}

export function MenuManager() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showAddItemForm, setShowAddItemForm] = useState(false)

  // Load menu items from Universal API
  const loadMenuItems = async () => {
    try {
      setIsLoadingMenu(true)
      const response = await fetch('/api/v1/entities?entity_type=menu_item&include_dynamic=true')
      const result = await response.json()
      
      if (result.success) {
        // Transform universal entity format to menu item format
        const transformedItems = result.data.map((entity: any) => ({
          id: entity.id,
          entity_name: entity.entity_name,
          entity_code: entity.entity_code,
          status: entity.status,
          created_at: entity.created_at,
          updated_at: entity.updated_at,
          // Properties from dynamic data
          price: entity.properties?.price || 0,
          description: entity.properties?.description || '',
          category: entity.properties?.category || 'Other',
          prep_time: entity.properties?.prep_time || 0,
          dietary_tags: entity.properties?.dietary_tags || [],
          ingredients: entity.properties?.ingredients || '',
          popularity: entity.properties?.popularity || 0,
          image_url: entity.properties?.image_url || null
        }))
        setMenuItems(transformedItems)
      } else {
        console.error('Failed to load menu items:', result.message)
      }
    } catch (error) {
      console.error('Error loading menu items:', error)
    } finally {
      setIsLoadingMenu(false)
    }
  }

  // Delete menu item using Universal API
  const handleDeleteItem = async (itemId: string) => {
    console.log('Delete clicked for item:', itemId)
    
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/entities?id=${itemId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Remove from local state
        setMenuItems(menuItems.filter(item => item.id !== itemId))
      } else {
        console.error('Failed to delete menu item:', result.message)
        alert('Failed to delete menu item')
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('Error deleting menu item')
    }
  }

  // Update menu item using Universal API
  const handleUpdateItem = async (updatedItem: MenuItem) => {
    try {
      const response = await fetch('/api/v1/entities', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: updatedItem.id,
          entity_name: updatedItem.entity_name,
          entity_code: updatedItem.entity_code,
          status: updatedItem.status,
          properties: {
            price: updatedItem.price,
            description: updatedItem.description,
            category: updatedItem.category,
            prep_time: updatedItem.prep_time,
            dietary_tags: updatedItem.dietary_tags,
            ingredients: updatedItem.ingredients,
            popularity: updatedItem.popularity,
            image_url: updatedItem.image_url
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update local state
        setMenuItems(menuItems.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ))
        setEditingItem(null)
      } else {
        console.error('Failed to update menu item:', result.message)
        alert('Failed to update menu item')
      }
    } catch (error) {
      console.error('Error updating menu item:', error)
      alert('Error updating menu item')
    }
  }

  useEffect(() => {
    loadMenuItems()
  }, [])

  // Get unique categories for filter
  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))]

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getDietaryTagColor = (tag: string) => {
    switch (tag) {  
      case 'vegetarian': return 'bg-green-100 text-green-800'
      case 'vegan': return 'bg-green-200 text-green-900' 
      case 'gluten_free': return 'bg-blue-100 text-blue-800'
      case 'gluten_free_option': return 'bg-blue-50 text-blue-700'
      case 'keto_friendly': return 'bg-purple-100 text-purple-800'
      case 'healthy': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDietaryTag = (tag: string) => {
    return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Management</h1>
        <p className="text-gray-600">
          Manage your restaurant menu using HERA's universal entity system
        </p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 flex gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Add New Item */}
          <Button 
            onClick={() => setShowAddItemForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {isLoadingMenu ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Item Header */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.entity_name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Code: {item.entity_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">
                {item.description}
              </p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.prep_time} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{item.popularity}% liked</span>
                </div>
              </div>

              {/* Dietary Tags */}
              {item.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.dietary_tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      className={`text-xs ${getDietaryTagColor(tag)}`}
                    >
                      <Leaf className="w-3 h-3 mr-1" />
                      {formatDietaryTag(tag)}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Category Badge */}
              <div className="mb-4">
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              </div>

              {/* Ingredients */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
                <p className="text-xs text-gray-700">
                  {item.ingredients}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Edit button clicked for:', item.entity_name)
                    setEditingItem(item)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 hover:text-red-700 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Delete button clicked for:', item.entity_name)
                    handleDeleteItem(item.id)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms or filters
              </p>
              <Button variant="outline">
                Clear Filters
              </Button>
            </Card>
          )}
        </>
      )}

      {/* HERA Universal Architecture Info */}
      <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Universal Architecture in Action
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            This menu system demonstrates HERA's universal 6-table architecture:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-blue-700">
            <div className="bg-white/50 p-3 rounded-lg">
              <strong>core_entities</strong><br />
              Menu items stored as entities with type "menu_item"
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <strong>core_dynamic_data</strong><br />
              Price, ingredients, dietary tags as flexible fields
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <strong>core_relationships</strong><br />
              Recipe ingredients linked to inventory items
            </div>
          </div>
        </div>
      </Card>

      {/* Add Menu Item Form Modal */}
      {showAddItemForm && (
        <AddMenuItemForm
          onItemAdded={() => {
            loadMenuItems() // Refresh menu items list
          }}
          onClose={() => setShowAddItemForm(false)}
        />
      )}

      {/* Edit Menu Item Form Modal */}
      {editingItem && (
        <EditMenuItemForm
          item={editingItem}
          onItemUpdated={handleUpdateItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}