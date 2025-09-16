'use client'

import React, { useState } from 'react'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Badge } from '@/src/components/ui/badge'
import { X, Check, DollarSign, Clock, Tag, FileText, Plus, Minus } from 'lucide-react'

interface AddMenuItemFormProps {
  onItemAdded: () => void
  onClose: () => void
}

export function AddMenuItemForm({ onItemAdded, onClose }: AddMenuItemFormProps) {
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    price: '',
    description: '',
    category: '',
    prep_time: '',
    ingredients: ''
  })

  const [dietaryTags, setDietaryTags] = useState<string[]>([])
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleDietaryTag = (tag: string) => {
    setDietaryTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
  }

  const formatDietaryTag = (tag: string) => {
    return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getDietaryTagColor = (tag: string) => {
    switch (tag) {
      case 'vegetarian':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'vegan':
        return 'bg-green-200 text-green-900 border-green-400'
      case 'gluten_free':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'gluten_free_option':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'keto_friendly':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'healthy':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'spicy':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-muted text-gray-200 border-border'
    }
  }

  // Generate entity code from name
  const generateEntityCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20)
  }

  // Auto-generate entity code when name changes
  React.useEffect(() => {
    if (formData.entity_name && !formData.entity_code) {
      setFormData(prev => ({
        ...prev,
        entity_code: generateEntityCode(prev.entity_name)
      }))
    }
  }, [formData.entity_name])

  const validateForm = () => {
    const required = ['entity_name', 'price', 'description', 'category', 'prep_time', 'ingredients']
    const missing = required.filter(field => !formData[field as keyof typeof formData])

    if (missing.length > 0) {
      alert(`Please fill in all required fields: ${missing.join(', ')}`)
      return false
    }

    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      alert('Please enter a valid price')
      return false
    }

    if (isNaN(Number(formData.prep_time)) || Number(formData.prep_time) <= 0) {
      alert('Please enter a valid preparation time')
      return false
    }

    return true
  }

  const submitMenuItem = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const finalCategory = customCategory || formData.category

      const menuItemData = {
        entity_type: 'menu_item',
        entity_name: formData.entity_name,
        entity_code: formData.entity_code || generateEntityCode(formData.entity_name),
        entity_category: finalCategory,
        description: formData.description,
        status: 'active',
        properties: {
          price: Number(formData.price),
          description: formData.description,
          category: finalCategory,
          prep_time: Number(formData.prep_time),
          dietary_tags: dietaryTags,
          ingredients: formData.ingredients,
          popularity: 0
        }
      }

      const response = await fetch('/api/v1/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(menuItemData)
      })

      const result = await response.json()

      if (result.success) {
        alert(`Menu item "${formData.entity_name}" added successfully!`)
        onItemAdded()
        onClose()
      } else {
        alert(`Failed to add menu item: ${result.message}`)
      }
    } catch (error) {
      console.error('Error adding menu item:', error)
      alert('Error adding menu item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-100">Add New Menu Item</h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Item Name *
                  </Label>
                  <Input
                    placeholder="e.g., Margherita Pizza"
                    value={formData.entity_name}
                    onChange={e => handleInputChange('entity_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Item Code *
                  </Label>
                  <Input
                    placeholder="e.g., PIZZA_MARG"
                    value={formData.entity_code}
                    onChange={e => handleInputChange('entity_code', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Price ($) *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="18.50"
                      value={formData.price}
                      onChange={e => handleInputChange('price', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Prep Time (minutes) *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="number"
                      placeholder="15"
                      value={formData.prep_time}
                      onChange={e => handleInputChange('prep_time', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description *
                </Label>
                <textarea
                  placeholder="Describe your menu item..."
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
                  rows={3}
                />
              </div>
            </Card>

            {/* Category */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Category</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Category *
                  </Label>
                  <select
                    value={formData.category}
                    onChange={e => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  >
                    <option value="">Select a category...</option>
                    {predefinedCategories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="custom">Custom Category</option>
                  </select>
                </div>

                {formData.category === 'custom' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Custom Category Name
                    </Label>
                    <Input
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Dietary Tags */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Dietary Tags</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableDietaryTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDietaryTag(tag)}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                      dietaryTags.includes(tag)
                        ? getDietaryTagColor(tag)
                        : 'bg-muted text-gray-700 border-border hover:bg-muted'
                    }`}
                  >
                    {formatDietaryTag(tag)}
                  </button>
                ))}
              </div>

              {dietaryTags.length > 0 && (
                <div className="mt-3">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Selected Tags:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {dietaryTags.map(tag => (
                      <Badge key={tag} className={`text-xs ${getDietaryTagColor(tag)}`}>
                        {formatDietaryTag(tag)}
                        <button
                          onClick={() => toggleDietaryTag(tag)}
                          className="ml-1 hover:bg-background hover:bg-opacity-20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Ingredients */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Ingredients</h3>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ingredients List *
                </Label>
                <textarea
                  placeholder="List main ingredients (e.g., Tomato sauce, fresh mozzarella, basil, olive oil)"
                  value={formData.ingredients}
                  onChange={e => handleInputChange('ingredients', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
                  rows={3}
                />
              </div>
            </Card>

            {/* Preview */}
            {formData.entity_name && (
              <Card className="p-4 bg-muted">
                <h3 className="text-lg font-medium text-gray-100 mb-4">Preview</h3>
                <div className="bg-background p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-100">{formData.entity_name}</h4>
                    <span className="text-lg font-bold text-green-600">
                      ${formData.price || '0.00'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{formData.description}</p>
                  <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formData.prep_time || '0'} min</span>
                    </div>
                    {(customCategory || formData.category) && (
                      <Badge variant="outline" className="text-xs">
                        {customCategory || formData.category}
                      </Badge>
                    )}
                  </div>
                  {dietaryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {dietaryTags.map(tag => (
                        <Badge key={tag} className={`text-xs ${getDietaryTagColor(tag)}`}>
                          {formatDietaryTag(tag)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {formData.ingredients && (
                    <p className="text-xs text-gray-700">
                      <strong>Ingredients:</strong> {formData.ingredients}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={submitMenuItem}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  'Adding Item...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Add Menu Item
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
