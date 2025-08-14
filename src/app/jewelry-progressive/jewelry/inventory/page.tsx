'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getHeraApi } from '@/lib/hera-api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { 
  Package, 
  Search, 
  Plus, 
  Filter,
  Download,
  Upload,
  Gem,
  Crown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  BarChart3,
  Tag,
  Ruler,
  Scale,
  Palette,
  Shield,
  Calendar,
  DollarSign,
  ArrowUpDown,
  X,
  Camera,
  Sparkles,
  Star,
  Loader2
} from 'lucide-react'

// Jewelry-specific inventory item interface
interface JewelryItem {
  id: string
  sku: string
  name: string
  category: string
  subCategory: string
  metalType: string
  metalPurity: string
  metalWeight: number
  primaryStone?: string
  primaryStoneWeight?: number
  primaryStoneQuality?: string
  secondaryStones?: string
  totalCaratWeight?: number
  size?: string
  length?: string
  costPrice: number
  retailPrice: number
  wholesalePrice?: number
  stockLevel: number
  reorderLevel: number
  location: string
  supplier: string
  certification?: string
  images?: string[]
  tags: string[]
  createdAt: string
  lastSold?: string
  turnoverRate?: number
  profitMargin: number
}

// Demo inventory data with realistic jewelry items
const demoInventory: JewelryItem[] = [
  {
    id: 'JWL-001',
    sku: 'SOL-DIA-001',
    name: 'Classic Solitaire Diamond Ring',
    category: 'Rings',
    subCategory: 'Engagement',
    metalType: '18K White Gold',
    metalPurity: '750',
    metalWeight: 3.5,
    primaryStone: 'Diamond',
    primaryStoneWeight: 1.01,
    primaryStoneQuality: 'VS1/F',
    totalCaratWeight: 1.01,
    size: '6.5',
    costPrice: 4200,
    retailPrice: 8499,
    wholesalePrice: 6300,
    stockLevel: 3,
    reorderLevel: 2,
    location: 'Safe A1-12',
    supplier: 'Premier Diamonds Ltd',
    certification: 'GIA #2341567890',
    tags: ['bestseller', 'engagement', 'certified'],
    createdAt: '2024-01-15',
    lastSold: '2024-12-18',
    turnoverRate: 4.2,
    profitMargin: 50.6
  },
  {
    id: 'JWL-002',
    sku: 'NECK-PRL-002',
    name: 'Akoya Pearl Necklace',
    category: 'Necklaces',
    subCategory: 'Pearl',
    metalType: '14K Yellow Gold',
    metalPurity: '585',
    metalWeight: 8.2,
    primaryStone: 'Akoya Pearls',
    primaryStoneWeight: 7.5,
    primaryStoneQuality: 'AAA',
    length: '18 inches',
    costPrice: 1200,
    retailPrice: 2899,
    wholesalePrice: 2100,
    stockLevel: 7,
    reorderLevel: 3,
    location: 'Display Case B3',
    supplier: 'Pacific Pearl Co',
    tags: ['classic', 'wedding', 'gift'],
    createdAt: '2024-02-20',
    lastSold: '2024-12-10',
    turnoverRate: 3.1,
    profitMargin: 58.6
  },
  {
    id: 'JWL-003',
    sku: 'BRC-TEN-003',
    name: 'Diamond Tennis Bracelet',
    category: 'Bracelets',
    subCategory: 'Tennis',
    metalType: '14K White Gold',
    metalPurity: '585',
    metalWeight: 12.5,
    primaryStone: 'Diamond',
    primaryStoneWeight: 5.25,
    primaryStoneQuality: 'SI1/G-H',
    totalCaratWeight: 5.25,
    length: '7 inches',
    costPrice: 3800,
    retailPrice: 7999,
    wholesalePrice: 5700,
    stockLevel: 2,
    reorderLevel: 1,
    location: 'Safe B2-08',
    supplier: 'Luxury Gems Inc',
    certification: 'IGI #LG2024789',
    tags: ['luxury', 'anniversary', 'statement'],
    createdAt: '2024-03-10',
    lastSold: '2024-12-15',
    turnoverRate: 2.8,
    profitMargin: 52.4
  },
  {
    id: 'JWL-004',
    sku: 'EAR-STD-004',
    name: 'Diamond Stud Earrings',
    category: 'Earrings',
    subCategory: 'Studs',
    metalType: '18K White Gold',
    metalPurity: '750',
    metalWeight: 2.1,
    primaryStone: 'Diamond',
    primaryStoneWeight: 1.5,
    primaryStoneQuality: 'VS2/G',
    totalCaratWeight: 1.5,
    costPrice: 2100,
    retailPrice: 4299,
    wholesalePrice: 3150,
    stockLevel: 5,
    reorderLevel: 3,
    location: 'Display Case A2',
    supplier: 'Premier Diamonds Ltd',
    certification: 'GIA #2341567891',
    tags: ['popular', 'daily-wear', 'gift'],
    createdAt: '2024-01-20',
    lastSold: '2024-12-19',
    turnoverRate: 6.2,
    profitMargin: 51.2
  },
  {
    id: 'JWL-005',
    sku: 'RNG-COC-005',
    name: 'Vintage Ruby Cocktail Ring',
    category: 'Rings',
    subCategory: 'Cocktail',
    metalType: '18K Rose Gold',
    metalPurity: '750',
    metalWeight: 8.7,
    primaryStone: 'Ruby',
    primaryStoneWeight: 3.2,
    primaryStoneQuality: 'AAA',
    secondaryStones: 'Diamond',
    totalCaratWeight: 4.1,
    size: '7',
    costPrice: 5500,
    retailPrice: 12999,
    wholesalePrice: 9000,
    stockLevel: 1,
    reorderLevel: 1,
    location: 'Safe C1-03',
    supplier: 'Estate Jewelry Co',
    certification: 'AGL #1234567',
    tags: ['vintage', 'rare', 'investment'],
    createdAt: '2024-04-05',
    lastSold: '2024-11-28',
    turnoverRate: 1.5,
    profitMargin: 57.7
  }
]

