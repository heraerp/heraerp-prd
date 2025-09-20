'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calculator,
  Plus,
  Trash2,
  Edit,
  Save,
  DollarSign,
  Package,
  AlertCircle,
  TrendingUp,
  ChefHat,
  Scale,
  Percent,
  Info,
  Copy,
  CheckCircle,
  XCircle,
  ArrowRight,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
  supplier?: string
  category: string
}

interface Recipe {
  id: string
  name: string
  category: string
  servings: number
  ingredients: Ingredient[]
  totalCost: number
  costPerServing: number
  sellingPrice: number
  targetMargin: number
  actualMargin: number
  status: 'profitable' | 'review' | 'loss'
}

interface IngredientMaster {
  id: string
  name: string
  category: string
  supplier: string
  unitCost: number
  unit: string
  lastUpdated: string
  priceHistory: Array<{ date: string; price: number }>
}

export function RecipeCostingManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isAddingRecipe, setIsAddingRecipe] = useState(false)
  const [targetMargin, setTargetMargin] = useState(70) // Default 70% margin

  // Master ingredient list (would come from HERA entities)
  const masterIngredients: IngredientMaster[] = [
    {
      id: '1',
      name: 'Chicken Breast',
      category: 'Protein',
      supplier: 'Fresh Foods Co',
      unitCost: 8.5,
      unit: 'kg',
      lastUpdated: '2024-01-15',
      priceHistory: []
    },
    {
      id: '2',
      name: 'Salmon Fillet',
      category: 'Seafood',
      supplier: 'Ocean Fresh',
      unitCost: 24.0,
      unit: 'kg',
      lastUpdated: '2024-01-15',
      priceHistory: []
    },
    {
      id: '3',
      name: 'Pasta',
      category: 'Grains',
      supplier: 'Italian Imports',
      unitCost: 3.5,
      unit: 'kg',
      lastUpdated: '2024-01-14',
      priceHistory: []
    },
    {
      id: '4',
      name: 'Olive Oil',
      category: 'Oils',
      supplier: 'Mediterranean Goods',
      unitCost: 12.0,
      unit: 'liter',
      lastUpdated: '2024-01-14',
      priceHistory: []
    },
    {
      id: '5',
      name: 'Tomatoes',
      category: 'Produce',
      supplier: 'Local Farms',
      unitCost: 2.5,
      unit: 'kg',
      lastUpdated: '2024-01-15',
      priceHistory: []
    },
    {
      id: '6',
      name: 'Mozzarella',
      category: 'Dairy',
      supplier: 'Artisan Dairy',
      unitCost: 15.0,
      unit: 'kg',
      lastUpdated: '2024-01-13',
      priceHistory: []
    },
    {
      id: '7',
      name: 'Basil',
      category: 'Herbs',
      supplier: 'Fresh Herbs Inc',
      unitCost: 25.0,
      unit: 'kg',
      lastUpdated: '2024-01-15',
      priceHistory: []
    },
    {
      id: '8',
      name: 'Garlic',
      category: 'Produce',
      supplier: 'Local Farms',
      unitCost: 4.0,
      unit: 'kg',
      lastUpdated: '2024-01-15',
      priceHistory: []
    },
    {
      id: '9',
      name: 'Heavy Cream',
      category: 'Dairy',
      supplier: 'Artisan Dairy',
      unitCost: 5.0,
      unit: 'liter',
      lastUpdated: '2024-01-14',
      priceHistory: []
    },
    {
      id: '10',
      name: 'Parmesan',
      category: 'Dairy',
      supplier: 'Italian Imports',
      unitCost: 28.0,
      unit: 'kg',
      lastUpdated: '2024-01-13',
      priceHistory: []
    }
  ]

  // Sample recipes
  const sampleRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Grilled Salmon with Herbs',
      category: 'Main Course',
      servings: 1,
      ingredients: [
        {
          id: '1',
          name: 'Salmon Fillet',
          quantity: 0.2,
          unit: 'kg',
          unitCost: 24.0,
          totalCost: 4.8,
          category: 'Seafood'
        },
        {
          id: '2',
          name: 'Olive Oil',
          quantity: 0.02,
          unit: 'liter',
          unitCost: 12.0,
          totalCost: 0.24,
          category: 'Oils'
        },
        {
          id: '3',
          name: 'Basil',
          quantity: 0.01,
          unit: 'kg',
          unitCost: 25.0,
          totalCost: 0.25,
          category: 'Herbs'
        },
        {
          id: '4',
          name: 'Garlic',
          quantity: 0.005,
          unit: 'kg',
          unitCost: 4.0,
          totalCost: 0.02,
          category: 'Produce'
        }
      ],
      totalCost: 5.31,
      costPerServing: 5.31,
      sellingPrice: 24.0,
      targetMargin: 70,
      actualMargin: 77.9,
      status: 'profitable'
    },
    {
      id: '2',
      name: 'Truffle Pasta',
      category: 'Main Course',
      servings: 1,
      ingredients: [
        {
          id: '1',
          name: 'Pasta',
          quantity: 0.15,
          unit: 'kg',
          unitCost: 3.5,
          totalCost: 0.53,
          category: 'Grains'
        },
        {
          id: '2',
          name: 'Heavy Cream',
          quantity: 0.1,
          unit: 'liter',
          unitCost: 5.0,
          totalCost: 0.5,
          category: 'Dairy'
        },
        {
          id: '3',
          name: 'Parmesan',
          quantity: 0.05,
          unit: 'kg',
          unitCost: 28.0,
          totalCost: 1.4,
          category: 'Dairy'
        },
        {
          id: '4',
          name: 'Truffle Oil',
          quantity: 0.01,
          unit: 'liter',
          unitCost: 80.0,
          totalCost: 0.8,
          category: 'Oils'
        }
      ],
      totalCost: 3.23,
      costPerServing: 3.23,
      sellingPrice: 25.0,
      targetMargin: 70,
      actualMargin: 87.1,
      status: 'profitable'
    }
  ]

  useEffect(() => {
    setRecipes(sampleRecipes)
  }, [])

  const calculateRecipeCost = (ingredients: Ingredient[]) => {
    return ingredients.reduce((sum, ing) => sum + ing.totalCost, 0)
  }

  const calculateMargin = (cost: number, price: number) => {
    if (price === 0) return 0
    return ((price - cost) / price) * 100
  }

  const calculateSuggestedPrice = (cost: number, targetMargin: number) => {
    return cost / (1 - targetMargin / 100)
  }

  const getMarginStatus = (margin: number) => {
    if (margin >= targetMargin) return 'profitable'
    if (margin >= targetMargin - 10) return 'review'
    return 'loss'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'profitable':
        return <Badge className="bg-green-500">Profitable</Badge>
      case 'review':
        return <Badge className="bg-yellow-500">Review</Badge>
      case 'loss':
        return <Badge className="bg-red-500">Loss</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const RecipeForm = ({
    recipe,
    onSave
  }: {
    recipe?: Recipe | null
    onSave: (recipe: Recipe) => void
  }) => {
    const [formData, setFormData] = useState<Recipe>(
      recipe || {
        id: Date.now().toString(),
        name: '',
        category: 'Main Course',
        servings: 1,
        ingredients: [],
        totalCost: 0,
        costPerServing: 0,
        sellingPrice: 0,
        targetMargin: targetMargin,
        actualMargin: 0,
        status: 'review'
      }
    )

    const addIngredient = (masterIng: IngredientMaster) => {
      const newIngredient: Ingredient = {
        id: Date.now().toString(),
        name: masterIng.name,
        quantity: 0,
        unit: masterIng.unit,
        unitCost: masterIng.unitCost,
        totalCost: 0,
        category: masterIng.category,
        supplier: masterIng.supplier
      }
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient]
      }))
    }

    const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
      const updatedIngredients = [...formData.ingredients]
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value
      }

      // Recalculate total cost for this ingredient
      if (field === 'quantity' || field === 'unitCost') {
        updatedIngredients[index].totalCost =
          updatedIngredients[index].quantity * updatedIngredients[index].unitCost
      }

      const totalCost = calculateRecipeCost(updatedIngredients)
      const costPerServing = totalCost / (formData.servings || 1)
      const actualMargin = calculateMargin(costPerServing, formData.sellingPrice)

      setFormData(prev => ({
        ...prev,
        ingredients: updatedIngredients,
        totalCost,
        costPerServing,
        actualMargin,
        status: getMarginStatus(actualMargin)
      }))
    }

    const removeIngredient = (index: number) => {
      const updatedIngredients = formData.ingredients.filter((_, i) => i !== index)
      const totalCost = calculateRecipeCost(updatedIngredients)
      const costPerServing = totalCost / (formData.servings || 1)
      const actualMargin = calculateMargin(costPerServing, formData.sellingPrice)

      setFormData(prev => ({
        ...prev,
        ingredients: updatedIngredients,
        totalCost,
        costPerServing,
        actualMargin,
        status: getMarginStatus(actualMargin)
      }))
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Recipe Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter recipe name"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Appetizer">Appetizer</SelectItem>
                <SelectItem value="Main Course">Main Course</SelectItem>
                <SelectItem value="Dessert">Dessert</SelectItem>
                <SelectItem value="Beverage">Beverage</SelectItem>
                <SelectItem value="Side">Side</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="servings">Servings</Label>
            <Input
              id="servings"
              type="number"
              value={formData.servings}
              onChange={e => {
                const servings = parseInt(e.target.value) || 1
                const costPerServing = formData.totalCost / servings
                const actualMargin = calculateMargin(costPerServing, formData.sellingPrice)
                setFormData(prev => ({
                  ...prev,
                  servings,
                  costPerServing,
                  actualMargin,
                  status: getMarginStatus(actualMargin)
                }))
              }}
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="sellingPrice">Selling Price ($)</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={e => {
                const sellingPrice = parseFloat(e.target.value) || 0
                const actualMargin = calculateMargin(formData.costPerServing, sellingPrice)
                setFormData(prev => ({
                  ...prev,
                  sellingPrice,
                  actualMargin,
                  status: getMarginStatus(actualMargin)
                }))
              }}
            />
          </div>
          <div>
            <Label htmlFor="targetMargin">Target Margin (%)</Label>
            <Input
              id="targetMargin"
              type="number"
              value={formData.targetMargin}
              onChange={e =>
                setFormData(prev => ({ ...prev, targetMargin: parseFloat(e.target.value) || 0 }))
              }
              min="0"
              max="100"
            />
          </div>
        </div>

        {/* Ingredients Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <Label>Ingredients</Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="restaurant-btn-primary">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Ingredient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Select Ingredient</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {masterIngredients.map(ing => (
                    <Button
                      key={ing.id}
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        addIngredient(ing)
                      }}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <p className="font-medium">{ing.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${ing.unitCost}/{ing.unit}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {formData.ingredients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.ingredients.map((ing, index) => (
                  <TableRow key={ing.id}>
                    <TableCell>{ing.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        value={ing.quantity}
                        onChange={e =>
                          updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>{ing.unit}</TableCell>
                    <TableCell>${ing.unitCost.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">${ing.totalCost.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeIngredient(index)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No ingredients added yet. Click "Add Ingredient" to start.
            </div>
          )}
        </div>

        {/* Cost Summary */}
        <Card className="restaurant-card">
          <CardHeader>
            <CardTitle className="text-lg">Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold text-orange-600">
                  ${formData.totalCost.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost per Serving</p>
                <p className="text-xl font-bold">${formData.costPerServing.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actual Margin</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    formData.actualMargin >= targetMargin ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {formData.actualMargin.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suggested Price</p>
                <p className="text-xl font-bold text-primary">
                  $
                  {calculateSuggestedPrice(formData.costPerServing, formData.targetMargin).toFixed(
                    2
                  )}
                </p>
              </div>
            </div>

            {formData.actualMargin < formData.targetMargin && (
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Current margin is below target. Consider adjusting the selling price to $
                  {calculateSuggestedPrice(formData.costPerServing, formData.targetMargin).toFixed(
                    2
                  )}
                  to achieve {formData.targetMargin}% margin.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsAddingRecipe(false)}>
            Cancel
          </Button>
          <Button
            className="restaurant-btn-primary"
            onClick={() => {
              onSave(formData)
              setIsAddingRecipe(false)
            }}
            disabled={!formData.name || formData.ingredients.length === 0}
          >
            <Save className="w-4 h-4 mr-1" />
            Save Recipe
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Recipe Costing Manager
          </h2>
          <p className="text-muted-foreground mt-1">
            Calculate costs, set prices, and maximize profitability
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              /* Import from Excel */
            }}
          >
            Import Recipes
          </Button>
          <Button className="restaurant-btn-primary" onClick={() => setIsAddingRecipe(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Recipe
          </Button>
        </div>
      </div>

      {/* Target Margin Setting */}
      <Card className="restaurant-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Target className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-medium">Global Target Margin</p>
                <p className="text-sm text-muted-foreground">
                  Set your desired profit margin for all recipes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={targetMargin}
                onChange={e => setTargetMargin(parseFloat(e.target.value) || 0)}
                className="w-20"
                min="0"
                max="100"
              />
              <span className="text-lg font-semibold">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAddingRecipe ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Recipe</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipeForm
              onSave={recipe => {
                setRecipes(prev => [...prev, recipe])
                setIsAddingRecipe(false)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Recipes</TabsTrigger>
            <TabsTrigger value="profitable">Profitable</TabsTrigger>
            <TabsTrigger value="review">Need Review</TabsTrigger>
            <TabsTrigger value="analysis">Cost Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map(recipe => (
                <Card
                  key={recipe.id}
                  className="restaurant-card cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{recipe.category}</p>
                      </div>
                      {getStatusBadge(recipe.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cost per Serving</span>
                        <span className="font-semibold">${recipe.costPerServing.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Selling Price</span>
                        <span className="font-semibold text-orange-600">
                          ${recipe.sellingPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Margin</span>
                        <span
                          className={cn(
                            'font-semibold',
                            recipe.actualMargin >= targetMargin ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {recipe.actualMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">
                            {recipe.ingredients.length} ingredients
                          </span>
                          <span className="text-muted-foreground">
                            {recipe.servings} serving(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profitable">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes
                .filter(r => r.status === 'profitable')
                .map(recipe => (
                  <Card key={recipe.id} className="restaurant-card border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      <Badge className="bg-green-500 w-fit">
                        {recipe.actualMargin.toFixed(1)}% Margin
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Cost</span>
                          <span>${recipe.costPerServing.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Price</span>
                          <span className="font-bold text-green-600">
                            ${recipe.sellingPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Profit</span>
                          <span className="font-bold">
                            ${(recipe.sellingPrice - recipe.costPerServing).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="review">
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                These recipes need pricing adjustments to meet your target margin of {targetMargin}%
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              {recipes
                .filter(r => r.status === 'review' || r.status === 'loss')
                .map(recipe => (
                  <Card key={recipe.id} className="restaurant-card border-yellow-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{recipe.name}</h3>
                          <p className="text-sm text-muted-foreground">{recipe.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Current Margin</p>
                          <p className="text-2xl font-bold text-red-600">
                            {recipe.actualMargin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Current Price</p>
                            <p className="font-semibold">${recipe.sellingPrice.toFixed(2)}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Suggested Price</p>
                            <p className="font-semibold text-green-600">
                              $
                              {calculateSuggestedPrice(recipe.costPerServing, targetMargin).toFixed(
                                2
                              )}
                            </p>
                          </div>
                          <Button size="sm" className="restaurant-btn-primary">
                            Apply
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="restaurant-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                    Cost Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Proteins</span>
                        <span className="text-sm font-semibold">45%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Produce</span>
                        <span className="text-sm font-semibold">20%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Dairy</span>
                        <span className="text-sm font-semibold">15%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Grains</span>
                        <span className="text-sm font-semibold">10%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Other</span>
                        <span className="text-sm font-semibold">10%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="restaurant-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Margin Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">High Margin Items</p>
                        <p className="text-xl font-bold text-green-600">
                          {recipes.filter(r => r.actualMargin >= targetMargin).length}
                        </p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Need Review</p>
                        <p className="text-xl font-bold text-yellow-600">
                          {
                            recipes.filter(
                              r =>
                                r.actualMargin < targetMargin && r.actualMargin >= targetMargin - 10
                            ).length
                          }
                        </p>
                      </div>
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Low Margin</p>
                        <p className="text-xl font-bold text-red-600">
                          {recipes.filter(r => r.actualMargin < targetMargin - 10).length}
                        </p>
                      </div>
                      <XCircle className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
