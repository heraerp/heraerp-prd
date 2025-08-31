'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDemoOrg } from '@/components/providers/DemoOrgProvider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { 
  ChefHat,
  Plus,
  Beaker,
  Scale,
  Clock,
  DollarSign,
  Snowflake,
  FileText,
  Edit,
  Copy,
  Trash2,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Recipe {
  id: string
  entity_name: string
  entity_code: string
  metadata: any
  ingredients?: any[]
}

interface RawMaterial {
  id: string
  entity_name: string
  entity_code: string
  metadata: any
}

export default function RecipesPage() {
  const { organizationId, organizationName, loading: orgLoading } = useDemoOrg()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  
  // Dialog states
  const [showNewRecipeDialog, setShowNewRecipeDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddIngredientDialog, setShowAddIngredientDialog] = useState(false)
  
  // Form states
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    productId: '',
    batchSize: 100,
    prepTime: 45,
    yield: 95,
    category: 'Classic'
  })
  const [newIngredient, setNewIngredient] = useState({
    materialId: '',
    quantity: 0,
    unit: 'kg'
  })

  useEffect(() => {
    if (organizationId && !orgLoading) {
      fetchRecipeData()
    }
  }, [organizationId, orgLoading])

  async function fetchRecipeData() {
    if (!organizationId) return
    
    try {
      // Fetch recipes
      const { data: recipeData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'recipe')

      // Fetch raw materials
      const { data: materialData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'raw_material')

      // Fetch products
      const { data: productData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'product')

      // Fetch recipe relationships (BOM)
      if (recipeData) {
        const recipesWithIngredients = await Promise.all(
          recipeData.map(async (recipe) => {
            const { data: relationships } = await supabase
              .from('core_relationships')
              .select('*')
              .eq('from_entity_id', recipe.id)
              .eq('relationship_type', 'recipe_component')

            const ingredients = relationships?.map(rel => {
              const material = materialData?.find(m => m.id === rel.to_entity_id)
              return {
                material,
                quantity: rel.relationship_data?.quantity || 0,
                unit: rel.relationship_data?.unit || '',
                relationshipId: rel.id
              }
            }) || []

            return { ...recipe, ingredients }
          })
        )
        setRecipes(recipesWithIngredients)
      }

      setRawMaterials(materialData || [])
      setProducts(productData || [])
    } catch (error) {
      console.error('Error fetching recipe data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create new recipe
  async function handleCreateRecipe() {
    if (!newRecipe.name || !newRecipe.productId) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const product = products.find(p => p.id === newRecipe.productId)
      
      // Create recipe entity
      const { data: recipe, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'recipe',
          entity_name: newRecipe.name,
          entity_code: `RECIPE-${Date.now()}`,
          smart_code: 'HERA.MFG.RECIPE.ICECREAM.v1',
          metadata: {
            product_id: newRecipe.productId,
            product_name: product?.entity_name,
            batch_size: newRecipe.batchSize,
            prep_time: newRecipe.prepTime,
            yield: newRecipe.yield,
            category: newRecipe.category,
            unit: 'liters'
          }
        })
        .select()
        .single()

      if (error) throw error

      // Create relationship to product
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: organizationId,
          from_entity_id: recipe.id,
          to_entity_id: newRecipe.productId,
          relationship_type: 'recipe_for',
          smart_code: 'HERA.MFG.REL.RECIPE.PRODUCT.v1'
        })

      toast({
        title: "Success",
        description: "Recipe created successfully"
      })

      setShowNewRecipeDialog(false)
      setNewRecipe({
        name: '',
        productId: '',
        batchSize: 100,
        prepTime: 45,
        yield: 95,
        category: 'Classic'
      })
      fetchRecipeData()

    } catch (error) {
      console.error('Error creating recipe:', error)
      toast({
        title: "Error",
        description: "Failed to create recipe",
        variant: "destructive"
      })
    }
  }

  // Add ingredient to recipe
  async function handleAddIngredient() {
    if (!selectedRecipe || !newIngredient.materialId || newIngredient.quantity <= 0) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly",
        variant: "destructive"
      })
      return
    }

    try {
      const material = rawMaterials.find(m => m.id === newIngredient.materialId)

      // Create recipe component relationship
      const { error } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: organizationId,
          from_entity_id: selectedRecipe.id,
          to_entity_id: newIngredient.materialId,
          relationship_type: 'recipe_component',
          smart_code: 'HERA.MFG.REL.RECIPE.COMPONENT.v1',
          relationship_data: {
            quantity: newIngredient.quantity,
            unit: newIngredient.unit,
            material_name: material?.entity_name,
            cost_per_unit: material?.metadata?.cost_per_unit || 0
          }
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Ingredient added successfully"
      })

      setShowAddIngredientDialog(false)
      setNewIngredient({
        materialId: '',
        quantity: 0,
        unit: 'kg'
      })
      fetchRecipeData()

    } catch (error) {
      console.error('Error adding ingredient:', error)
      toast({
        title: "Error",
        description: "Failed to add ingredient",
        variant: "destructive"
      })
    }
  }

  // Delete recipe
  async function handleDeleteRecipe(recipeId: string) {
    if (!confirm('Are you sure you want to delete this recipe?')) return

    try {
      // Delete relationships first
      await supabase
        .from('core_relationships')
        .delete()
        .eq('from_entity_id', recipeId)

      // Delete recipe
      await supabase
        .from('core_entities')
        .delete()
        .eq('id', recipeId)

      toast({
        title: "Success",
        description: "Recipe deleted successfully"
      })

      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null)
      }
      fetchRecipeData()

    } catch (error) {
      console.error('Error deleting recipe:', error)
      toast({
        title: "Error",
        description: "Failed to delete recipe",
        variant: "destructive"
      })
    }
  }

  function calculateRecipeCost(recipe: Recipe): number {
    let totalCost = 0
    recipe.ingredients?.forEach(ing => {
      const costPerUnit = ing.material?.metadata?.cost_per_unit || 0
      totalCost += costPerUnit * ing.quantity
    })
    return totalCost
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case 'Premium': return 'from-purple-400 to-pink-400'
      case 'Classic': return 'from-blue-400 to-cyan-400'
      case 'Seasonal': return 'from-orange-400 to-yellow-400'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            Recipe Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Master recipes and formulations for ice cream production
          </p>
        </div>
        <Dialog open={showNewRecipeDialog} onOpenChange={setShowNewRecipeDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Recipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Recipe Name</Label>
                <Input
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                  placeholder="e.g., Premium Vanilla Ice Cream"
                />
              </div>
              <div>
                <Label>Product</Label>
                <select
                  value={newRecipe.productId}
                  onChange={(e) => setNewRecipe({ ...newRecipe, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.entity_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Batch Size (L)</Label>
                  <Input
                    type="number"
                    value={newRecipe.batchSize}
                    onChange={(e) => setNewRecipe({ ...newRecipe, batchSize: parseInt(e.target.value) || 100 })}
                  />
                </div>
                <div>
                  <Label>Prep Time (min)</Label>
                  <Input
                    type="number"
                    value={newRecipe.prepTime}
                    onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: parseInt(e.target.value) || 45 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Yield (%)</Label>
                  <Input
                    type="number"
                    value={newRecipe.yield}
                    onChange={(e) => setNewRecipe({ ...newRecipe, yield: parseInt(e.target.value) || 95 })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={newRecipe.category}
                    onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Classic">Classic</option>
                    <option value="Premium">Premium</option>
                    <option value="Seasonal">Seasonal</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleCreateRecipe} className="w-full">
                Create Recipe
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-orange-200/50 dark:border-orange-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Recipes</p>
                <p className="text-2xl font-bold mt-1">{recipes.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-orange-200/50 dark:border-orange-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Products</p>
                <p className="text-2xl font-bold mt-1">8</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Snowflake className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-orange-200/50 dark:border-orange-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Raw Materials</p>
                <p className="text-2xl font-bold mt-1">{rawMaterials.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Beaker className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-orange-200/50 dark:border-orange-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Recipe Cost</p>
                <p className="text-2xl font-bold mt-1">₹{
                  recipes.length > 0 
                    ? (recipes.reduce((sum, r) => sum + calculateRecipeCost(r), 0) / recipes.length).toFixed(2)
                    : '0'
                }</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recipe Library</h2>
          {loading ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-orange-200/50 dark:border-orange-800/50">
              <CardContent className="p-12 text-center">
                <div className="animate-pulse">Loading recipes...</div>
              </CardContent>
            </Card>
          ) : recipes.length === 0 ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-orange-200/50 dark:border-orange-800/50">
              <CardContent className="p-12 text-center">
                <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recipes found</p>
              </CardContent>
            </Card>
          ) : (
            recipes.map((recipe) => {
              const cost = calculateRecipeCost(recipe)
              const category = recipe.metadata?.category || 'Classic'
              
              return (
                <Card 
                  key={recipe.id}
                  className={cn(
                    "backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-orange-200/50 dark:border-orange-800/50 hover:shadow-lg transition-all cursor-pointer",
                    selectedRecipe?.id === recipe.id && "ring-2 ring-orange-500"
                  )}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br",
                          getCategoryColor(category)
                        )}>
                          <ChefHat className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{recipe.entity_name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {recipe.ingredients?.length || 0} ingredients • ₹{cost.toFixed(2)}/batch
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Recipe Details */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recipe Details</h2>
          {selectedRecipe ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-orange-200/50 dark:border-orange-800/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedRecipe.entity_name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Dialog open={showAddIngredientDialog} onOpenChange={setShowAddIngredientDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Ingredient
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Ingredient to {selectedRecipe.entity_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Raw Material</Label>
                            <select
                              value={newIngredient.materialId}
                              onChange={(e) => setNewIngredient({ ...newIngredient, materialId: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg"
                            >
                              <option value="">Select Material</option>
                              {rawMaterials.map(material => (
                                <option key={material.id} value={material.id}>
                                  {material.entity_name} - ₹{material.metadata?.cost_per_unit || 0}/{material.metadata?.unit || 'kg'}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={newIngredient.quantity}
                                onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <Label>Unit</Label>
                              <select
                                value={newIngredient.unit}
                                onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                              >
                                <option value="kg">Kilograms</option>
                                <option value="liters">Liters</option>
                                <option value="units">Units</option>
                                <option value="grams">Grams</option>
                                <option value="ml">Milliliters</option>
                              </select>
                            </div>
                          </div>
                          <Button onClick={handleAddIngredient} className="w-full">
                            Add Ingredient
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Recipe Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/70 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Batch Size</p>
                    <p className="font-semibold">{selectedRecipe.metadata?.batch_size || '100'} L</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/70 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Prep Time</p>
                    <p className="font-semibold">{selectedRecipe.metadata?.prep_time || '45'} min</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/70 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Cost/Batch</p>
                    <p className="font-semibold">₹{calculateRecipeCost(selectedRecipe).toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/70 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Yield</p>
                    <p className="font-semibold">{selectedRecipe.metadata?.yield || '95'}%</p>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Ingredients</h4>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients?.map((ing, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/70 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Scale className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {ing.material?.entity_name || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {ing.quantity} {ing.unit}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            ₹{((ing.material?.metadata?.cost_per_unit || 0) * ing.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {selectedRecipe.ingredients?.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No ingredients added yet</p>
                    )}
                  </div>
                </div>

                {/* Process Steps */}
                {selectedRecipe.metadata?.process_steps && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Process Steps</h4>
                    <div className="space-y-2">
                      {selectedRecipe.metadata.process_steps.map((step: string, idx: number) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-slate-50">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality Parameters */}
                {selectedRecipe.metadata?.quality_parameters && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Quality Parameters</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedRecipe.metadata.quality_parameters).map(([key, value]) => (
                        <div key={key} className="p-2 bg-gray-50 dark:bg-gray-800/70 rounded">
                          <p className="text-xs text-gray-600 dark:text-gray-300 capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-orange-200/50 dark:border-orange-800/50">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a recipe to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}