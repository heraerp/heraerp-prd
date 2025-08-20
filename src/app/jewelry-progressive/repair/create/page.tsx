'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Plus, Save, AlertTriangle, Clock, 
  Users, Camera, Phone, MessageCircle, Mail,
  Gem, Crown, Star, DollarSign, Calendar,
  Upload, FileText, Sparkles, Award, Bell,
  CheckCircle, Eye, Edit, Trash2, Search
} from 'lucide-react'

// HERA Jewelry Repair Job Creation Form
// Smart Code: HERA.JWL.REP.CREATE.JOB.v1

interface RepairJobForm {
  // Customer Information
  customerName: string
  customerPhone: string
  customerEmail: string
  customerAddress: string
  vipLevel: 'standard' | 'silver' | 'gold' | 'platinum' | 'diamond'
  
  // Item Details
  itemType: string
  itemDescription: string
  estimatedValue: number
  metalType?: string
  gemstones?: string
  brand?: string
  
  // Repair Details
  repairType: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  customerNotes: string
  damageDescription: string
  
  // Service Options
  requiresPhotos: boolean
  requiresAppraisal: boolean
  rushService: boolean
  insuranceClaim: boolean
  
  // Notifications
  notificationPreferences: {
    sms: boolean
    whatsapp: boolean
    email: boolean
    phone: boolean
  }
  
  // Delivery/Pickup
  deliveryMethod: 'pickup' | 'delivery' | 'mail'
  deliveryAddress?: string
  preferredDeliveryDate?: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  vipLevel: string
  totalSpent: number
  lastVisit: string
}

