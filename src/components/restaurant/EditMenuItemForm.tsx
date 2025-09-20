'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { X, Check, DollarSign, Clock, Tag, FileText, Plus, Minus, Save } from 'lucide-react'

interface MenuItem {
  id: string
  entity_name: string
  entity_code: string
  description: string
  category: string
  price: number
  prep_time: number
  dietary_tags: string[]
  ingredients: string
  image_url?: string
  status: 'active' | 'inactive'
  popularity: number
}

interface EditMenuItemFormProps {
  item: MenuItem
  onItemUpdated: (item: MenuItem) => void
  onClose: () => void
}

export function EditMenuItemForm({ item, onItemUpdated, onClose }: EditMenuItemFormProps) {
  const [formData, setFormData] = useState({
    entity_name: item.entity_name,
    entity_code: item.entity_code,
    price: item.price.toString(),
    description: item.description,
    category: item.category,
    prep_time: item.prep_time.toString(),
    ingredients: item.ingredients
  })

  const [dietaryTags, setDietaryTags] = useState<string[]>(item.dietary_tags || [])
  const [customCategory, setCustomCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Predefined categories
  const predefinedCategories = [
    'Pizza',
    'Pasta',
    'Salads',
    'Appetizers',
    'Seafood',
    'Meat & Poultry',
    'Desserts',
    'Beverages',
    'Soups',
    'Sandwiches'
  ]

  // Predefined dietary tags
  const availableDietaryTags = [
    'vegetarian',
    'vegan',
    'gluten_free',
    'gluten_free_option',
    'keto_friendly',
    'dairy_free',
    'nut_free',
    'healthy',
    'spicy'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleDietaryTag = (tag: string) => {
    setDietaryTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
  }

  const formatDietaryTag = (tag: string) => {
    return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.entity_name || !formData.price || !formData.category) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      // Create updated item object
      const updatedItem: MenuItem = {
        ...item,
        entity_name: formData.entity_name,
        entity_code: formData.entity_code || `ITEM_${Date.now()}`,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category || customCategory,
        prep_time: parseInt(formData.prep_time) || 15,
        dietary_tags: dietaryTags,
        ingredients: formData.ingredients
      }

      // Call the parent's update handler
      await onItemUpdated(updatedItem)
      onClose()
    } catch (error) {
      console.error('Error updating menu item:', error)
      alert('Failed to update menu item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-background p-6 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 bg-background">
            <h2 className="text-2xl font-bold text-gray-100">Pencil Menu Item</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-muted-foreground bg-background p-1 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-background">
            {/* Basic Information */}
            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="entity_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Item Name *
                  </label>
                  <input
                    id="entity_name"
                    name="entity_name"
                    type="text"
                    value={formData.entity_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Margherita Pizza"
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="entity_code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Item Code
                  </label>
                  <input
                    id="entity_code"
                    name="entity_code"
                    type="text"
                    value={formData.entity_code}
                    onChange={handleInputChange}
                    placeholder="e.g., PIZZA_001"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  placeholder="Describe your dish..."
                />
              </div>
            </div>

            {/* Pricing & Preparation */}
            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200">Pricing & Preparation</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="prep_time"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Prep Time (minutes)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      id="prep_time"
                      name="prep_time"
                      type="number"
                      value={formData.prep_time}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                      placeholder="15"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200">Category *</h3>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {predefinedCategories.map(cat => (
                    <Badge
                      key={cat}
                      variant={formData.category === cat ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>

                {!predefinedCategories.includes(formData.category) && formData.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Custom:</span>
                    <Badge variant="default">{formData.category}</Badge>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or enter custom category"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter' && customCategory) {
                        e.preventDefault()
                        setFormData(prev => ({ ...prev, category: customCategory }))
                        setCustomCategory('')
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCategory) {
                        setFormData(prev => ({ ...prev, category: customCategory }))
                        setCustomCategory('')
                      }
                    }}
                    className="px-3 py-2 border border-border rounded-lg hover:bg-muted bg-background text-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dietary Tags */}
            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200">Dietary Information</h3>

              <div className="flex flex-wrap gap-2">
                {availableDietaryTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={dietaryTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDietaryTag(tag)}
                  >
                    {dietaryTags.includes(tag) && <Check className="w-3 h-3 mr-1" />}
                    {formatDietaryTag(tag)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200">Ingredients</h3>

              <textarea
                id="ingredients"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                placeholder="List main ingredients..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-foreground py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Menu Item
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
