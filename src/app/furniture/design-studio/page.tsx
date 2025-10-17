'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  PenTool,
  Layers,
  Box,
  Ruler,
  Save,
  Download,
  Share2,
  Settings,
  Eye,
  EyeOff,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Move,
  Copy,
  Trash2,
  FileImage,
  FileText,
  Clock,
  Lightbulb,
  Sparkles,
  Wand2,
  Palette,
  Triangle,
  Square,
  Circle,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Monitor,
  Smartphone,
  Tablet,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Info,
  DollarSign,
  Package,
  TreePine,
  Hammer,
  Armchair,
  BookOpen,
  Building2,
  Target,
  Zap
} from 'lucide-react'

interface DesignProject {
  id: string
  name: string
  description: string
  category: 'seating' | 'tables' | 'storage' | 'desks' | 'custom'
  createdAt: string
  lastModified: string
  timeSpent: string
  status: 'draft' | 'in_progress' | 'completed' | 'exported'
  thumbnail: string
  materials: string[]
  dimensions: string
  estimatedCost: number
  complexity: 'simple' | 'moderate' | 'advanced'
}

interface DesignSuggestion {
  text: string
  category: string
  complexity: 'simple' | 'moderate' | 'advanced'
  icon: React.ElementType
}

interface MaterialStock {
  name: string
  type: string
  inStock: number
  unit: string
  cost: number
  status: 'good' | 'low' | 'out'
}

interface DesignOutput {
  description: string
  dimensions: { length: number; width: number; height: number }
  materials: string[]
  estimatedCost: number
  estimatedTime: string
  complexity: 'simple' | 'moderate' | 'advanced'
  views: string[]
  compliance: {
    ada: boolean
    safety: boolean
    loadRating: string
  }
}

