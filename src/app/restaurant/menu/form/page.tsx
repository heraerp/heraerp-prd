'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  StatusIndicator,
  FloatingNotification,
  GlowButton
} from '@/components/restaurant/JobsStyleMicroInteractions'
import { 
  Utensils, ChefHat, DollarSign, ArrowLeft, Save, Sparkles,
  Plus, Minus, AlertTriangle, CheckCircle, Brain, Zap,
  Clock, Users, Package, Coffee, Pizza, Salad, IceCream, Wine
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * 🍽️ HERA Universal Menu Item Creation Form
 * Revolutionary Restaurant Management using HERA's 6-Table Architecture
 * 
 * Steve Jobs: "Design is not just what it looks like - it's how it works"
 * Simple Menu Creation That Drives Profit
 */

export default function MenuFormPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  
  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Form state
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    description: '',
    price: '',
    prep_time_minutes: '',
    category: '',
    dietary_tags: [],
    allergens: [],
    ingredients: [],
    meal_times: [],
    locations: ['main_dining']
  })

  // AI Enhancement state
  const [aiSuggestions, setAiSuggestions] = useState({
    category: '',
    dietary_tags: [],
    allergens: [],
    pricing_suggestion: 0,
    description_enhanced: ''
  })

  // Available options
  const categories = [
    { id: 'italian_classics', name: 'Italian Classics', icon: Pizza },
    { id: 'appetizers', name: 'Appetizers', icon: Package },
    { id: 'salads', name: 'Fresh Salads', icon: Salad },
    { id: 'desserts', name: 'Desserts', icon: IceCream },
    { id: 'beverages', name: 'Beverages', icon: Coffee },
    { id: 'wine', name: 'Wine & Spirits', icon: Wine }
  ]

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 
    'low_carb', 'keto', 'paleo', 'halal', 'kosher', 'spicy'
  ]

  const allergenOptions = [
    'dairy', 'gluten', 'eggs', 'fish', 'shellfish', 'tree_nuts', 
    'peanuts', 'soy', 'sesame', 'sulfites'
  ]

  const mealTimeOptions = [
    'breakfast', 'brunch', 'lunch', 'dinner', 'late_night'
  ]

  const locationOptions = [
    'main_dining', 'patio', 'bar', 'takeout', 'delivery'
  ]

  // AI Enhancement - Analyze menu item for suggestions
  const analyzeMenuItem = async () => {
    if (!formData.entity_name || !formData.description) return

    try {
      // Simulate AI analysis (in production, this would call an AI service)
      const mockAiResponse = {
        category: formData.entity_name.toLowerCase().includes('pizza') ? 'italian_classics' :
                 formData.entity_name.toLowerCase().includes('salad') ? 'salads' :
                 formData.entity_name.toLowerCase().includes('wine') ? 'wine' : 'appetizers',
        dietary_tags: formData.description.toLowerCase().includes('cheese') ? [] : ['vegetarian'],
        allergens: formData.description.toLowerCase().includes('cheese') ? ['dairy'] : [],
        pricing_suggestion: Math.round((12 + Math.random() * 20) * 100) / 100,
        description_enhanced: `${formData.description} - Made with the finest ingredients and traditional techniques.`
      }

      setAiSuggestions(mockAiResponse)
      setNotificationMessage('AI analysis complete! Check the suggestions below.')
      setNotificationType('success')
      setShowNotification(true)
    } catch (error) {
      console.error('AI analysis error:', error)
    }
  }

  // Apply AI suggestion
  const applySuggestion = (field, value) => {
    if (field === 'category') {
      setFormData(prev => ({ ...prev, category: value }))
    } else if (field === 'dietary_tags') {
      setFormData(prev => ({ ...prev, dietary_tags: [...prev.dietary_tags, ...value.filter(tag => !prev.dietary_tags.includes(tag))] }))
    } else if (field === 'allergens') {
      setFormData(prev => ({ ...prev, allergens: [...prev.allergens, ...value.filter(allergen => !prev.allergens.includes(allergen))] }))
    } else if (field === 'price') {
      setFormData(prev => ({ ...prev, price: value.toString() }))
    } else if (field === 'description') {
      setFormData(prev => ({ ...prev, description: value }))
    }
  }

  // Toggle array item
  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) 
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }))
  }

  // Generate entity code
  const generateEntityCode = () => {
    if (!formData.entity_name) return ''
    const words = formData.entity_name.split(' ')
    const code = words.map(w => w.slice(0, 3).toUpperCase()).join('-')
    return `DISH-${code}-${Date.now().toString().slice(-3)}`
  }

  // Auto-generate entity code when name changes
  useEffect(() => {
    if (formData.entity_name && !formData.entity_code) {
      setFormData(prev => ({ ...prev, entity_code: generateEntityCode() }))
    }
  }, [formData.entity_name])

  // Create menu item
  const createMenuItem = async () => {
    if (!formData.entity_name || !formData.price) {
      setNotificationMessage('Please fill in required fields (Name and Price)')
      setNotificationType('error')
      setShowNotification(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/menu/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          entity_type: 'menu_item',
          entity_name: formData.entity_name,
          entity_code: formData.entity_code || generateEntityCode(),
          dynamic_fields: {
            price: parseFloat(formData.price),
            description: formData.description,
            prep_time_minutes: parseInt(formData.prep_time_minutes) || 15,
            category: formData.category,
            dietary_tags: formData.dietary_tags,
            allergens: formData.allergens,
            ingredients: formData.ingredients,
            meal_times: formData.meal_times,
            locations: formData.locations,
            created_via: 'hera_menu_form',
            ai_enhanced: !!aiSuggestions.category
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        setNotificationMessage('Menu item created successfully! Redirecting...')
        setNotificationType('success')
        setShowNotification(true)
        
        setTimeout(() => {
          router.push('/restaurant/menu/dashboard')
        }, 2000)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error creating menu item:', error)
      setNotificationMessage('Failed to create menu item. Please try again.')
      setNotificationType('error')
      setShowNotification(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <StatusIndicator 
              status="success" 
              text="Mario's Restaurant" 
              showText={true} 
            />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
            🍽️ Add New Dish
          </h1>
          <p className="text-gray-600 mt-2">
            Create dishes that sell, price them right, make customers happy
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entity_name">Menu Item Name *</Label>
                    <Input
                      id="entity_name"
                      value={formData.entity_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                      placeholder="e.g., Margherita Pizza"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entity_code">Item Code</Label>
                    <Input
                      id="entity_code"
                      value={formData.entity_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, entity_code: e.target.value }))}
                      placeholder="Auto-generated"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <div className="flex gap-2 mt-1">
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your menu item..."
                      rows={3}
                      className="flex-1"
                    />
                    <Button
                      onClick={analyzeMenuItem}
                      variant="outline"
                      className="self-start"
                      disabled={!formData.entity_name || !formData.description}
                    >
                      <Brain className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click the brain icon for AI suggestions</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (USD) *</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="18.50"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="prep_time">Prep Time (minutes)</Label>
                    <div className="relative mt-1">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="prep_time"
                        type="number"
                        value={formData.prep_time_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, prep_time_minutes: e.target.value }))}
                        placeholder="15"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category & Classification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Category & Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Menu Category</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {categories.map((category) => {
                      const IconComponent = category.icon
                      const isSelected = formData.category === category.id
                      return (
                        <Button
                          key={category.id}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                          className={`h-auto p-3 flex flex-col items-center gap-2 ${
                            isSelected ? 'bg-orange-500 hover:bg-orange-600' : ''
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                          <span className="text-xs">{category.name}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <Label>Dietary Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dietaryOptions.map((tag) => (
                      <Badge
                        key={tag}
                        variant={formData.dietary_tags.includes(tag) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.dietary_tags.includes(tag) 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleArrayItem('dietary_tags', tag)}
                      >
                        {tag.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Allergens</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allergenOptions.map((allergen) => (
                      <Badge
                        key={allergen}
                        variant={formData.allergens.includes(allergen) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.allergens.includes(allergen) 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleArrayItem('allergens', allergen)}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {allergen.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Meal Times</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mealTimeOptions.map((mealTime) => (
                      <Badge
                        key={mealTime}
                        variant={formData.meal_times.includes(mealTime) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.meal_times.includes(mealTime) 
                            ? 'bg-blue-500 hover:bg-blue-600' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleArrayItem('meal_times', mealTime)}
                      >
                        {mealTime.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Available Locations</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {locationOptions.map((location) => (
                      <Badge
                        key={location}
                        variant={formData.locations.includes(location) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.locations.includes(location) 
                            ? 'bg-purple-500 hover:bg-purple-600' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleArrayItem('locations', location)}
                      >
                        {location.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions Sidebar */}
          <div className="space-y-6">
            {/* Smart Suggestions */}
            {(aiSuggestions.category || aiSuggestions.pricing_suggestion > 0) && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Sparkles className="w-5 h-5" />
                    Smart Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiSuggestions.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Category: <strong>{aiSuggestions.category}</strong></span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('category', aiSuggestions.category)}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  
                  {aiSuggestions.pricing_suggestion > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Price: <strong>${aiSuggestions.pricing_suggestion}</strong></span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('price', aiSuggestions.pricing_suggestion)}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  
                  {aiSuggestions.dietary_tags.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Dietary: <strong>{aiSuggestions.dietary_tags.join(', ')}</strong></span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('dietary_tags', aiSuggestions.dietary_tags)}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  
                  {aiSuggestions.allergens.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-600">
                        ⚠️ Allergens: <strong>{aiSuggestions.allergens.join(', ')}</strong>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('allergens', aiSuggestions.allergens)}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  
                  {aiSuggestions.description_enhanced && (
                    <div>
                      <p className="text-sm mb-2">Enhanced Description:</p>
                      <p className="text-xs bg-white p-2 rounded border">
                        {aiSuggestions.description_enhanced}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => applySuggestion('description', aiSuggestions.description_enhanced)}
                      >
                        Use Enhanced Description
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* What This Does */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Zap className="w-5 h-5" />
                  What This Does For You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border text-sm">
                    ✓ Tracks every time this dish is ordered<br/>
                    ✓ Shows your most popular items<br/>
                    ✓ Helps you price for maximum profit
                  </div>
                  <p className="text-xs text-green-600">
                    Your sales will update automatically. See which dishes make money 
                    and which ones don't. Make smarter menu decisions.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <GlowButton
                    onClick={createMenuItem}
                    disabled={loading || !formData.entity_name || !formData.price}
                    glowColor="rgba(249, 115, 22, 0.4)"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Menu Item
                      </>
                    )}
                  </GlowButton>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/restaurant/menu/dashboard')}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Notification */}
        <FloatingNotification
          show={showNotification}
          message={notificationMessage}
          type={notificationType}
          duration={3000}
          onClose={() => setShowNotification(false)}
        />
      </div>
    </div>
  )
}