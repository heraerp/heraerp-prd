'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Users,
  Shield,
  Lock,
  Key,
  Bell,
  Mail,
  Phone,
  Globe,
  Monitor,
  Palette,
  Eye,
  EyeOff,
  Camera,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothConnected,
  Battery,
  Cpu,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Save,
  Trash2,
  Edit,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  Hash,
  FileText,
  Database,
  Server,
  Cloud,
  Zap,
  Target,
  Award,
  Star,
  Crown,
  Gem,
  Diamond,
  Sparkles,
  Scale,
  Ruler,
  Calculator,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  TrendingUp,
  Package,
  ShoppingBag,
  CreditCard,
  Banknote,
  Receipt,
  Tag,
  MapPin,
  Navigation,
  Compass,
  Home,
  Building,
  Store,
  Warehouse
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface UserRole {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
  createdAt: string
  lastModified: string
}

interface SystemUser {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  lastLogin: string
  loginCount: number
  avatar?: string
  phone?: string
  department: string
  joinDate: string
  twoFactorEnabled: boolean
}

interface BusinessSettings {
  company: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    taxId: string
    currency: string
    timezone: string
    dateFormat: string
    numberFormat: string
  }
  jewelry: {
    defaultPurity: number
    weightUnit: 'grams' | 'ounces' | 'carats'
    priceUnit: 'per_gram' | 'per_piece' | 'per_carat'
    qualityGrades: string[]
    metalTypes: string[]
    stoneTypes: string[]
    categories: string[]
    makingChargeDefault: number
    wastageDefault: number
    gstRate: number
  }
  workflow: {
    orderApprovalRequired: boolean
    inventoryThreshold: number
    autoReorderEnabled: boolean
    qualityCheckMandatory: boolean
    customerApprovalRequired: boolean
    workshopCapacityLimit: number
    urgentOrderSurcharge: number
  }
}

interface SystemPreferences {
  ui: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    dateFormat: string
    numberFormat: string
    currency: string
    density: 'compact' | 'normal' | 'comfortable'
  }
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    sound: boolean
    desktop: boolean
    types: {
      orders: boolean
      inventory: boolean
      security: boolean
      system: boolean
      marketing: boolean
    }
  }
  security: {
    sessionTimeout: number
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireNumbers: boolean
      requireSymbols: boolean
      expiryDays: number
    }
    twoFactorRequired: boolean
    ipWhitelist: string[]
    auditLogging: boolean
  }
}