export default function DesignStudio() {
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'both'>('both')
  const [showGrid, setShowGrid] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [selectedTool, setSelectedTool] = useState('select')
  const [designOutput, setDesignOutput] = useState<DesignOutput | null>(null)

  // Sample design projects
  const recentProjects: DesignProject[] = [
    {
      id: '1',
      name: 'Executive Dining Set',
      description: 'Traditional Kerala dining table with 8 chairs',
      category: 'tables',
      createdAt: '2024-01-15',
      lastModified: '2024-01-16',
      timeSpent: '2hrs 15min',
      status: 'completed',
      thumbnail: '/designs/dining-set.svg',
      materials: ['Premium Teak', 'Brass Hardware'],
      dimensions: '180×90×75 cm',
      estimatedCost: 85000,
      complexity: 'moderate'
    },
    {
      id: '2',
      name: 'Modern Office Chair',
      description: 'Ergonomic office chair with lumbar support',
      category: 'seating',
      createdAt: '2024-01-14',
      lastModified: '2024-01-15',
      timeSpent: '1hr 30min',
      status: 'in_progress',
      thumbnail: '/designs/office-chair.svg',
      materials: ['Oak Veneer', 'Steel Frame'],
      dimensions: '60×65×110 cm',
      estimatedCost: 25000,
      complexity: 'simple'
    },
    {
      id: '3',
      name: 'Hotel Wardrobe System',
      description: 'Modular wardrobe for luxury hotel rooms',
      category: 'storage',
      createdAt: '2024-01-12',
      lastModified: '2024-01-14',
      timeSpent: '4hrs 45min',
      status: 'exported',
      thumbnail: '/designs/wardrobe.svg',
      materials: ['Rosewood', 'Soft-Close Hardware'],
      dimensions: '220×150×60 cm',
      estimatedCost: 155000,
      complexity: 'advanced'
    }
  ]

  // Design suggestions based on current input
  const designSuggestions: DesignSuggestion[] = [
    {
      text: 'Create a dining chair, 45cm seat height, oak wood, curved backrest',
      category: 'Seating',
      complexity: 'simple',
      icon: Armchair
    },
    {
      text: 'Design a modern dining table, 180cm×90cm, walnut top with oak legs',
      category: 'Tables',
      complexity: 'moderate',
      icon: Box
    },
    {
      text: 'Generate kitchen base cabinet, 60cm wide, soft-close doors, plywood construction',
      category: 'Storage',
      complexity: 'moderate',
      icon: Package
    },
    {
      text: 'Build a standing desk base, electric height adjustment, steel frame',
      category: 'Desks',
      complexity: 'advanced',
      icon: Monitor
    }
  ]

  // Material stock data
  const materialStock: MaterialStock[] = [
    { name: 'Premium Teak', type: 'Wood', inStock: 247, unit: 'bd/ft', cost: 85, status: 'good' },
    { name: 'Black Walnut', type: 'Wood', inStock: 34, unit: 'bd/ft', cost: 120, status: 'low' },
    { name: 'Hard Maple', type: 'Wood', inStock: 0, unit: 'bd/ft', cost: 65, status: 'out' },
    { name: 'Soft-Close Hinges', type: 'Hardware', inStock: 156, unit: 'pairs', cost: 25, status: 'good' }
  ]

  // Quick action templates
  const quickActions = [
    { name: 'Chair', icon: Armchair, category: 'seating', prompt: 'Design a dining chair with comfortable backrest' },
    { name: 'Table', icon: Box, category: 'tables', prompt: 'Create a dining table for 6 people' },
    { name: 'Cabinet', icon: Package, category: 'storage', prompt: 'Design a kitchen cabinet with drawers' },
    { name: 'Desk', icon: Monitor, category: 'desks', prompt: 'Build a home office desk with storage' },
    { name: 'Bookshelf', icon: BookOpen, category: 'storage', prompt: 'Create a 5-shelf bookcase' },
    { name: 'Custom...', icon: Wand2, category: 'custom', prompt: '' }
  ]

  useEffect(() => {
    // Update suggestions based on current prompt
    if (currentPrompt.length > 10) {
      const filtered = designSuggestions.filter(s => 
        s.text.toLowerCase().includes(currentPrompt.toLowerCase()) ||
        s.category.toLowerCase().includes(currentPrompt.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 3))
    } else {
      setSuggestions([])
    }
  }, [currentPrompt])

  const handleGenerateDesign = async () => {
    if (!currentPrompt.trim()) return

    setIsGenerating(true)
    
    // Simulate AI generation process
    setTimeout(() => {
      setDesignOutput({
        description: currentPrompt,
        dimensions: { length: 180, width: 90, height: 75 },
        materials: ['Premium Teak', 'Brass Hardware'],
        estimatedCost: 45000,
        estimatedTime: '3.5 hours',
        complexity: 'moderate',
        views: ['front', 'side', 'top', 'isometric'],
        compliance: {
          ada: true,
          safety: true,
          loadRating: 'adequate'
        }
      })
      setIsGenerating(false)
    }, 3000)
  }

  const handleQuickAction = (action: { name: string; icon: React.ElementType; category: string; prompt: string }) => {
    if (action.prompt) {
      setCurrentPrompt(action.prompt)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-500/10 text-gray-300 border-gray-500/20',
      'in_progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'completed': 'bg-green-500/10 text-green-600 border-green-500/20',
      'exported': 'bg-purple-500/10 text-purple-600 border-purple-500/20'
    }
    return colors[status] || colors.draft
  }

  const getComplexityColor = (complexity: string) => {
    const colors: Record<string, string> = {
      'simple': 'text-green-500',
      'moderate': 'text-amber-500',
      'advanced': 'text-red-500'
    }
    return colors[complexity] || colors.simple
  }

  const getStockStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'good': 'text-green-500',
      'low': 'text-amber-500',
      'out': 'text-red-500'
    }
    return colors[status] || colors.good
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <PenTool className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Design Studio</h1>
                  <p className="text-lg text-gray-300">AI-Powered Furniture Design & CAD Generation</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Enabled
                </Badge>
                <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Settings className="h-4 w-4" />
                  Preferences
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Designs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="jewelry-glass-card p-6">
              <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="jewelry-glass-card p-4 jewelry-scale-hover cursor-pointer text-center"
                  >
                    <action.icon className="h-6 w-6 jewelry-text-gold mx-auto mb-2" />
                    <span className="text-xs jewelry-text-luxury">{action.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Designs */}
            <div className="jewelry-glass-card p-6">
              <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Recent Designs</h3>
              <div className="space-y-3">
                {recentProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium jewelry-text-luxury text-sm">{project.name}</p>
                        <p className="text-xs text-gray-300">{project.timeSpent}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full jewelry-glass-btn text-sm jewelry-text-luxury hover:jewelry-text-gold">
                  View All Designs
                </Button>
              </div>
            </div>
          </div>

          {/* Design Input */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="h-5 w-5 jewelry-text-gold" />
              <h3 className="text-lg font-semibold jewelry-text-luxury">Describe Your Design</h3>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Example: Create a modern dining table, 180cm long, 90cm wide, with tapered oak legs and a walnut top..."
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  className="jewelry-glass-input min-h-[100px] pr-16"
                />
                <div className="absolute top-3 right-3">
                  <Button
                    onClick={handleGenerateDesign}
                    disabled={!currentPrompt.trim() || isGenerating}
                    className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Design
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Suggestions:</p>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPrompt(suggestion.text)}
                      className="w-full text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <suggestion.icon className="h-4 w-4 jewelry-text-gold" />
                        <div>
                          <p className="text-sm jewelry-text-luxury">{suggestion.text}</p>
                          <p className="text-xs text-gray-300">
                            {suggestion.category} • <span className={getComplexityColor(suggestion.complexity)}>{suggestion.complexity}</span>
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Design Canvas */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 jewelry-text-gold" />
                <h3 className="text-lg font-semibold jewelry-text-luxury">Design Canvas</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`px-3 py-1 text-xs rounded ${viewMode === '2d' ? 'bg-blue-500 text-white' : 'text-gray-300'}`}
                  >
                    2D
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`px-3 py-1 text-xs rounded ${viewMode === '3d' ? 'bg-blue-500 text-white' : 'text-gray-300'}`}
                  >
                    3D
                  </button>
                  <button
                    onClick={() => setViewMode('both')}
                    className={`px-3 py-1 text-xs rounded ${viewMode === 'both' ? 'bg-blue-500 text-white' : 'text-gray-300'}`}
                  >
                    Both
                  </button>
                </div>
                <Button variant="outline" size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold" onClick={() => setShowGrid(!showGrid)}>
                  <Grid3X3 className="h-3 w-3" />
                  Grid
                </Button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-8 min-h-[400px] border border-white/10">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <Sparkles className="h-6 w-6 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium jewelry-text-luxury">AI is designing your furniture...</p>
                    <p className="text-sm text-gray-300">Analyzing dimensions, materials, and construction methods</p>
                  </div>
                  <div className="w-64">
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Processing...</span>
                      <span>73%</span>
                    </div>
                    <Progress value={73} className="h-2" />
                  </div>
                </div>
              ) : designOutput ? (
                <div className="space-y-6">
                  {/* Design Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-semibold jewelry-text-luxury mb-3">2D Technical Drawing</h4>
                      <div className="bg-white rounded-lg p-4 min-h-[250px] flex items-center justify-center">
                        <div className="text-center text-gray-600">
                          <Ruler className="h-12 w-12 mx-auto mb-2" />
                          <p>Technical Drawing Generated</p>
                          <p className="text-sm">Front, Side, Top & Isometric Views</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold jewelry-text-luxury mb-3">3D Visualization</h4>
                      <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-4 min-h-[250px] flex items-center justify-center">
                        <div className="text-center text-gray-700">
                          <Box className="h-12 w-12 mx-auto mb-2" />
                          <p>3D Model Generated</p>
                          <p className="text-sm">Interactive 360° View</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Design Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="jewelry-glass-card p-4">
                      <h5 className="font-medium jewelry-text-luxury mb-2">Dimensions</h5>
                      <p className="text-sm text-gray-300">
                        {designOutput.dimensions.length} × {designOutput.dimensions.width} × {designOutput.dimensions.height} cm
                      </p>
                    </div>
                    <div className="jewelry-glass-card p-4">
                      <h5 className="font-medium jewelry-text-luxury mb-2">Materials</h5>
                      <div className="space-y-1">
                        {designOutput.materials.map((material: string, index: number) => (
                          <p key={index} className="text-sm text-gray-300">{material}</p>
                        ))}
                      </div>
                    </div>
                    <div className="jewelry-glass-card p-4">
                      <h5 className="font-medium jewelry-text-luxury mb-2">Estimates</h5>
                      <p className="text-sm text-gray-300">Cost: ₹{designOutput.estimatedCost.toLocaleString()}</p>
                      <p className="text-sm text-gray-300">Time: {designOutput.estimatedTime}</p>
                    </div>
                  </div>

                  {/* Compliance & Validation */}
                  <div className="jewelry-glass-card p-4">
                    <h5 className="font-medium jewelry-text-luxury mb-3">Compliance & Validation</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-300">ADA Standards Met</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-300">Safety Requirements</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-300">Load Rating Adequate</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <PenTool className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg jewelry-text-luxury">Ready to Design</p>
                    <p className="text-gray-300">Describe your furniture idea above to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {designOutput && (
            <div className="flex flex-wrap gap-4">
              <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                <Wand2 className="h-4 w-4" />
                Modify Design
              </Button>
              <Button variant="outline" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                <Save className="h-4 w-4" />
                Save to Library
              </Button>
              <Button variant="outline" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                <Download className="h-4 w-4" />
                Export (DWG/DXF/PDF)
              </Button>
              <Button variant="outline" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                <Share2 className="h-4 w-4" />
                Share with Client
              </Button>
              <Button variant="outline" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                <FileText className="h-4 w-4" />
                Generate Cut List
              </Button>
            </div>
          )}

          {/* Material Stock & Cost Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Material Stock */}
            <div className="jewelry-glass-card p-6">
              <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Material Stock</h3>
              <div className="space-y-3">
                {materialStock.map((material, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TreePine className="h-4 w-4 jewelry-text-gold" />
                      <div>
                        <p className="font-medium jewelry-text-luxury text-sm">{material.name}</p>
                        <p className="text-xs text-gray-300">{material.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getStockStatusColor(material.status)}`}>
                        {material.inStock} {material.unit}
                      </p>
                      <p className="text-xs text-gray-300">₹{material.cost}/{material.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Design Statistics */}
            <div className="jewelry-glass-card p-6">
              <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Today's Activity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <p className="text-2xl font-bold jewelry-text-gold">12</p>
                  <p className="text-xs text-gray-300">Designs Created</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <p className="text-2xl font-bold jewelry-text-gold">47min</p>
                  <p className="text-xs text-gray-300">Total Time</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <p className="text-2xl font-bold jewelry-text-gold">₹2.1L</p>
                  <p className="text-xs text-gray-300">Est. Project Value</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <p className="text-2xl font-bold jewelry-text-gold">94%</p>
                  <p className="text-xs text-gray-300">Client Approval</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  Time Saved Today
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Traditional: 18 hours → AI: 47 minutes (95% faster)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}