'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Zap,
  Download,
  Upload,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  Package,
  Users,
  TreePine,
  Hammer,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  Plus,
  Minus,
  Lock,
  Unlock,
  Monitor,
  Smartphone,
  Tablet,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Sunrise,
  Wifi,
  WifiOff,
  CloudUpload,
  CloudDownload,
  Archive,
  FileText,
  Folder,
  Star,
  Heart,
  Bookmark,
  Filter,
  Search,
  MoreVertical,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

interface UserProfile {
  name: string
  email: string
  phone: string
  role: string
  department: string
  location: string
  avatar: string
}

interface BusinessSettings {
  companyName: string
  gstin: string
  address: string
  industry: string
  fiscalYear: string
  baseCurrency: string
  timezone: string
  workingHours: string
}

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  orderUpdates: boolean
  paymentAlerts: boolean
  stockAlerts: boolean
  exportNotifications: boolean
  marketingEmails: boolean
}

interface SystemSettings {
  autoBackup: boolean
  dataRetention: number
  auditLogs: boolean
  twoFactorAuth: boolean
  sessionTimeout: number
  darkMode: boolean
  language: string
  dateFormat: string
}

export default function FurnitureSettings() {
  const [activeSection, setActiveSection] = useState('profile')
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Rajesh Kumar',
    email: 'rajesh@keralafurniture.com',
    phone: '+91 98470 12345',
    role: 'Business Owner',
    department: 'Management',
    location: 'Kochi, Kerala',
    avatar: '/avatars/rajesh.jpg'
  })

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    companyName: 'Kerala Traditional Furniture Works',
    gstin: '32ABCDE1234F1Z5',
    address: 'Marine Drive, Kochi, Kerala 682031',
    industry: 'Furniture Manufacturing',
    fiscalYear: 'April - March',
    baseCurrency: 'INR',
    timezone: 'Asia/Kolkata',
    workingHours: '09:00 AM - 06:00 PM'
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    sms: true,
    push: true,
    orderUpdates: true,
    paymentAlerts: true,
    stockAlerts: true,
    exportNotifications: true,
    marketingEmails: false
  })

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoBackup: true,
    dataRetention: 7,
    auditLogs: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    darkMode: false,
    language: 'English',
    dateFormat: 'DD/MM/YYYY'
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isEditing, setIsEditing] = useState('')

  const craftsmen = [
    { name: 'Raman Master', specialty: 'Traditional Carving', experience: '25 years', status: 'Active' },
    { name: 'Suresh Kumar', specialty: 'Modern Joinery', experience: '18 years', status: 'Active' },
    { name: 'Anitha Nair', specialty: 'Upholstery', experience: '12 years', status: 'On Leave' },
    { name: 'Pradeep Chandran', specialty: 'Finishing', experience: '15 years', status: 'Active' }
  ]

  const suppliers = [
    { name: 'Kerala Forest Development Corporation', material: 'Teak Wood', rating: 'A+', status: 'Verified' },
    { name: 'Wayanad Wood Suppliers', material: 'Rosewood', rating: 'A', status: 'Verified' },
    { name: 'Traditional Hardware Kerala', material: 'Brass Fittings', rating: 'B+', status: 'Pending' },
    { name: 'Export Quality Polishes', material: 'Wood Finishes', rating: 'A-', status: 'Verified' }
  ]

  const integrations = [
    { name: 'Zoho Books', type: 'Accounting', status: 'Connected', lastSync: '2 hours ago' },
    { name: 'Export Portal', type: 'International Trade', status: 'Connected', lastSync: '1 day ago' },
    { name: 'WhatsApp Business', type: 'Customer Communication', status: 'Disconnected', lastSync: 'Never' },
    { name: 'Google Workspace', type: 'Email & Documents', status: 'Connected', lastSync: '30 minutes ago' }
  ]

  const handleSaveProfile = () => {
    setIsEditing('')
    // Save profile logic here
  }

  const handleSaveBusinessSettings = () => {
    setIsEditing('')
    // Save business settings logic here
  }

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleSystemSetting = (key: keyof SystemSettings) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Active': 'bg-green-500/10 text-green-600 border-green-500/20',
      'On Leave': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'Verified': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'Pending': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'Connected': 'bg-green-500/10 text-green-600 border-green-500/20',
      'Disconnected': 'bg-red-500/10 text-red-600 border-red-500/20'
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
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
                  <Settings className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Settings</h1>
                  <p className="text-lg text-gray-300">Configure your Kerala furniture business preferences</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All Systems Operational
                </Badge>
                <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Save className="h-4 w-4" />
                  Save All Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Settings Navigation */}
          <div className="jewelry-glass-card p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { id: 'profile', name: 'Profile', icon: User },
                { id: 'business', name: 'Business', icon: Building2 },
                { id: 'notifications', name: 'Notifications', icon: Bell },
                { id: 'security', name: 'Security', icon: Shield },
                { id: 'system', name: 'System', icon: Database },
                { id: 'integrations', name: 'Integrations', icon: Zap }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    activeSection === item.id
                      ? 'bg-jewelry-royal border-2 border-jewelry-gold-500'
                      : 'jewelry-glass-card hover:bg-white/10'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mx-auto mb-1 ${
                    activeSection === item.id ? 'jewelry-text-gold' : 'jewelry-text-luxury'
                  }`} />
                  <span className={`text-xs font-medium ${
                    activeSection === item.id ? 'jewelry-text-gold' : 'jewelry-text-luxury'
                  }`}>
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Profile Settings */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold jewelry-text-luxury">User Profile</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(isEditing === 'profile' ? '' : 'profile')}
                    className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditing === 'profile' ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                    <Button size="sm" variant="outline" className="mt-2 w-full jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium jewelry-text-luxury mb-2">Full Name</label>
                      <Input
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                        disabled={isEditing !== 'profile'}
                        className="jewelry-glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium jewelry-text-luxury mb-2">Email</label>
                      <Input
                        value={userProfile.email}
                        onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                        disabled={isEditing !== 'profile'}
                        className="jewelry-glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium jewelry-text-luxury mb-2">Phone</label>
                      <Input
                        value={userProfile.phone}
                        onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                        disabled={isEditing !== 'profile'}
                        className="jewelry-glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium jewelry-text-luxury mb-2">Role</label>
                      <Input
                        value={userProfile.role}
                        onChange={(e) => setUserProfile({...userProfile, role: e.target.value})}
                        disabled={isEditing !== 'profile'}
                        className="jewelry-glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium jewelry-text-luxury mb-2">Department</label>
                      <Input
                        value={userProfile.department}
                        onChange={(e) => setUserProfile({...userProfile, department: e.target.value})}
                        disabled={isEditing !== 'profile'}
                        className="jewelry-glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium jewelry-text-luxury mb-2">Location</label>
                      <Input
                        value={userProfile.location}
                        onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                        disabled={isEditing !== 'profile'}
                        className="jewelry-glass-input"
                      />
                    </div>
                  </div>
                </div>

                {isEditing === 'profile' && (
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                    <Button variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">Current Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        className="jewelry-glass-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">New Password</label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      className="jewelry-glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">Confirm Password</label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      className="jewelry-glass-input"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Business Settings */}
          {activeSection === 'business' && (
            <div className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold jewelry-text-luxury">Business Information</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(isEditing === 'business' ? '' : 'business')}
                    className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditing === 'business' ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">Company Name</label>
                    <Input
                      value={businessSettings.companyName}
                      onChange={(e) => setBusinessSettings({...businessSettings, companyName: e.target.value})}
                      disabled={isEditing !== 'business'}
                      className="jewelry-glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">GSTIN</label>
                    <Input
                      value={businessSettings.gstin}
                      onChange={(e) => setBusinessSettings({...businessSettings, gstin: e.target.value})}
                      disabled={isEditing !== 'business'}
                      className="jewelry-glass-input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">Business Address</label>
                    <Textarea
                      value={businessSettings.address}
                      onChange={(e) => setBusinessSettings({...businessSettings, address: e.target.value})}
                      disabled={isEditing !== 'business'}
                      className="jewelry-glass-input"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">Industry</label>
                    <Input
                      value={businessSettings.industry}
                      onChange={(e) => setBusinessSettings({...businessSettings, industry: e.target.value})}
                      disabled={isEditing !== 'business'}
                      className="jewelry-glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">Fiscal Year</label>
                    <select
                      value={businessSettings.fiscalYear}
                      onChange={(e) => setBusinessSettings({...businessSettings, fiscalYear: e.target.value})}
                      disabled={isEditing !== 'business'}
                      className="w-full px-3 py-2 jewelry-glass-input"
                    >
                      <option value="April - March">April - March</option>
                      <option value="January - December">January - December</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">Base Currency</label>
                    <select
                      value={businessSettings.baseCurrency}
                      onChange={(e) => setBusinessSettings({...businessSettings, baseCurrency: e.target.value})}
                      disabled={isEditing !== 'business'}
                      className="w-full px-3 py-2 jewelry-glass-input"
                    >
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium jewelry-text-luxury mb-2">Timezone</label>
                    <select
                      value={businessSettings.timezone}
                      onChange={(e) => setBusinessSettings({...businessSettings, timezone: e.target.value})}
                      disabled={isEditing !== 'business'}
                      className="w-full px-3 py-2 jewelry-glass-input"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                {isEditing === 'business' && (
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                    <Button variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveBusinessSettings} className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              {/* Craftsmen Management */}
              <div className="jewelry-glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold jewelry-text-luxury">Craftsmen & Staff</h3>
                  <Button size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                    <Plus className="h-3 w-3" />
                    Add Craftsman
                  </Button>
                </div>
                <div className="space-y-3">
                  {craftsmen.map((craftsman, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Hammer className="h-4 w-4 jewelry-text-gold" />
                        <div>
                          <p className="font-medium jewelry-text-luxury">{craftsman.name}</p>
                          <p className="text-sm text-gray-300">{craftsman.specialty} • {craftsman.experience}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(craftsman.status)}>
                          {craftsman.status}
                        </Badge>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suppliers Management */}
              <div className="jewelry-glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold jewelry-text-luxury">Suppliers & Vendors</h3>
                  <Button size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                    <Plus className="h-3 w-3" />
                    Add Supplier
                  </Button>
                </div>
                <div className="space-y-3">
                  {suppliers.map((supplier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TreePine className="h-4 w-4 jewelry-text-gold" />
                        <div>
                          <p className="font-medium jewelry-text-luxury">{supplier.name}</p>
                          <p className="text-sm text-gray-300">{supplier.material} • Rating: {supplier.rating}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(supplier.status)}>
                          {supplier.status}
                        </Badge>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="jewelry-glass-card p-6">
              <h2 className="text-xl font-semibold jewelry-text-luxury mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium jewelry-text-luxury mb-4">Communication Channels</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'email' as keyof NotificationSettings, label: 'Email Notifications', icon: Mail },
                      { key: 'sms' as keyof NotificationSettings, label: 'SMS Notifications', icon: Phone },
                      { key: 'push' as keyof NotificationSettings, label: 'Push Notifications', icon: Bell }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 jewelry-text-gold" />
                          <span className="jewelry-text-luxury">{item.label}</span>
                        </div>
                        <Switch
                          checked={notifications[item.key]}
                          onCheckedChange={() => toggleNotification(item.key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium jewelry-text-luxury mb-4">Business Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'orderUpdates' as keyof NotificationSettings, label: 'Order Status Updates', icon: Package },
                      { key: 'paymentAlerts' as keyof NotificationSettings, label: 'Payment Alerts', icon: DollarSign },
                      { key: 'stockAlerts' as keyof NotificationSettings, label: 'Stock Level Alerts', icon: AlertCircle },
                      { key: 'exportNotifications' as keyof NotificationSettings, label: 'Export Documentation', icon: Globe },
                      { key: 'marketingEmails' as keyof NotificationSettings, label: 'Marketing Emails', icon: Mail }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 jewelry-text-gold" />
                          <span className="jewelry-text-luxury">{item.label}</span>
                        </div>
                        <Switch
                          checked={notifications[item.key]}
                          onCheckedChange={() => toggleNotification(item.key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <h2 className="text-xl font-semibold jewelry-text-luxury mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 jewelry-text-gold" />
                      <div>
                        <p className="font-medium jewelry-text-luxury">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-300">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={systemSettings.twoFactorAuth}
                        onCheckedChange={() => toggleSystemSetting('twoFactorAuth')}
                      />
                      <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                        Configure
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 jewelry-text-gold" />
                      <div>
                        <p className="font-medium jewelry-text-luxury">Session Timeout</p>
                        <p className="text-sm text-gray-300">Automatically log out after inactivity</p>
                      </div>
                    </div>
                    <select
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                      className="px-3 py-1 jewelry-glass-input w-32"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 jewelry-text-gold" />
                      <div>
                        <p className="font-medium jewelry-text-luxury">Audit Logs</p>
                        <p className="text-sm text-gray-300">Track all system activities and changes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={systemSettings.auditLogs}
                        onCheckedChange={() => toggleSystemSetting('auditLogs')}
                      />
                      <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                        View Logs
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {[
                    { device: 'Chrome on Windows', location: 'Kochi, Kerala', time: 'Current session', icon: Monitor },
                    { device: 'Safari on iPhone', location: 'Kochi, Kerala', time: '2 hours ago', icon: Smartphone },
                    { device: 'Chrome on Android', location: 'Thrissur, Kerala', time: '1 day ago', icon: Tablet }
                  ].map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <session.icon className="h-4 w-4 jewelry-text-gold" />
                        <div>
                          <p className="font-medium jewelry-text-luxury">{session.device}</p>
                          <p className="text-sm text-gray-300">{session.location} • {session.time}</p>
                        </div>
                      </div>
                      {index !== 0 && (
                        <Button size="sm" variant="outline" className="jewelry-glass-btn text-red-400 hover:text-red-300">
                          End Session
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeSection === 'system' && (
            <div className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <h2 className="text-xl font-semibold jewelry-text-luxury mb-6">System Preferences</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CloudUpload className="h-5 w-5 jewelry-text-gold" />
                      <div>
                        <p className="font-medium jewelry-text-luxury">Automatic Backup</p>
                        <p className="text-sm text-gray-300">Daily backup of all business data</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={systemSettings.autoBackup}
                        onCheckedChange={() => toggleSystemSetting('autoBackup')}
                      />
                      <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                        Configure
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Archive className="h-5 w-5 jewelry-text-gold" />
                      <div>
                        <p className="font-medium jewelry-text-luxury">Data Retention</p>
                        <p className="text-sm text-gray-300">How long to keep deleted records</p>
                      </div>
                    </div>
                    <select
                      value={systemSettings.dataRetention}
                      onChange={(e) => setSystemSettings({...systemSettings, dataRetention: parseInt(e.target.value)})}
                      className="px-3 py-1 jewelry-glass-input w-32"
                    >
                      <option value={1}>1 year</option>
                      <option value={3}>3 years</option>
                      <option value={7}>7 years</option>
                      <option value={10}>10 years</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Moon className="h-5 w-5 jewelry-text-gold" />
                      <div>
                        <p className="font-medium jewelry-text-luxury">Dark Mode</p>
                        <p className="text-sm text-gray-300">Switch to dark theme</p>
                      </div>
                    </div>
                    <Switch
                      checked={systemSettings.darkMode}
                      onCheckedChange={() => toggleSystemSetting('darkMode')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 jewelry-text-gold" />
                      <div>
                        <p className="font-medium jewelry-text-luxury">Language</p>
                        <p className="text-sm text-gray-300">Interface language</p>
                      </div>
                    </div>
                    <select
                      value={systemSettings.language}
                      onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
                      className="px-3 py-1 jewelry-glass-input w-32"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Malayalam">Malayalam</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 jewelry-text-gold" />
                      <div>
                        <p className="font-medium jewelry-text-luxury">Date Format</p>
                        <p className="text-sm text-gray-300">How dates are displayed</p>
                      </div>
                    </div>
                    <select
                      value={systemSettings.dateFormat}
                      onChange={(e) => setSystemSettings({...systemSettings, dateFormat: e.target.value})}
                      className="px-3 py-1 jewelry-glass-input w-32"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Data Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                    <Download className="h-4 w-4" />
                    Export All Data
                  </Button>
                  <Button variant="outline" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                    <Upload className="h-4 w-4" />
                    Import Data
                  </Button>
                  <Button variant="outline" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                    <RefreshCw className="h-4 w-4" />
                    Sync Data
                  </Button>
                  <Button variant="outline" className="jewelry-glass-btn gap-2 text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                    Clear Cache
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeSection === 'integrations' && (
            <div className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <h2 className="text-xl font-semibold jewelry-text-luxury mb-6">Connected Apps & Services</h2>
                
                <div className="space-y-4">
                  {integrations.map((integration, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium jewelry-text-luxury">{integration.name}</p>
                          <p className="text-sm text-gray-300">{integration.type} • Last sync: {integration.lastSync}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                          {integration.status === 'Connected' ? 'Configure' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Integrations */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Available Integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Tally ERP', type: 'Accounting', icon: Calculator },
                    { name: 'ICEGATE', type: 'Export Portal', icon: Globe },
                    { name: 'UPI Gateway', type: 'Payments', icon: DollarSign },
                    { name: 'Kerala Logistics', type: 'Shipping', icon: Package },
                    { name: 'Wood Tracker', type: 'Material Sourcing', icon: TreePine },
                    { name: 'Craft Skills', type: 'Training Platform', icon: Hammer }
                  ].map((app, index) => (
                    <div key={index} className="jewelry-glass-card p-4 text-center">
                      <app.icon className="h-8 w-8 jewelry-text-gold mx-auto mb-2" />
                      <h4 className="font-medium jewelry-text-luxury">{app.name}</h4>
                      <p className="text-xs text-gray-300 mb-3">{app.type}</p>
                      <Button size="sm" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}