export default function JewelryRepairCreateJob() {
  const { workspace, isAnonymous } = useAuth()
  const router = useRouter()
  
  const [form, setForm] = useState<RepairJobForm>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    vipLevel: 'standard',
    itemType: '',
    itemDescription: '',
    estimatedValue: 0,
    repairType: [],
    priority: 'medium',
    customerNotes: '',
    damageDescription: '',
    requiresPhotos: true,
    requiresAppraisal: false,
    rushService: false,
    insuranceClaim: false,
    notificationPreferences: {
      sms: true,
      whatsapp: false,
      email: true,
      phone: false
    },
    deliveryMethod: 'pickup'
  })
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiTimeEstimate, setAiTimeEstimate] = useState<number | null>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  
  // Load existing customers from progressive workspace
  useEffect(() => {
    if (workspace) {
      loadCustomers()
    }
  }, [workspace])
  
  // AI Time Estimation based on repair type
  useEffect(() => {
    if (form.repairType.length > 0 && form.itemType) {
      calculateAITimeEstimate()
    }
  }, [form.repairType, form.itemType, form.priority])
  
  const loadCustomers = () => {
    try {
      const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`) || '{}'
      const data = JSON.parse(storedData)
      
      if (data.customers && data.customers.length > 0) {
        setCustomers(data.customers)
      } else {
        // Create demo customers if none exist
        const demoCustomers: Customer[] = [
          {
            id: 'CUST-001',
            name: 'Isabella Chen',
            phone: '+1 (555) 123-4567',
            email: 'isabella.chen@email.com',
            vipLevel: 'diamond',
            totalSpent: 25000,
            lastVisit: '2024-01-10'
          },
          {
            id: 'CUST-002', 
            name: 'Marcus Thompson',
            phone: '+1 (555) 234-5678',
            email: 'marcus.t@email.com',
            vipLevel: 'platinum',
            totalSpent: 15000,
            lastVisit: '2024-01-08'
          },
          {
            id: 'CUST-003',
            name: 'Emma Rodriguez',
            phone: '+1 (555) 345-6789',
            email: 'emma.rod@email.com',
            vipLevel: 'gold',
            totalSpent: 8500,
            lastVisit: '2024-01-15'
          }
        ]
        
        setCustomers(demoCustomers)
        data.customers = demoCustomers
        localStorage.setItem(`hera_data_${organization?.organization_id}`, JSON.stringify(data))
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
    }
  }
  
  const calculateAITimeEstimate = () => {
    // AI-powered time estimation based on repair complexity
    let baseHours = 2
    
    // Item type complexity
    const itemComplexity = {
      'ring': 2,
      'necklace': 3,
      'bracelet': 2.5,
      'watch': 4,
      'earrings': 1.5,
      'pendant': 2,
      'brooch': 3,
      'custom': 8
    }
    
    const itemKey = form.itemType.toLowerCase()
    baseHours = itemComplexity[itemKey as keyof typeof itemComplexity] || 2
    
    // Repair type complexity multipliers
    const repairComplexity = {
      'resize': 1.2,
      'prong_repair': 1.5,
      'stone_setting': 2.0,
      'chain_repair': 1.3,
      'clasp_repair': 1.1,
      'polish_clean': 0.5,
      'rhodium_plating': 1.4,
      'engraving': 1.8,
      'custom_design': 5.0,
      'appraisal': 0.8
    }
    
    let totalMultiplier = 1
    form.repairType.forEach(repair => {
      const repairKey = repair.toLowerCase().replace(' ', '_')
      totalMultiplier *= (repairComplexity[repairKey as keyof typeof repairComplexity] || 1.2)
    })
    
    // Priority adjustments
    const priorityMultiplier = {
      'urgent': 0.7, // Rush jobs get compressed time
      'high': 0.8,
      'medium': 1.0,
      'low': 1.2
    }
    
    const finalEstimate = baseHours * totalMultiplier * priorityMultiplier[form.priority]
    setAiTimeEstimate(Math.round(finalEstimate * 10) / 10) // Round to 1 decimal
  }
  
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setForm(prev => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      vipLevel: customer.vipLevel as any
    }))
    setShowCustomerSearch(false)
  }
  
  const handleRepairTypeChange = (repairType: string) => {
    setForm(prev => ({
      ...prev,
      repairType: prev.repairType.includes(repairType)
        ? prev.repairType.filter(type => type !== repairType)
        : [...prev.repairType, repairType]
    }))
  }
  
  const handlePhotoUpload = () => {
    // Simulate photo upload for demo
    const newPhoto = `repair-photo-${Date.now()}.jpg`
    setUploadedPhotos(prev => [...prev, newPhoto])
  }
  
  const generateJobNumber = (): string => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return form.itemType.toLowerCase().includes('custom') 
      ? `JC-${year}-${sequence}`  // Custom order
      : `JR-${year}-${sequence}`  // Repair job
  }
  
  const createRepairJob = async () => {
    setIsSubmitting(true)
    
    try {
      const jobNumber = generateJobNumber()
      const isCustomOrder = form.itemType.toLowerCase().includes('custom')
      
      // Create repair job using HERA universal transaction
      const repairJob = {
        id: `REP-${Date.now()}`,
        jobNumber: jobNumber,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        customerAddress: form.customerAddress,
        itemType: form.itemType,
        itemDescription: form.itemDescription,
        status: 'received' as const,
        priority: form.priority,
        estimatedValue: form.estimatedValue,
        repairType: form.repairType,
        customerNotes: form.customerNotes,
        damageDescription: form.damageDescription,
        dateReceived: new Date().toISOString().split('T')[0],
        estimatedCompletion: new Date(Date.now() + (aiTimeEstimate || 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        aiTimeEstimate: aiTimeEstimate,
        photos: uploadedPhotos,
        smartCode: isCustomOrder ? 'HERA.JWL.CUS.TXN.ORDER.v1' : 'HERA.JWL.REP.TXN.JOB.v1',
        requiresPhotos: form.requiresPhotos,
        requiresAppraisal: form.requiresAppraisal,
        rushService: form.rushService,
        insuranceClaim: form.insuranceClaim,
        notificationPreferences: form.notificationPreferences,
        deliveryMethod: form.deliveryMethod,
        deliveryAddress: form.deliveryAddress,
        preferredDeliveryDate: form.preferredDeliveryDate,
        vipLevel: form.vipLevel,
        createdBy: organization?.organization_name || 'Progressive User',
        createdAt: new Date().toISOString()
      }
      
      // Save to progressive workspace
      const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`) || '{}'
      const data = JSON.parse(storedData)
      
      if (!data.repairJobs) {
        data.repairJobs = []
      }
      
      data.repairJobs.push(repairJob)
      
      // Create universal transaction record
      const transaction = {
        id: `TXN-${Date.now()}`,
        transaction_type: isCustomOrder ? 'custom_order' : 'repair_job',
        smart_code: repairJob.smartCode,
        reference_number: jobNumber,
        customer_name: form.customerName,
        total_amount: form.estimatedValue,
        transaction_date: new Date().toISOString(),
        status: 'active',
        organization_id: organization?.organization_id,
        workspace_id: organization?.id,
        metadata: {
          job_id: repairJob.id,
          priority: form.priority,
          repair_types: form.repairType,
          ai_estimate_hours: aiTimeEstimate
        }
      }
      
      if (!data.transactions) {
        data.transactions = []
      }
      
      data.transactions.push(transaction)
      
      // Save updated data
      localStorage.setItem(`hera_data_${organization?.organization_id}`, JSON.stringify(data))
      
      // Show success and redirect
      alert(`${isCustomOrder ? 'Custom order' : 'Repair job'} ${jobNumber} created successfully!`)
      router.push('/jewelry-progressive/repair')
      
    } catch (error) {
      console.error('Failed to create repair job:', error)
      alert('Failed to create repair job. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const repairTypes = [
    'Ring Resizing', 'Prong Repair', 'Stone Setting', 'Chain Repair',
    'Clasp Repair', 'Polish & Clean', 'Rhodium Plating', 'Engraving',
    'Custom Design', 'Appraisal', 'Battery Replacement', 'Watch Service',
    'Pearl Restringing', 'Jewelry Cleaning', 'Stone Replacement'
  ]
  
  const vipLevels = {
    standard: { name: 'Standard', color: 'bg-gray-100 text-gray-800', discount: 0 },
    silver: { name: 'Silver', color: 'bg-gray-200 text-gray-800', discount: 5 },
    gold: { name: 'Gold', color: 'bg-yellow-100 text-yellow-800', discount: 10 },
    platinum: { name: 'Platinum', color: 'bg-slate-200 text-slate-800', discount: 15 },
    diamond: { name: 'Diamond', color: 'bg-blue-100 text-blue-800', discount: 20 }
  }
  
  // Show loading state
  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading job creation form...</p>
          <p className="text-sm text-gray-500 mt-2">HERA Repair System</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Teams-Style Sidebar */}
      <JewelryTeamsSidebar />
      
      
      <div className="ml-16">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/jewelry-progressive/repair')}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Repair Job</h1>
                    <p className="text-sm text-gray-500">
                      {isAnonymous ? 'Progressive workspace - new job slip' : 'Professional job creation'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">{organization?.organization_name}</p>
                  <p className="text-xs text-gray-400">
                    Smart Code: HERA.JWL.REP.CREATE.JOB.v1
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="space-y-8">
            
            {/* Customer Section */}
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                    className="flex-1"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {selectedCustomer ? `Selected: ${selectedCustomer.name}` : 'Search Existing Customers'}
                  </Button>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    New Customer
                  </Button>
                </div>
                
                {showCustomerSearch && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Select Customer:</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {customers.map(customer => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          className="p-3 bg-white rounded-lg border hover:border-amber-300 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-gray-600">{customer.phone}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={vipLevels[customer.vipLevel as keyof typeof vipLevels]?.color}>
                                {vipLevels[customer.vipLevel as keyof typeof vipLevels]?.name}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                ${customer.totalSpent.toLocaleString()} total
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Customer Name *</label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={form.customerPhone}
                      onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) => setForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="customer@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">VIP Level</label>
                    <select
                      value={form.vipLevel}
                      onChange={(e) => setForm(prev => ({ ...prev, vipLevel: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    >
                      {Object.entries(vipLevels).map(([key, level]) => (
                        <option key={key} value={key}>
                          {level.name} ({level.discount}% discount)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Item Details Section */}
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gem className="w-5 h-5 text-blue-500" />
                  Item Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Item Type *</label>
                    <select
                      value={form.itemType}
                      onChange={(e) => setForm(prev => ({ ...prev, itemType: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      required
                    >
                      <option value="">Select item type...</option>
                      <option value="Ring">Ring</option>
                      <option value="Necklace">Necklace</option>
                      <option value="Bracelet">Bracelet</option>
                      <option value="Watch">Watch</option>
                      <option value="Earrings">Earrings</option>
                      <option value="Pendant">Pendant</option>
                      <option value="Brooch">Brooch</option>
                      <option value="Custom Design">Custom Design</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated Value *</label>
                    <input
                      type="number"
                      value={form.estimatedValue}
                      onChange={(e) => setForm(prev => ({ ...prev, estimatedValue: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Item Description *</label>
                  <textarea
                    value={form.itemDescription}
                    onChange={(e) => setForm(prev => ({ ...prev, itemDescription: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    rows={3}
                    placeholder="Detailed description of the item (e.g., 2ct Diamond Solitaire - 18K White Gold)"
                    required
                  />
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Metal Type</label>
                    <select
                      value={form.metalType || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, metalType: e.target.value || undefined }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">Select metal...</option>
                      <option value="14K Gold">14K Gold</option>
                      <option value="18K Gold">18K Gold</option>
                      <option value="White Gold">White Gold</option>
                      <option value="Platinum">Platinum</option>
                      <option value="Silver">Silver</option>
                      <option value="Titanium">Titanium</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Gemstones</label>
                    <input
                      type="text"
                      value={form.gemstones || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, gemstones: e.target.value || undefined }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="Diamond, Sapphire, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Brand</label>
                    <input
                      type="text"
                      value={form.brand || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value || undefined }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="Tiffany, Cartier, etc."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Repair Details Section */}
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  Repair Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Repair Types *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {repairTypes.map(type => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.repairType.includes(type)}
                          onChange={() => handleRepairTypeChange(type)}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority Level *</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      required
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent (Rush Service)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      AI Time Estimate
                      <Sparkles className="w-4 h-4 text-pink-500 inline ml-1" />
                    </label>
                    <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                      {aiTimeEstimate ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold">{aiTimeEstimate} hours</span>
                          <span className="text-sm text-gray-600">estimated completion</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Select repair types for estimate</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Damage Description *</label>
                  <textarea
                    value={form.damageDescription}
                    onChange={(e) => setForm(prev => ({ ...prev, damageDescription: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    rows={3}
                    placeholder="Describe the damage, issues, or custom work needed"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Notes</label>
                  <textarea
                    value={form.customerNotes}
                    onChange={(e) => setForm(prev => ({ ...prev, customerNotes: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    rows={2}
                    placeholder="Any special instructions or customer requests"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Photos & Documentation */}
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-green-500" />
                  Photos & Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border">
                  <div>
                    <p className="font-medium">Photo Documentation</p>
                    <p className="text-sm text-gray-600">Capture before/damage photos for reference</p>
                  </div>
                  <Button
                    onClick={handlePhotoUpload}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                </div>
                
                {uploadedPhotos.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Uploaded Photos ({uploadedPhotos.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                          <Camera className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{photo}</span>
                          <button
                            onClick={() => setUploadedPhotos(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requiresAppraisal}
                      onChange={(e) => setForm(prev => ({ ...prev, requiresAppraisal: e.target.checked }))}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm">Requires Professional Appraisal</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.insuranceClaim}
                      onChange={(e) => setForm(prev => ({ ...prev, insuranceClaim: e.target.checked }))}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm">Insurance Claim</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Notifications & Delivery */}
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  Notifications & Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Notification Preferences</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.notificationPreferences.sms}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            sms: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">SMS</span>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.notificationPreferences.whatsapp}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            whatsapp: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">WhatsApp</span>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.notificationPreferences.email}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            email: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Email</span>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.notificationPreferences.phone}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            phone: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Phone</span>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Method</label>
                    <select
                      value={form.deliveryMethod}
                      onChange={(e) => setForm(prev => ({ ...prev, deliveryMethod: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    >
                      <option value="pickup">Store Pickup</option>
                      <option value="delivery">Home Delivery</option>
                      <option value="mail">Mail Delivery</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Delivery Date</label>
                    <input
                      type="date"
                      value={form.preferredDeliveryDate || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, preferredDeliveryDate: e.target.value || undefined }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                {form.deliveryMethod === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Address</label>
                    <textarea
                      value={form.deliveryAddress || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, deliveryAddress: e.target.value || undefined }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      rows={2}
                      placeholder="Full delivery address"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6">
              <Button
                variant="outline"
                onClick={() => router.push('/jewelry-progressive/repair')}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                
                <Button
                  onClick={createRepairJob}
                  disabled={isSubmitting || !form.customerName || !form.itemType || !form.itemDescription || form.repairType.length === 0}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Repair Job
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}