// Category statistics
const categoryStats = {
  'Rings': { count: 156, value: 1234000 },
  'Necklaces': { count: 89, value: 567000 },
  'Bracelets': { count: 67, value: 445000 },
  'Earrings': { count: 134, value: 389000 },
  'Watches': { count: 23, value: 890000 },
  'Other': { count: 45, value: 123000 }
}

function JewelryInventory() {
  const { workspace, isAnonymous } = useAuth()
  const [inventory, setInventory] = useState<JewelryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('sku')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedItem, setSelectedItem] = useState<JewelryItem | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{success: number, failed: number, errors: string[]}>({success: 0, failed: 0, errors: []})
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [newItemData, setNewItemData] = useState<Partial<JewelryItem>>({
    category: 'Rings',
    metalType: '14K Yellow Gold',
    stockLevel: 1,
    reorderLevel: 1,
    location: 'Main Store',
    status: 'active'
  })

  // Load inventory from HERA Universal API
  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setIsLoading(true)
      const heraApi = getHeraApi()
      
      console.log('🔗 HERA API Connection Test - Loading jewelry inventory...')
      
      // Test API connectivity first
      try {
        const testResponse = await fetch('/api/v1/test-jewelry-crud')
        const testData = await testResponse.json()
        console.log('✅ HERA API Test:', testData)
      } catch (testError) {
        console.log('⚠️ API Test Error:', testError)
      }
      
      // Fetch jewelry products from universal entities
      const entities = await heraApi.getEntities('jewelry_product')
      
      // If no entities found, use demo data for now
      if (!entities || entities.length === 0) {
        setInventory(demoInventory)
        console.log('📦 Using demo inventory data - No entities found in universal API')
        console.log('🏗️ Universal Architecture: core_entities -> entity_type="jewelry_product"')
        console.log('💎 Demo Items Loaded:', demoInventory.length)
      } else {
        // Transform HERA entities to JewelryItem format
        const jewelryItems = await Promise.all(entities.map(async (entity: any) => {
          // Get dynamic data for this entity
          const dynamicData = await heraApi.getDynamicData(entity.id)
          
          return {
            id: entity.id,
            sku: entity.entity_code,
            name: entity.entity_name,
            category: dynamicData.category || 'Other',
            subCategory: dynamicData.sub_category || '',
            metalType: dynamicData.metal_type || '',
            metalPurity: dynamicData.metal_purity || '',
            metalWeight: parseFloat(dynamicData.metal_weight) || 0,
            primaryStone: dynamicData.primary_stone,
            primaryStoneWeight: parseFloat(dynamicData.primary_stone_weight) || 0,
            primaryStoneQuality: dynamicData.primary_stone_quality,
            secondaryStones: dynamicData.secondary_stones,
            totalCaratWeight: parseFloat(dynamicData.total_carat_weight) || 0,
            size: dynamicData.size,
            length: dynamicData.length,
            costPrice: parseFloat(dynamicData.cost_price) || 0,
            retailPrice: parseFloat(dynamicData.retail_price) || 0,
            wholesalePrice: parseFloat(dynamicData.wholesale_price),
            stockLevel: parseInt(dynamicData.stock_level) || 0,
            reorderLevel: parseInt(dynamicData.reorder_level) || 0,
            location: dynamicData.location || '',
            supplier: dynamicData.supplier || '',
            certification: dynamicData.certification,
            images: dynamicData.images ? JSON.parse(dynamicData.images) : [],
            tags: dynamicData.tags ? JSON.parse(dynamicData.tags) : [],
            createdAt: entity.created_at,
            lastSold: dynamicData.last_sold,
            turnoverRate: parseFloat(dynamicData.turnover_rate) || 0,
            profitMargin: parseFloat(dynamicData.profit_margin) || 0
          }
        }))
        
        setInventory(jewelryItems)
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
      // Fall back to demo data on error
      setInventory(demoInventory)
    } finally {
      setIsLoading(false)
    }
  }

  // Create new jewelry item using Universal API
  const createJewelryItem = async (itemData: Partial<JewelryItem>) => {
    try {
      setIsSaving(true)
      const heraApi = getHeraApi()
      
      // Create entity in core_entities
      const entity = await heraApi.createEntity({
        entity_type: 'jewelry_product',
        entity_code: itemData.sku,
        entity_name: itemData.name,
        status: 'active',
        organization_id: user?.organizationId
      })
      
      // Save all jewelry-specific data to core_dynamic_data
      const dynamicFields = {
        category: itemData.category,
        sub_category: itemData.subCategory,
        metal_type: itemData.metalType,
        metal_purity: itemData.metalPurity,
        metal_weight: itemData.metalWeight?.toString(),
        primary_stone: itemData.primaryStone,
        primary_stone_weight: itemData.primaryStoneWeight?.toString(),
        primary_stone_quality: itemData.primaryStoneQuality,
        secondary_stones: itemData.secondaryStones,
        total_carat_weight: itemData.totalCaratWeight?.toString(),
        size: itemData.size,
        length: itemData.length,
        cost_price: itemData.costPrice?.toString(),
        retail_price: itemData.retailPrice?.toString(),
        wholesale_price: itemData.wholesalePrice?.toString(),
        stock_level: itemData.stockLevel?.toString(),
        reorder_level: itemData.reorderLevel?.toString(),
        location: itemData.location,
        supplier: itemData.supplier,
        certification: itemData.certification,
        images: JSON.stringify(itemData.images || []),
        tags: JSON.stringify(itemData.tags || []),
        turnover_rate: itemData.turnoverRate?.toString(),
        profit_margin: itemData.profitMargin?.toString()
      }
      
      // Save each dynamic field
      for (const [fieldName, fieldValue] of Object.entries(dynamicFields)) {
        if (fieldValue !== undefined && fieldValue !== null) {
          await heraApi.updateDynamicData(entity.id, fieldName, fieldValue)
        }
      }
      
      // Reload inventory
      await loadInventory()
      
      return entity
    } catch (error) {
      console.error('Failed to create jewelry item:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Update jewelry item using Universal API
  const updateJewelryItem = async (itemId: string, updates: Partial<JewelryItem>) => {
    try {
      setIsSaving(true)
      const heraApi = getHeraApi()
      
      // Update entity basic info if needed
      if (updates.name || updates.sku) {
        await heraApi.updateEntity(itemId, {
          entity_name: updates.name,
          entity_code: updates.sku
        })
      }
      
      // Update dynamic data fields
      const dynamicUpdates: Record<string, string> = {}
      if (updates.category !== undefined) dynamicUpdates.category = updates.category
      if (updates.metalType !== undefined) dynamicUpdates.metal_type = updates.metalType
      if (updates.stockLevel !== undefined) dynamicUpdates.stock_level = updates.stockLevel.toString()
      if (updates.retailPrice !== undefined) dynamicUpdates.retail_price = updates.retailPrice.toString()
      // ... add other fields as needed
      
      for (const [fieldName, fieldValue] of Object.entries(dynamicUpdates)) {
        await heraApi.updateDynamicData(itemId, fieldName, fieldValue)
      }
      
      // Reload inventory
      await loadInventory()
    } catch (error) {
      console.error('Failed to update jewelry item:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Bulk Import Functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
        alert('Please select a CSV or Excel file')
        return
      }
      setImportFile(file)
      setImportResults({success: 0, failed: 0, errors: []})
    }
  }

  const parseCSVData = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const item: any = {}
      
      headers.forEach((header, index) => {
        item[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || ''
      })
      
      // Map CSV columns to our jewelry item structure
      const jewelryItem = {
        sku: item.sku || item.product_code || `SKU-${Date.now()}-${i}`,
        name: item.name || item.product_name || item.title || 'Unknown Item',
        category: item.category || 'Uncategorized',
        subCategory: item.sub_category || item.subcategory || '',
        metalType: item.metal_type || item.metal || '',
        metalPurity: item.metal_purity || item.purity || '',
        metalWeight: parseFloat(item.metal_weight || item.weight || '0'),
        primaryStone: item.primary_stone || item.stone || '',
        primaryStoneWeight: parseFloat(item.stone_weight || item.carat || '0'),
        stockLevel: parseInt(item.stock_level || item.quantity || item.stock || '1'),
        retailPrice: parseFloat(item.retail_price || item.price || item.selling_price || '0'),
        costPrice: parseFloat(item.cost_price || item.cost || item.wholesale_price || '0'),
        reorderLevel: parseInt(item.reorder_level || item.min_stock || '1'),
        location: item.location || item.warehouse || 'Main Store',
        supplier: item.supplier || item.vendor || 'Unknown',
        tags: item.tags ? item.tags.split(';').map((t: string) => t.trim()) : [],
        status: (item.status || 'active').toLowerCase() as 'active' | 'inactive'
      }

      data.push(jewelryItem)
    }

    return data
  }

  const bulkImportItems = async () => {
    if (!importFile) return

    try {
      setIsImporting(true)
      setImportProgress(0)
      
      const fileText = await importFile.text()
      const itemsToImport = parseCSVData(fileText)
      
      if (itemsToImport.length === 0) {
        alert('No valid data found in file. Please check the format.')
        return
      }

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (let i = 0; i < itemsToImport.length; i++) {
        try {
          console.log(`🔄 Importing item ${i + 1}/${itemsToImport.length}:`, itemsToImport[i].name)
          await createJewelryItem(itemsToImport[i])
          successCount++
          console.log(`✅ Successfully imported: ${itemsToImport[i].name}`)
        } catch (error) {
          failedCount++
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Row ${i + 2} (${itemsToImport[i].name || itemsToImport[i].sku}): ${errorMsg}`)
          console.error(`❌ Failed to import: ${itemsToImport[i].name}`, error)
        }
        
        // Update progress
        setImportProgress(Math.round(((i + 1) / itemsToImport.length) * 100))
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setImportResults({success: successCount, failed: failedCount, errors})
      
      if (successCount > 0) {
        await loadInventory() // Refresh inventory
      }

    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please check your file format.')
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = [
      'sku,name,category,metal_type,metal_purity,metal_weight,primary_stone,stone_weight,stock_level,retail_price,cost_price,location,supplier,tags',
      'RING-001,"Diamond Solitaire Ring",Rings,18K White Gold,750,5.2,Diamond,1.5,1,2500,1200,Main Store,Diamond Supplier,"engagement;luxury"',
      'NECK-002,"Pearl Necklace",Necklaces,Sterling Silver,925,15.8,Pearl,0,2,450,200,Display Case,Pearl Supplier,"classic;elegant"',
      'EAR-003,"Gold Hoop Earrings",Earrings,14K Yellow Gold,585,3.4,,0,3,185,90,Jewelry Safe,Gold Supplier,"casual;everyday"'
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'jewelry_import_template.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  // Add Item Functions
  const handleAddItem = async () => {
    if (!newItemData.sku || !newItemData.name || !newItemData.retailPrice) {
      alert('Please fill in required fields: SKU, Name, and Retail Price')
      return
    }

    try {
      console.log('🔄 Creating new jewelry item:', newItemData)
      await createJewelryItem(newItemData)
      
      // Reset form and close modal
      setNewItemData({
        category: 'Rings',
        metalType: '14K Yellow Gold',
        stockLevel: 1,
        reorderLevel: 1,
        location: 'Main Store',
        status: 'active'
      })
      setShowAddItemModal(false)
      
      console.log('✅ Successfully created new jewelry item')
    } catch (error) {
      console.error('❌ Failed to create jewelry item:', error)
      alert('Failed to create jewelry item. Please try again.')
    }
  }

  const updateNewItemData = (field: keyof JewelryItem, value: any) => {
    setNewItemData(prev => ({ ...prev, [field]: value }))
  }

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.primaryStone?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'sku': return a.sku.localeCompare(b.sku)
        case 'name': return a.name.localeCompare(b.name)
        case 'value': return (b.retailPrice * b.stockLevel) - (a.retailPrice * a.stockLevel)
        case 'stock': return b.stockLevel - a.stockLevel
        default: return 0
      }
    })

  // Calculate inventory metrics
  const totalValue = inventory.reduce((sum, item) => sum + (item.retailPrice * item.stockLevel), 0)
  const totalItems = inventory.reduce((sum, item) => sum + item.stockLevel, 0)
  const lowStockItems = inventory.filter(item => item.stockLevel <= item.reorderLevel).length
  const avgTurnover = inventory.reduce((sum, item) => sum + (item.turnoverRate || 0), 0) / inventory.length

  // Public access - no authentication required
  const publicUser = user || {
    id: 'public-user',
    name: 'Guest User',
    email: 'guest@jewelry.com',
    organization_id: 'public-org',
    organization_name: 'Public Demo'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => window.location.href = '/jewelry'} className="text-gray-600 hover:text-gray-900">
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-purple-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Jewelry Inventory</h1>
                  <p className="text-xs text-gray-500">Professional inventory management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Navigation */}
              <JewelryTeamsSidebar />
              
              {/* API Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-700">HERA Universal API</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                size="sm"
                onClick={() => setShowAddItemModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-gray-600">Loading jewelry inventory...</p>
              <p className="text-sm text-gray-500 mt-2">Connecting to HERA Universal API</p>
            </div>
          </div>
        ) : (
          <>
        {/* Inventory Content */}
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Turnover Rate</p>
                <p className="text-2xl font-bold text-gray-900">{avgTurnover.toFixed(1)}x</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6 bg-white/90 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by SKU, name, or stone type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white text-sm"
              >
                <option value="all">All Categories</option>
                <option value="Rings">Rings</option>
                <option value="Necklaces">Necklaces</option>
                <option value="Bracelets">Bracelets</option>
                <option value="Earrings">Earrings</option>
                <option value="Watches">Watches</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white text-sm"
              >
                <option value="sku">Sort by SKU</option>
                <option value="name">Sort by Name</option>
                <option value="value">Sort by Value</option>
                <option value="stock">Sort by Stock</option>
              </select>

              <Button 
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Inventory Table/Grid */}
        {viewMode === 'list' ? (
          <Card className="overflow-hidden bg-white/90 backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU / Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category / Metal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stone Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.sku}</p>
                          <p className="text-sm text-gray-600">{item.name}</p>
                          <div className="flex gap-1 mt-1">
                            {item.tags.map(tag => (
                              <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.category}</p>
                          <p className="text-sm text-gray-600">{item.metalType}</p>
                          <p className="text-xs text-gray-500">{item.metalWeight}g</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          {item.primaryStone && (
                            <>
                              <p className="text-sm font-medium text-gray-900">
                                {item.primaryStone}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.primaryStoneWeight}ct {item.primaryStoneQuality}
                              </p>
                              {item.certification && (
                                <p className="text-xs text-blue-600">{item.certification}</p>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            item.stockLevel <= item.reorderLevel ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {item.stockLevel}
                          </span>
                          {item.stockLevel <= item.reorderLevel && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Reorder: {item.reorderLevel}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ${item.retailPrice.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            Cost: ${item.costPrice.toLocaleString()}
                          </p>
                          <p className="text-xs text-green-600">
                            Margin: {item.profitMargin}%
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{item.location}</p>
                          <p className="text-xs text-gray-500">{item.supplier}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow bg-white/90 backdrop-blur">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ${item.retailPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      {item.profitMargin}% margin
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Metal:</span>
                    <span className="font-medium">{item.metalType}</span>
                  </div>
                  {item.primaryStone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stone:</span>
                      <span className="font-medium">
                        {item.primaryStone} {item.primaryStoneWeight}ct
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`font-medium ${
                      item.stockLevel <= item.reorderLevel ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {item.stockLevel} units
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedItem(item)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                    <p className="text-gray-600">{selectedItem.sku}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItem(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Gem className="w-5 h-5 text-purple-600" />
                        Product Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium">{selectedItem.category} - {selectedItem.subCategory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Metal:</span>
                          <span className="font-medium">{selectedItem.metalType} ({selectedItem.metalPurity})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Metal Weight:</span>
                          <span className="font-medium">{selectedItem.metalWeight}g</span>
                        </div>
                        {selectedItem.size && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Size:</span>
                            <span className="font-medium">{selectedItem.size}</span>
                          </div>
                        )}
                        {selectedItem.length && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Length:</span>
                            <span className="font-medium">{selectedItem.length}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedItem.primaryStone && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Star className="w-5 h-5 text-purple-600" />
                          Stone Information
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Primary Stone:</span>
                            <span className="font-medium">{selectedItem.primaryStone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Weight:</span>
                            <span className="font-medium">{selectedItem.primaryStoneWeight}ct</span>
                          </div>
                          {selectedItem.primaryStoneQuality && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Quality:</span>
                              <span className="font-medium">{selectedItem.primaryStoneQuality}</span>
                            </div>
                          )}
                          {selectedItem.certification && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Certification:</span>
                              <span className="font-medium text-blue-600">{selectedItem.certification}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Inventory & Pricing */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        Pricing Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost Price:</span>
                          <span className="font-medium">${selectedItem.costPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Retail Price:</span>
                          <span className="font-medium text-lg">${selectedItem.retailPrice.toLocaleString()}</span>
                        </div>
                        {selectedItem.wholesalePrice && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Wholesale:</span>
                            <span className="font-medium">${selectedItem.wholesalePrice.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Profit Margin:</span>
                          <span className="font-medium text-green-600">{selectedItem.profitMargin}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        Inventory Status
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Stock:</span>
                          <span className={`font-medium ${
                            selectedItem.stockLevel <= selectedItem.reorderLevel ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {selectedItem.stockLevel} units
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reorder Level:</span>
                          <span className="font-medium">{selectedItem.reorderLevel} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{selectedItem.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier:</span>
                          <span className="font-medium">{selectedItem.supplier}</span>
                        </div>
                        {selectedItem.turnoverRate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Turnover Rate:</span>
                            <span className="font-medium">{selectedItem.turnoverRate}x/year</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map(tag => (
                          <span key={tag} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                  <Button variant="outline">
                    <Camera className="w-4 h-4 mr-2" />
                    Add Photos
                  </Button>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Item
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Sales History
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bulk Import Jewelry Items</h2>
                    <p className="text-gray-600">Import multiple items from CSV or Excel file</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFile(null)
                      setImportResults({success: 0, failed: 0, errors: []})
                      setImportProgress(0)
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Step 1: File Selection */}
                {!isImporting && importResults.success === 0 && importResults.failed === 0 && (
                  <div className="space-y-6">
                    {/* Download Template */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Download className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 mb-1">Start with our template</h3>
                          <p className="text-sm text-blue-700 mb-3">
                            Download our CSV template with the correct format and example data.
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                              onClick={downloadTemplate}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Template
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-100"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = '/sample-jewelry-import.csv'
                                link.download = 'sample-jewelry-import.csv'
                                link.click()
                              }}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Sample Data
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="import-file"
                      />
                      <label htmlFor="import-file" className="cursor-pointer">
                        <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                          <Upload className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {importFile ? importFile.name : 'Choose file to import'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {importFile 
                            ? `File selected: ${(importFile.size / 1024).toFixed(1)} KB`
                            : 'Drag and drop your CSV or Excel file here, or click to browse'
                          }
                        </p>
                        {!importFile && (
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                            <Upload className="w-4 h-4 mr-2" />
                            Select File
                          </Button>
                        )}
                      </label>
                    </div>

                    {/* Supported Formats */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Supported Formats</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <strong>Required columns:</strong> sku, name, category, retail_price
                        </div>
                        <div>
                          <strong>Optional columns:</strong> metal_type, stone, stock_level, cost_price
                        </div>
                        <div>
                          <strong>File types:</strong> CSV, Excel (.xlsx, .xls)
                        </div>
                        <div>
                          <strong>Max size:</strong> 10MB, 10,000 items
                        </div>
                      </div>
                    </div>

                    {/* Import Button */}
                    {importFile && (
                      <div className="flex justify-end gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setImportFile(null)
                            setImportResults({success: 0, failed: 0, errors: []})
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          onClick={bulkImportItems}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Start Import
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Import Progress */}
                {isImporting && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Importing Items...</h3>
                      <p className="text-gray-600">Please wait while we import your jewelry items.</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{importProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${importProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-yellow-700">
                        ⚠️ Do not close this window during import. Large files may take several minutes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Import Results */}
                {!isImporting && (importResults.success > 0 || importResults.failed > 0) && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        importResults.failed === 0 
                          ? 'bg-green-100' 
                          : importResults.success === 0 
                            ? 'bg-red-100' 
                            : 'bg-yellow-100'
                      }`}>
                        {importResults.failed === 0 ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : importResults.success === 0 ? (
                          <AlertCircle className="w-8 h-8 text-red-600" />
                        ) : (
                          <AlertCircle className="w-8 h-8 text-yellow-600" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Complete</h3>
                    </div>

                    {/* Results Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{importResults.success}</div>
                        <div className="text-sm text-green-600">Items Imported</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{importResults.failed}</div>
                        <div className="text-sm text-red-600">Items Failed</div>
                      </div>
                    </div>

                    {/* Error Details */}
                    {importResults.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-900 mb-2">Import Errors</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {importResults.errors.slice(0, 10).map((error, index) => (
                            <p key={index} className="text-sm text-red-700">{error}</p>
                          ))}
                          {importResults.errors.length > 10 && (
                            <p className="text-sm text-red-600 italic">
                              ... and {importResults.errors.length - 10} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setImportFile(null)
                          setImportResults({success: 0, failed: 0, errors: []})
                          setImportProgress(0)
                        }}
                      >
                        Import More
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        onClick={() => {
                          setShowImportModal(false)
                          setImportFile(null)
                          setImportResults({success: 0, failed: 0, errors: []})
                          setImportProgress(0)
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add New Jewelry Item</h2>
                    <p className="text-gray-600">Create a new item in your inventory</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddItemModal(false)
                      setNewItemData({
                        category: 'Rings',
                        metalType: '14K Yellow Gold',
                        stockLevel: 1,
                        reorderLevel: 1,
                        location: 'Main Store',
                        status: 'active'
                      })
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      
                      {/* SKU */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          SKU <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={newItemData.sku || ''}
                          onChange={(e) => updateNewItemData('sku', e.target.value)}
                          placeholder="e.g., RING-001"
                          className="w-full"
                        />
                      </div>

                      {/* Name */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Item Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={newItemData.name || ''}
                          onChange={(e) => updateNewItemData('name', e.target.value)}
                          placeholder="e.g., Diamond Solitaire Ring"
                          className="w-full"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          value={newItemData.category || 'Rings'}
                          onChange={(e) => updateNewItemData('category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Rings">Rings</option>
                          <option value="Necklaces">Necklaces</option>
                          <option value="Earrings">Earrings</option>
                          <option value="Bracelets">Bracelets</option>
                          <option value="Pendants">Pendants</option>
                          <option value="Watches">Watches</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={newItemData.description || ''}
                          onChange={(e) => updateNewItemData('description', e.target.value)}
                          placeholder="Detailed description of the jewelry item..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Metal & Stone Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Metal & Stone Details</h3>
                      
                      {/* Metal Type */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Metal Type</label>
                        <select
                          value={newItemData.metalType || '14K Yellow Gold'}
                          onChange={(e) => updateNewItemData('metalType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="10K Yellow Gold">10K Yellow Gold</option>
                          <option value="14K Yellow Gold">14K Yellow Gold</option>
                          <option value="18K Yellow Gold">18K Yellow Gold</option>
                          <option value="14K White Gold">14K White Gold</option>
                          <option value="18K White Gold">18K White Gold</option>
                          <option value="14K Rose Gold">14K Rose Gold</option>
                          <option value="18K Rose Gold">18K Rose Gold</option>
                          <option value="Sterling Silver">Sterling Silver</option>
                          <option value="Platinum">Platinum</option>
                          <option value="Titanium">Titanium</option>
                          <option value="Stainless Steel">Stainless Steel</option>
                        </select>
                      </div>

                      {/* Metal Purity & Weight */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Metal Purity</label>
                          <Input
                            value={newItemData.metalPurity || ''}
                            onChange={(e) => updateNewItemData('metalPurity', e.target.value)}
                            placeholder="e.g., 585, 750, 925"
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Weight (g)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={newItemData.metalWeight || ''}
                            onChange={(e) => updateNewItemData('metalWeight', parseFloat(e.target.value) || 0)}
                            placeholder="0.0"
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Primary Stone */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Primary Stone</label>
                        <select
                          value={newItemData.primaryStone || ''}
                          onChange={(e) => updateNewItemData('primaryStone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">No Stone</option>
                          <option value="Diamond">Diamond</option>
                          <option value="Ruby">Ruby</option>
                          <option value="Sapphire">Sapphire</option>
                          <option value="Emerald">Emerald</option>
                          <option value="Pearl">Pearl</option>
                          <option value="Amethyst">Amethyst</option>
                          <option value="Topaz">Topaz</option>
                          <option value="Garnet">Garnet</option>
                          <option value="Opal">Opal</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Stone Weight */}
                      {newItemData.primaryStone && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Stone Weight (carats)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newItemData.primaryStoneWeight || ''}
                            onChange={(e) => updateNewItemData('primaryStoneWeight', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Full Width - Pricing & Inventory */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Retail Price */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Retail Price <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItemData.retailPrice || ''}
                          onChange={(e) => updateNewItemData('retailPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full"
                        />
                      </div>

                      {/* Cost Price */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItemData.costPrice || ''}
                          onChange={(e) => updateNewItemData('costPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full"
                        />
                      </div>

                      {/* Stock Level */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Stock Level</label>
                        <Input
                          type="number"
                          value={newItemData.stockLevel || 1}
                          onChange={(e) => updateNewItemData('stockLevel', parseInt(e.target.value) || 1)}
                          min="0"
                          className="w-full"
                        />
                      </div>

                      {/* Reorder Level */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
                        <Input
                          type="number"
                          value={newItemData.reorderLevel || 1}
                          onChange={(e) => updateNewItemData('reorderLevel', parseInt(e.target.value) || 1)}
                          min="0"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Location & Supplier */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <select
                          value={newItemData.location || 'Main Store'}
                          onChange={(e) => updateNewItemData('location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Main Store">Main Store</option>
                          <option value="Display Case">Display Case</option>
                          <option value="Jewelry Safe">Jewelry Safe</option>
                          <option value="VIP Vault">VIP Vault</option>
                          <option value="Storage Room">Storage Room</option>
                          <option value="Workshop">Workshop</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Supplier</label>
                        <Input
                          value={newItemData.supplier || ''}
                          onChange={(e) => updateNewItemData('supplier', e.target.value)}
                          placeholder="e.g., Diamond Supplier"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                      <Input
                        value={newItemData.tags?.join(', ') || ''}
                        onChange={(e) => updateNewItemData('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                        placeholder="e.g., luxury, engagement, diamond"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowAddItemModal(false)
                      setNewItemData({
                        category: 'Rings',
                        metalType: '14K Yellow Gold',
                        stockLevel: 1,
                        reorderLevel: 1,
                        location: 'Main Store',
                        status: 'active'
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    onClick={handleAddItem}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Item
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Category Overview */}
        <Card className="mt-6 p-6 bg-white/90 backdrop-blur">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.count}</div>
                <div className="text-sm text-gray-600">{category}</div>
                <div className="text-xs text-gray-500">${(stats.value / 1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        </Card>
          </>
        )}
      </main>
    </div>
  )
}

function JewelryInventoryPage() {
  const { workspace, isAnonymous, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Package className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading Jewelry Inventory...</p>
        </div>

        {/* Quick Access to Customers */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={() => window.location.href = '/jewelry-progressive/customers'}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl hover:from-green-600 hover:to-emerald-700 hover:scale-110 transition-all duration-300"
            title="Quick Access to Customers"
          >
            <Crown className="w-6 h-6" />
          </Button>
        </div>
      </div>
    )
  }

  // Public access - jewelry-progressive is publicly accessible

  return <JewelryInventory />
}

export default function JewelryInventoryManagement() {
  return <JewelryInventoryPage />
}