export default function JewelryConfigPage() {
  const [selectedTab, setSelectedTab] = useState('general')
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [settingsChanged, setSettingsChanged] = useState(false)

  // Mock data
  const userRoles: UserRole[] = [
    {
      id: '1',
      name: 'Owner',
      description: 'Full system access with all administrative privileges',
      permissions: ['all'],
      userCount: 1,
      isSystem: true,
      createdAt: '2024-01-01',
      lastModified: '2024-01-01'
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Store management with access to sales, inventory, and reports',
      permissions: ['sales_read', 'sales_write', 'inventory_read', 'inventory_write', 'reports_read', 'users_read'],
      userCount: 2,
      isSystem: true,
      createdAt: '2024-01-01',
      lastModified: '2024-01-10'
    },
    {
      id: '3',
      name: 'Sales Associate',
      description: 'Customer service and sales operations',
      permissions: ['sales_read', 'sales_write', 'customers_read', 'customers_write', 'pos_access'],
      userCount: 4,
      isSystem: false,
      createdAt: '2024-01-05',
      lastModified: '2024-01-15'
    },
    {
      id: '4',
      name: 'Craftsman',
      description: 'Workshop access with production and quality control',
      permissions: ['workshop_read', 'workshop_write', 'inventory_read', 'quality_control'],
      userCount: 5,
      isSystem: false,
      createdAt: '2024-01-08',
      lastModified: '2024-01-12'
    },
    {
      id: '5',
      name: 'Security Guard',
      description: 'Security monitoring and access control',
      permissions: ['security_read', 'security_write', 'vault_access', 'alerts_manage'],
      userCount: 2,
      isSystem: false,
      createdAt: '2024-01-10',
      lastModified: '2024-01-14'
    }
  ]

  const systemUsers: SystemUser[] = [
    {
      id: '1',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@jewelry.com',
      role: 'Owner',
      status: 'active',
      lastLogin: '2024-01-16 14:30',
      loginCount: 245,
      phone: '+971 50 123 4567',
      department: 'Management',
      joinDate: '2024-01-01',
      twoFactorEnabled: true
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@jewelry.com',
      role: 'Manager',
      status: 'active',
      lastLogin: '2024-01-16 13:45',
      loginCount: 198,
      phone: '+971 50 234 5678',
      department: 'Sales',
      joinDate: '2024-01-05',
      twoFactorEnabled: true
    },
    {
      id: '3',
      name: 'Priya Patel',
      email: 'priya.patel@jewelry.com',
      role: 'Sales Associate',
      status: 'active',
      lastLogin: '2024-01-16 12:15',
      loginCount: 156,
      phone: '+971 50 345 6789',
      department: 'Sales',
      joinDate: '2024-01-08',
      twoFactorEnabled: false
    },
    {
      id: '4',
      name: 'Raj Gupta',
      email: 'raj.gupta@jewelry.com',
      role: 'Craftsman',
      status: 'active',
      lastLogin: '2024-01-16 10:30',
      loginCount: 123,
      phone: '+971 50 456 7890',
      department: 'Workshop',
      joinDate: '2024-01-10',
      twoFactorEnabled: false
    },
    {
      id: '5',
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@jewelry.com',
      role: 'Sales Associate',
      status: 'inactive',
      lastLogin: '2024-01-10 16:20',
      loginCount: 89,
      phone: '+971 50 567 8901',
      department: 'Sales',
      joinDate: '2024-01-12',
      twoFactorEnabled: false
    }
  ]

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    company: {
      name: 'Royal Gems & Jewelry',
      address: '123 Gold Souk, Dubai, UAE',
      phone: '+971 4 123 4567',
      email: 'info@royalgems.ae',
      website: 'www.royalgems.ae',
      taxId: 'TRN-123456789',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'en-AE'
    },
    jewelry: {
      defaultPurity: 18,
      weightUnit: 'grams',
      priceUnit: 'per_gram',
      qualityGrades: ['VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'],
      metalTypes: ['Gold', 'Silver', 'Platinum', 'Palladium'],
      stoneTypes: ['Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Pearl'],
      categories: ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Watches'],
      makingChargeDefault: 15,
      wastageDefault: 8,
      gstRate: 5
    },
    workflow: {
      orderApprovalRequired: true,
      inventoryThreshold: 5,
      autoReorderEnabled: false,
      qualityCheckMandatory: true,
      customerApprovalRequired: true,
      workshopCapacityLimit: 20,
      urgentOrderSurcharge: 25
    }
  })

  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>({
    ui: {
      theme: 'light',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'en-AE',
      currency: 'AED',
      density: 'normal'
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      sound: true,
      desktop: false,
      types: {
        orders: true,
        inventory: true,
        security: true,
        system: true,
        marketing: false
      }
    },
    security: {
      sessionTimeout: 30,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: false,
        expiryDays: 90
      },
      twoFactorRequired: false,
      ipWhitelist: [],
      auditLogging: true
    }
  })

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'backup', label: 'Backup & Restore', icon: Database }
  ]

  const getUserStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="jewelry-icon-success" size={16} />
      case 'inactive': return <XCircle className="jewelry-icon-error" size={16} />
      case 'suspended': return <AlertTriangle className="jewelry-icon-warning" size={16} />
      case 'pending': return <Clock className="jewelry-icon-info" size={16} />
      default: return null
    }
  }

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'jewelry-status-active'
      case 'inactive': return 'jewelry-status-inactive'
      case 'suspended': return 'jewelry-status-pending'
      case 'pending': return 'jewelry-status-luxury'
      default: return 'jewelry-status-inactive'
    }
  }

  const handleSaveSettings = () => {
    // Simulate saving settings
    setSettingsChanged(false)
    // Show success message
    console.log('Settings saved successfully')
  }

  const filteredUsers = systemUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Settings className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Settings & Configuration
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              System administration and business configuration
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedTab === tab.id
                        ? 'jewelry-btn-primary'
                        : 'jewelry-btn-secondary'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {settingsChanged && (
                <div className="flex items-center gap-2">
                  <span className="jewelry-text-warning text-sm">Unsaved changes</span>
                  <button 
                    onClick={handleSaveSettings}
                    className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2"
                  >
                    <Save className="jewelry-icon-gold" size={18} />
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* General Tab */}
          {selectedTab === 'general' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              {/* System Information */}
              <div className="jewelry-glass-panel">
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-6 flex items-center gap-2">
                  <Monitor className="jewelry-icon-gold" size={24} />
                  System Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="jewelry-glass-card p-4 text-center">
                    <Server className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <h4 className="jewelry-text-high-contrast font-semibold">System Version</h4>
                    <p className="jewelry-text-muted text-sm">v2.1.0</p>
                  </div>
                  
                  <div className="jewelry-glass-card p-4 text-center">
                    <Database className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <h4 className="jewelry-text-high-contrast font-semibold">Database Size</h4>
                    <p className="jewelry-text-muted text-sm">2.4 GB</p>
                  </div>
                  
                  <div className="jewelry-glass-card p-4 text-center">
                    <Users className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <h4 className="jewelry-text-high-contrast font-semibold">Active Users</h4>
                    <p className="jewelry-text-muted text-sm">14 online</p>
                  </div>
                  
                  <div className="jewelry-glass-card p-4 text-center">
                    <Activity className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <h4 className="jewelry-text-high-contrast font-semibold">System Health</h4>
                    <p className="jewelry-text-muted text-sm">99.8% uptime</p>
                  </div>
                </div>
              </div>

              {/* UI Preferences */}
              <div className="jewelry-glass-panel">
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-6 flex items-center gap-2">
                  <Palette className="jewelry-icon-gold" size={24} />
                  User Interface Preferences
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Theme</label>
                      <select 
                        value={systemPreferences.ui.theme}
                        onChange={(e) => {
                          setSystemPreferences(prev => ({
                            ...prev,
                            ui: { ...prev.ui, theme: e.target.value as 'light' | 'dark' | 'auto' }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Language</label>
                      <select 
                        value={systemPreferences.ui.language}
                        onChange={(e) => {
                          setSystemPreferences(prev => ({
                            ...prev,
                            ui: { ...prev.ui, language: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="en">English</option>
                        <option value="ar">Arabic</option>
                        <option value="hi">Hindi</option>
                        <option value="ur">Urdu</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Date Format</label>
                      <select 
                        value={systemPreferences.ui.dateFormat}
                        onChange={(e) => {
                          setSystemPreferences(prev => ({
                            ...prev,
                            ui: { ...prev.ui, dateFormat: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Currency</label>
                      <select 
                        value={systemPreferences.ui.currency}
                        onChange={(e) => {
                          setSystemPreferences(prev => ({
                            ...prev,
                            ui: { ...prev.ui, currency: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="AED">AED (UAE Dirham)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                        <option value="INR">INR (Indian Rupee)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Number Format</label>
                      <select 
                        value={systemPreferences.ui.numberFormat}
                        onChange={(e) => {
                          setSystemPreferences(prev => ({
                            ...prev,
                            ui: { ...prev.ui, numberFormat: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="en-AE">1,234.56 (UAE)</option>
                        <option value="en-US">1,234.56 (US)</option>
                        <option value="de-DE">1.234,56 (DE)</option>
                        <option value="en-IN">1,23,456.78 (IN)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Interface Density</label>
                      <select 
                        value={systemPreferences.ui.density}
                        onChange={(e) => {
                          setSystemPreferences(prev => ({
                            ...prev,
                            ui: { ...prev.ui, density: e.target.value as 'compact' | 'normal' | 'comfortable' }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="compact">Compact</option>
                        <option value="normal">Normal</option>
                        <option value="comfortable">Comfortable</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Business Tab */}
          {selectedTab === 'business' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              {/* Company Information */}
              <div className="jewelry-glass-panel">
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-6 flex items-center gap-2">
                  <Building className="jewelry-icon-gold" size={24} />
                  Company Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Company Name</label>
                      <input
                        type="text"
                        value={businessSettings.company.name}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            company: { ...prev.company, name: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Address</label>
                      <textarea
                        value={businessSettings.company.address}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            company: { ...prev.company, address: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full h-24 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Phone</label>
                      <input
                        type="tel"
                        value={businessSettings.company.phone}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            company: { ...prev.company, phone: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Email</label>
                      <input
                        type="email"
                        value={businessSettings.company.email}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            company: { ...prev.company, email: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Website</label>
                      <input
                        type="url"
                        value={businessSettings.company.website}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            company: { ...prev.company, website: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Tax ID / TRN</label>
                      <input
                        type="text"
                        value={businessSettings.company.taxId}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            company: { ...prev.company, taxId: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Timezone</label>
                      <select 
                        value={businessSettings.company.timezone}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            company: { ...prev.company, timezone: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Base Currency</label>
                      <select 
                        value={businessSettings.company.currency}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            company: { ...prev.company, currency: e.target.value }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="AED">AED - UAE Dirham</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="INR">INR - Indian Rupee</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Jewelry Business Settings */}
              <div className="jewelry-glass-panel">
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-6 flex items-center gap-2">
                  <Gem className="jewelry-icon-gold" size={24} />
                  Jewelry Business Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="jewelry-text-high-contrast font-medium">Defaults & Units</h4>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Default Purity (Karat)</label>
                      <select 
                        value={businessSettings.jewelry.defaultPurity}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            jewelry: { ...prev.jewelry, defaultPurity: parseInt(e.target.value) }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value={14}>14K</option>
                        <option value={18}>18K</option>
                        <option value={22}>22K</option>
                        <option value={24}>24K</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Weight Unit</label>
                      <select 
                        value={businessSettings.jewelry.weightUnit}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            jewelry: { ...prev.jewelry, weightUnit: e.target.value as 'grams' | 'ounces' | 'carats' }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="grams">Grams</option>
                        <option value="ounces">Ounces</option>
                        <option value="carats">Carats</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Price Unit</label>
                      <select 
                        value={businessSettings.jewelry.priceUnit}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            jewelry: { ...prev.jewelry, priceUnit: e.target.value as 'per_gram' | 'per_piece' | 'per_carat' }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      >
                        <option value="per_gram">Per Gram</option>
                        <option value="per_piece">Per Piece</option>
                        <option value="per_carat">Per Carat</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="jewelry-text-high-contrast font-medium">Pricing Configuration</h4>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Default Making Charge (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={businessSettings.jewelry.makingChargeDefault}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            jewelry: { ...prev.jewelry, makingChargeDefault: parseFloat(e.target.value) }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">Default Wastage (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={businessSettings.jewelry.wastageDefault}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            jewelry: { ...prev.jewelry, wastageDefault: parseFloat(e.target.value) }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="jewelry-text-luxury text-sm font-medium mb-2 block">GST Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={businessSettings.jewelry.gstRate}
                        onChange={(e) => {
                          setBusinessSettings(prev => ({
                            ...prev,
                            jewelry: { ...prev.jewelry, gstRate: parseFloat(e.target.value) }
                          }))
                          setSettingsChanged(true)
                        }}
                        className="jewelry-input w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="jewelry-text-high-contrast font-medium">Workflow Settings</h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={businessSettings.workflow.orderApprovalRequired}
                          onChange={(e) => {
                            setBusinessSettings(prev => ({
                              ...prev,
                              workflow: { ...prev.workflow, orderApprovalRequired: e.target.checked }
                            }))
                            setSettingsChanged(true)
                          }}
                          className="jewelry-checkbox"
                        />
                        <span className="jewelry-text-high-contrast text-sm">Order Approval Required</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={businessSettings.workflow.qualityCheckMandatory}
                          onChange={(e) => {
                            setBusinessSettings(prev => ({
                              ...prev,
                              workflow: { ...prev.workflow, qualityCheckMandatory: e.target.checked }
                            }))
                            setSettingsChanged(true)
                          }}
                          className="jewelry-checkbox"
                        />
                        <span className="jewelry-text-high-contrast text-sm">Quality Check Mandatory</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={businessSettings.workflow.autoReorderEnabled}
                          onChange={(e) => {
                            setBusinessSettings(prev => ({
                              ...prev,
                              workflow: { ...prev.workflow, autoReorderEnabled: e.target.checked }
                            }))
                            setSettingsChanged(true)
                          }}
                          className="jewelry-checkbox"
                        />
                        <span className="jewelry-text-high-contrast text-sm">Auto Reorder Enabled</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={businessSettings.workflow.customerApprovalRequired}
                          onChange={(e) => {
                            setBusinessSettings(prev => ({
                              ...prev,
                              workflow: { ...prev.workflow, customerApprovalRequired: e.target.checked }
                            }))
                            setSettingsChanged(true)
                          }}
                          className="jewelry-checkbox"
                        />
                        <span className="jewelry-text-high-contrast text-sm">Customer Approval Required</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Users & Roles Tab */}
          {selectedTab === 'users' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              {/* User Management */}
              <div className="jewelry-glass-panel">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                    <Users className="jewelry-icon-gold" size={24} />
                    User Management
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-gold" size={20} />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="jewelry-input pl-10 w-64"
                      />
                    </div>
                    <button 
                      onClick={() => setShowUserModal(true)}
                      className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2"
                    >
                      <Plus className="jewelry-icon-gold" size={18} />
                      <span>Add User</span>
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="jewelry-glass-card-subtle">
                      <tr>
                        <th className="p-4 text-left jewelry-text-luxury font-semibold">User</th>
                        <th className="p-4 text-left jewelry-text-luxury font-semibold">Role</th>
                        <th className="p-4 text-left jewelry-text-luxury font-semibold">Department</th>
                        <th className="p-4 text-left jewelry-text-luxury font-semibold">Last Login</th>
                        <th className="p-4 text-left jewelry-text-luxury font-semibold">Status</th>
                        <th className="p-4 text-center jewelry-text-luxury font-semibold">2FA</th>
                        <th className="p-4 text-center jewelry-text-luxury font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <tr key={user.id} className="jewelry-glass-card border-b border-jewelry-blue-100 hover:bg-jewelry-blue-50 dark:hover:bg-jewelry-blue-900/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-jewelry-gold-400 to-jewelry-gold-600 flex items-center justify-center">
                                <User className="text-white" size={20} />
                              </div>
                              <div>
                                <p className="jewelry-text-high-contrast font-medium">{user.name}</p>
                                <p className="jewelry-text-muted text-xs">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 jewelry-text-high-contrast">{user.role}</td>
                          <td className="p-4 jewelry-text-muted">{user.department}</td>
                          <td className="p-4 jewelry-text-muted">{user.lastLogin}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {getUserStatusIcon(user.status)}
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getUserStatusColor(user.status)}`}>
                                {user.status.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {user.twoFactorEnabled ? (
                              <Shield className="jewelry-icon-success mx-auto" size={16} />
                            ) : (
                              <ShieldOff className="jewelry-icon-warning mx-auto" size={16} />
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => setSelectedUser(user)}
                                className="jewelry-btn-secondary p-1"
                              >
                                <Edit className="jewelry-icon-gold" size={14} />
                              </button>
                              <button className="jewelry-btn-secondary p-1">
                                <MoreVertical className="jewelry-icon-gold" size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Role Management */}
              <div className="jewelry-glass-panel">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                    <Shield className="jewelry-icon-gold" size={24} />
                    Role Management
                  </h3>
                  <button 
                    onClick={() => setShowRoleModal(true)}
                    className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2"
                  >
                    <Plus className="jewelry-icon-gold" size={18} />
                    <span>Create Role</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userRoles.map((role, index) => (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="jewelry-glass-card jewelry-scale-hover p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="jewelry-text-high-contrast font-semibold">{role.name}</h4>
                          <p className="jewelry-text-muted text-sm mt-1">{role.description}</p>
                        </div>
                        {role.isSystem && (
                          <span className="px-2 py-1 bg-jewelry-blue-100 dark:bg-jewelry-blue-800 text-jewelry-blue-800 dark:text-jewelry-blue-200 rounded text-xs">
                            System
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="jewelry-text-muted">Users:</span>
                          <span className="jewelry-text-high-contrast font-medium">{role.userCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="jewelry-text-muted">Permissions:</span>
                          <span className="jewelry-text-high-contrast font-medium">{role.permissions.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="jewelry-text-muted">Last Modified:</span>
                          <span className="jewelry-text-high-contrast">{role.lastModified}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1.5 text-sm flex-1">
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                        {!role.isSystem && (
                          <button className="jewelry-btn-secondary p-1.5">
                            <Edit className="jewelry-icon-gold" size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center mt-12 mb-6"
          >
            <p className="jewelry-text-muted text-sm">
              System configuration powered by <span className="jewelry-text-luxury font-semibold">HERA Administration</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}