/**
 * HERA v3.0 Brand Theme Gallery
 * Browse and apply industry-specific brand themes
 */

'use client'

import React, { useState, useEffect } from 'react'
import { brandingEngine } from '@/lib/platform/branding-engine'
import { 
  getIndustryThemes, 
  getAllThemes, 
  getThemesByTags,
  type IndustryTheme 
} from '@/lib/platform/industry-themes'
import { type IndustryType, INDUSTRY_TYPES } from '@/lib/platform/constants'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Palette,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Check,
  Zap,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ThemeGalleryProps {
  organizationId: string
  currentIndustry?: IndustryType
  onThemeApplied?: (theme: IndustryTheme) => void
}

export default function ThemeGallery({ 
  organizationId, 
  currentIndustry = INDUSTRY_TYPES.GENERIC_BUSINESS,
  onThemeApplied 
}: ThemeGalleryProps) {
  const { toast } = useToast()
  const [themes, setThemes] = useState<IndustryTheme[]>([])
  const [filteredThemes, setFilteredThemes] = useState<IndustryTheme[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | 'all'>(currentIndustry)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isApplying, setIsApplying] = useState<string | null>(null)
  const [previewTheme, setPreviewTheme] = useState<IndustryTheme | null>(null)

  // Available tags for filtering
  const availableTags = [
    'luxury', 'modern', 'professional', 'clean', 'vibrant', 'dark', 'light',
    'minimal', 'bold', 'elegant', 'friendly', 'trustworthy', 'accessible'
  ]

  useEffect(() => {
    loadThemes()
  }, [])

  useEffect(() => {
    filterThemes()
  }, [themes, selectedIndustry, searchQuery, selectedTags])

  const loadThemes = () => {
    const allThemes = getAllThemes()
    setThemes(allThemes)
    setFilteredThemes(allThemes)
  }

  const filterThemes = () => {
    let filtered = themes

    // Filter by industry
    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(theme => theme.industry === selectedIndustry)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(theme => 
        theme.name.toLowerCase().includes(query) ||
        theme.description.toLowerCase().includes(query) ||
        theme.tags.some(tag => tag.includes(query))
      )
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(theme =>
        selectedTags.every(tag => theme.tags.includes(tag))
      )
    }

    setFilteredThemes(filtered)
  }

  const handleApplyTheme = async (theme: IndustryTheme) => {
    setIsApplying(theme.name)
    
    try {
      const success = await brandingEngine.updateBranding(organizationId, theme.theme)
      
      if (success) {
        toast({
          title: "✅ Theme Applied",
          description: `${theme.name} has been applied to your organization`,
          duration: 3000
        })
        
        onThemeApplied?.(theme)
      } else {
        throw new Error('Failed to apply theme')
      }
    } catch (error) {
      toast({
        title: "❌ Application Failed",
        description: `Failed to apply ${theme.name}. Please try again.`,
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setIsApplying(null)
    }
  }

  const handlePreviewTheme = async (theme: IndustryTheme) => {
    setPreviewTheme(theme)
    
    // Apply temporarily for preview
    await brandingEngine.updateBranding(organizationId, theme.theme)
    
    // Auto-revert preview after 5 seconds
    setTimeout(() => {
      if (previewTheme?.name === theme.name) {
        setPreviewTheme(null)
      }
    }, 5000)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const getThemePreviewColors = (theme: IndustryTheme) => [
    theme.theme.primary_color,
    theme.theme.secondary_color,
    theme.theme.accent_color,
    theme.theme.background_color
  ]

  const industries: { value: IndustryType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Industries' },
    { value: INDUSTRY_TYPES.SALON_BEAUTY, label: 'Salon & Beauty' },
    { value: INDUSTRY_TYPES.RESTAURANT, label: 'Restaurant' },
    { value: INDUSTRY_TYPES.RETAIL, label: 'Retail' },
    { value: INDUSTRY_TYPES.CONSTRUCTION, label: 'Construction' },
    { value: INDUSTRY_TYPES.HEALTHCARE, label: 'Healthcare' },
    { value: INDUSTRY_TYPES.WASTE_MANAGEMENT, label: 'Waste Management' },
    { value: INDUSTRY_TYPES.GENERIC_BUSINESS, label: 'General Business' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="w-6 h-6" />
          Brand Theme Gallery
        </h2>
        <p className="text-gray-600 mt-1">
          Choose from professionally designed themes for your industry
        </p>
      </div>

      {/* Preview Banner */}
      {previewTheme && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    Previewing: {previewTheme.name}
                  </p>
                  <p className="text-sm text-blue-700">
                    This preview will auto-revert in a few seconds
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTheme(null)}
              >
                End Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search Themes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Industry Filter */}
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select
                value={selectedIndustry}
                onValueChange={(value) => setSelectedIndustry(value as IndustryType | 'all')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            <div className="space-y-2">
              <Label>Results</Label>
              <div className="h-10 flex items-center">
                <Badge variant="secondary">
                  {filteredThemes.length} theme{filteredThemes.length !== 1 ? 's' : ''} found
                </Badge>
              </div>
            </div>
          </div>

          {/* Tag Filters */}
          <div className="mt-4">
            <Label className="mb-2 block">Filter by Style</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((theme) => (
          <Card key={`${theme.industry}-${theme.name}`} className="relative group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{theme.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {theme.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-2">
                  {theme.industry}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Color Preview */}
              <div className="space-y-2">
                <Label className="text-xs">Color Palette</Label>
                <div className="flex gap-2">
                  {getThemePreviewColors(theme).map((color, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded border-2 border-gray-200"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Typography Preview */}
              <div className="space-y-1">
                <Label className="text-xs">Typography</Label>
                <div className="text-sm">
                  <div 
                    className="font-bold"
                    style={{ fontFamily: theme.theme.font_family_heading }}
                  >
                    {theme.theme.font_family_heading}
                  </div>
                  <div 
                    className="text-gray-600"
                    style={{ fontFamily: theme.theme.font_family_body }}
                  >
                    {theme.theme.font_family_body}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {theme.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {theme.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{theme.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreviewTheme(theme)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApplyTheme(theme)}
                  disabled={isApplying !== null}
                  className="flex-1"
                >
                  {isApplying === theme.name ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-1 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-1" />
                      Apply
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredThemes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No themes found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search terms to find more themes.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedTags([])
                setSelectedIndustry('all')
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}