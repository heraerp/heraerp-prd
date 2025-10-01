'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Activity,
  Bell,
  Fingerprint,
  Scan,
  Radio,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Moon,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MapPin,
  Navigation,
  Grid,
  List,
  Crown,
  Gem,
  Diamond,
  Sparkles,
  Zap,
  Info,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Vault,
  CreditCard,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  User
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface SecurityAlert {
  id: string
  type: 'intrusion' | 'access_violation' | 'sensor_trigger' | 'system' | 'environmental'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location: string
  timestamp: string
  status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm'
  assignedTo?: string
  resolvedBy?: string
  resolvedAt?: string
  notes?: string
}

interface AccessLog {
  id: string
  userId: string
  userName: string
  userRole: string
  action: 'entry' | 'exit' | 'vault_access' | 'item_removed' | 'item_added' | 'system_access'
  location: string
  timestamp: string
  duration?: number
  itemsAccessed?: string[]
  authorized: boolean
  method: 'keycard' | 'biometric' | 'pin' | 'manual' | 'remote'
  notes?: string
}

interface VaultZone {
  id: string
  name: string
  type: 'high_value' | 'display' | 'storage' | 'workshop' | 'safe'
  status: 'secured' | 'accessed' | 'maintenance' | 'alert'
  temperature: number
  humidity: number
  lastAccessed: string
  accessLevel: number
  currentOccupancy: number
  maxOccupancy: number
  sensors: {
    motion: boolean
    door: boolean
    vibration: boolean
    smoke: boolean
    temperature: boolean
    humidity: boolean
  }
  inventory: {
    totalItems: number
    totalValue: number
    highValueItems: number
  }
}

interface SecurityDevice {
  id: string
  name: string
  type: 'camera' | 'sensor' | 'alarm' | 'access_control' | 'environmental'
  location: string
  status: 'online' | 'offline' | 'maintenance' | 'alert'
  batteryLevel?: number
  signalStrength?: number
  lastMaintenance: string
  nextMaintenance: string
  firmwareVersion: string
}

interface SecurityMetrics {
  totalAlerts24h: number
  activeAlerts: number
  falseAlarmRate: number
  avgResponseTime: number
  vaultAccessesToday: number
  unauthorizedAttempts: number
  systemUptime: number
  deviceOnlineRate: number
  currentStaffInVault: number
  highValueItemsSecured: number
  totalValueSecured: number
  complianceScore: number
}

export default function JewelrySecurityPage() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedZone, setSelectedZone] = useState('all')
  const [selectedAlertType, setSelectedAlertType] = useState('all')
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [showLiveView, setShowLiveView] = useState(true)
  const [selectedVaultZone, setSelectedVaultZone] = useState<VaultZone | null>(null)

  // Mock security data
  const securityMetrics: SecurityMetrics = {
    totalAlerts24h: 12,
    activeAlerts: 2,
    falseAlarmRate: 8.3,
    avgResponseTime: 2.4,
    vaultAccessesToday: 23,
    unauthorizedAttempts: 0,
    systemUptime: 99.98,
    deviceOnlineRate: 97.5,
    currentStaffInVault: 2,
    highValueItemsSecured: 156,
    totalValueSecured: 8500000,
    complianceScore: 98.5
  }

  const securityAlerts: SecurityAlert[] = [
    {
      id: '1',
      type: 'sensor_trigger',
      severity: 'medium',
      title: 'Motion Detected - Vault B',
      description: 'Unexpected motion detected in Vault B during non-business hours',
      location: 'Vault B - High Value Section',
      timestamp: '2024-01-16 22:15:00',
      status: 'active',
      assignedTo: 'Security Team'
    },
    {
      id: '2',
      type: 'environmental',
      severity: 'low',
      title: 'Temperature Variation',
      description: 'Temperature rose 2°C above optimal range in Display Case A',
      location: 'Display Case A',
      timestamp: '2024-01-16 20:30:00',
      status: 'acknowledged',
      assignedTo: 'Maintenance'
    },
    {
      id: '3',
      type: 'access_violation',
      severity: 'high',
      title: 'Unauthorized Access Attempt',
      description: 'Failed biometric authentication attempt at main vault door',
      location: 'Main Vault Entrance',
      timestamp: '2024-01-16 19:45:00',
      status: 'resolved',
      resolvedBy: 'Ahmed Hassan',
      resolvedAt: '2024-01-16 19:50:00',
      notes: 'Employee forgot to update biometric data after injury'
    }
  ]

  const accessLogs: AccessLog[] = [
    {
      id: '1',
      userId: 'USR001',
      userName: 'Ahmed Rahman',
      userRole: 'Senior Craftsman',
      action: 'vault_access',
      location: 'Vault A - Workshop Materials',
      timestamp: '2024-01-16 14:30:00',
      duration: 15,
      itemsAccessed: ['Gold Wire 50g', 'Diamond Setting Tools'],
      authorized: true,
      method: 'biometric'
    },
    {
      id: '2',
      userId: 'USR002',
      userName: 'Sarah Johnson',
      userRole: 'Store Manager',
      action: 'item_added',
      location: 'Vault B - High Value',
      timestamp: '2024-01-16 13:15:00',
      duration: 8,
      itemsAccessed: ['Diamond Necklace Set - DNS001'],
      authorized: true,
      method: 'keycard',
      notes: 'New inventory addition'
    },
    {
      id: '3',
      userId: 'USR003',
      userName: 'Security Guard',
      userRole: 'Security',
      action: 'system_access',
      location: 'Security Control Room',
      timestamp: '2024-01-16 12:00:00',
      authorized: true,
      method: 'pin'
    }
  ]

  const vaultZones: VaultZone[] = [
    {
      id: '1',
      name: 'Vault A - High Value',
      type: 'high_value',
      status: 'secured',
      temperature: 21.5,
      humidity: 45,
      lastAccessed: '2024-01-16 13:15:00',
      accessLevel: 5,
      currentOccupancy: 0,
      maxOccupancy: 2,
      sensors: {
        motion: true,
        door: true,
        vibration: true,
        smoke: true,
        temperature: true,
        humidity: true
      },
      inventory: {
        totalItems: 89,
        totalValue: 5200000,
        highValueItems: 45
      }
    },
    {
      id: '2',
      name: 'Vault B - Display Ready',
      type: 'display',
      status: 'accessed',
      temperature: 22.1,
      humidity: 48,
      lastAccessed: '2024-01-16 14:45:00',
      accessLevel: 3,
      currentOccupancy: 1,
      maxOccupancy: 4,
      sensors: {
        motion: true,
        door: true,
        vibration: true,
        smoke: true,
        temperature: true,
        humidity: true
      },
      inventory: {
        totalItems: 134,
        totalValue: 2300000,
        highValueItems: 28
      }
    },
    {
      id: '3',
      name: 'Workshop Safe',
      type: 'safe',
      status: 'secured',
      temperature: 20.8,
      humidity: 42,
      lastAccessed: '2024-01-16 11:30:00',
      accessLevel: 2,
      currentOccupancy: 0,
      maxOccupancy: 1,
      sensors: {
        motion: true,
        door: true,
        vibration: true,
        smoke: false,
        temperature: false,
        humidity: false
      },
      inventory: {
        totalItems: 45,
        totalValue: 800000,
        highValueItems: 12
      }
    },
    {
      id: '4',
      name: 'Display Cases',
      type: 'display',
      status: 'secured',
      temperature: 23.2,
      humidity: 50,
      lastAccessed: '2024-01-16 10:00:00',
      accessLevel: 1,
      currentOccupancy: 2,
      maxOccupancy: 10,
      sensors: {
        motion: true,
        door: true,
        vibration: false,
        smoke: true,
        temperature: true,
        humidity: false
      },
      inventory: {
        totalItems: 78,
        totalValue: 450000,
        highValueItems: 8
      }
    }
  ]

  const securityDevices: SecurityDevice[] = [
    {
      id: '1',
      name: 'CAM-VAULT-A-01',
      type: 'camera',
      location: 'Vault A - Main Entrance',
      status: 'online',
      signalStrength: 98,
      lastMaintenance: '2024-01-01',
      nextMaintenance: '2024-02-01',
      firmwareVersion: 'v3.2.1'
    },
    {
      id: '2',
      name: 'SENS-MOTION-B-02',
      type: 'sensor',
      location: 'Vault B - Corner 2',
      status: 'online',
      batteryLevel: 87,
      signalStrength: 92,
      lastMaintenance: '2023-12-15',
      nextMaintenance: '2024-01-15',
      firmwareVersion: 'v2.8.4'
    },
    {
      id: '3',
      name: 'ACC-BIOMETRIC-MAIN',
      type: 'access_control',
      location: 'Main Vault Door',
      status: 'online',
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-02-10',
      firmwareVersion: 'v4.1.0'
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'vault', label: 'Vault Status', icon: Lock },
    { id: 'access', label: 'Access Logs', icon: Key },
    { id: 'devices', label: 'Devices', icon: Camera }
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'intrusion': return <ShieldAlert className="jewelry-icon-error" size={16} />
      case 'access_violation': return <UserX className="jewelry-icon-warning" size={16} />
      case 'sensor_trigger': return <Radio className="jewelry-icon-warning" size={16} />
      case 'system': return <Settings className="jewelry-icon-info" size={16} />
      case 'environmental': return <Thermometer className="jewelry-icon-info" size={16} />
      default: return <AlertCircle className="jewelry-icon-warning" size={16} />
    }
  }

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'jewelry-status-active'
      case 'medium': return 'jewelry-status-pending'
      case 'high': return 'jewelry-status-inactive'
      case 'critical': return 'bg-red-600 text-white'
      default: return 'jewelry-status-inactive'
    }
  }

  const getZoneStatusIcon = (status: string) => {
    switch (status) {
      case 'secured': return <Lock className="jewelry-icon-success" size={16} />
      case 'accessed': return <Unlock className="jewelry-icon-warning" size={16} />
      case 'maintenance': return <Settings className="jewelry-icon-info" size={16} />
      case 'alert': return <AlertTriangle className="jewelry-icon-error" size={16} />
      default: return null
    }
  }

  const getZoneStatusColor = (status: string) => {
    switch (status) {
      case 'secured': return 'jewelry-status-active'
      case 'accessed': return 'jewelry-status-pending'
      case 'maintenance': return 'jewelry-status-luxury'
      case 'alert': return 'jewelry-status-inactive'
      default: return 'jewelry-status-inactive'
    }
  }

  const getDeviceStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="jewelry-icon-success" size={16} />
      case 'offline': return <WifiOff className="jewelry-icon-error" size={16} />
      case 'maintenance': return <Settings className="jewelry-icon-warning" size={16} />
      case 'alert': return <AlertTriangle className="jewelry-icon-error" size={16} />
      default: return null
    }
  }

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
              <Shield className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Security & Vault Management
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Comprehensive security monitoring and vault access control
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
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowLiveView(!showLiveView)}
                  className={`jewelry-btn-secondary flex items-center space-x-2 px-4 py-2 ${showLiveView ? 'ring-2 ring-jewelry-gold-500' : ''}`}
                >
                  <Radio className="jewelry-icon-gold" size={18} />
                  <span>Live View</span>
                </button>
                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <Bell className="jewelry-icon-gold" size={18} />
                  <span>Emergency</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <>
              {/* Key Security Metrics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <div className="jewelry-glass-card jewelry-float p-6 text-center">
                  <ShieldCheck className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{securityMetrics.systemUptime}%</h3>
                  <p className="jewelry-text-muted text-sm font-medium">System Uptime</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <CheckCircle size={16} />
                    <span className="text-xs ml-1">All Systems Operational</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.1s' }}>
                  <AlertTriangle className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{securityMetrics.activeAlerts}</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Active Alerts</p>
                  <div className="flex items-center justify-center mt-2 text-yellow-500">
                    <Activity size={16} />
                    <span className="text-xs ml-1">{securityMetrics.totalAlerts24h} in 24h</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.2s' }}>
                  <Key className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{securityMetrics.vaultAccessesToday}</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Vault Accesses</p>
                  <div className="flex items-center justify-center mt-2 text-blue-500">
                    <Users size={16} />
                    <span className="text-xs ml-1">{securityMetrics.currentStaffInVault} staff inside</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.3s' }}>
                  <Gem className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">¹{(securityMetrics.totalValueSecured / 1000000).toFixed(1)}M</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Value Secured</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <Shield size={16} />
                    <span className="text-xs ml-1">{securityMetrics.highValueItemsSecured} items</span>
                  </div>
                </div>
              </motion.div>

              {/* Security Status Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recent Alerts */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <AlertTriangle className="jewelry-icon-gold" size={24} />
                      Recent Security Alerts
                    </h3>
                    <button className="jewelry-btn-secondary p-2">
                      <Eye className="jewelry-icon-gold" size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {securityAlerts.slice(0, 3).map((alert, index) => (
                      <div key={alert.id} className="jewelry-glass-card p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3">
                            {getAlertIcon(alert.type)}
                            <div className="flex-1">
                              <h4 className="jewelry-text-high-contrast font-semibold text-sm">{alert.title}</h4>
                              <p className="jewelry-text-muted text-xs mt-1">{alert.description}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getAlertSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="jewelry-text-muted flex items-center gap-1">
                            <MapPin size={12} />
                            {alert.location}
                          </span>
                          <span className="jewelry-text-muted flex items-center gap-1">
                            <Clock size={12} />
                            {alert.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Vault Zone Status */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <Lock className="jewelry-icon-gold" size={24} />
                      Vault Zone Status
                    </h3>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${showLiveView ? 'bg-red-500 text-white animate-pulse' : 'jewelry-status-inactive'}`}>
                      {showLiveView ? 'LIVE' : 'STATIC'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {vaultZones.map((zone, index) => (
                      <div key={zone.id} className="jewelry-glass-card p-4 cursor-pointer hover:scale-[1.02] transition-transform"
                           onClick={() => setSelectedVaultZone(zone)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getZoneStatusIcon(zone.status)}
                            <div>
                              <h4 className="jewelry-text-high-contrast font-semibold text-sm">{zone.name}</h4>
                              <span className={`text-xs px-2 py-1 rounded ${getZoneStatusColor(zone.status)}`}>
                                {zone.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="jewelry-text-high-contrast font-bold">¹{(zone.inventory.totalValue / 100000).toFixed(1)}L</p>
                            <p className="jewelry-text-muted text-xs">{zone.inventory.totalItems} items</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Thermometer className="jewelry-icon-gold" size={12} />
                            <span className="jewelry-text-muted">{zone.temperature}°C</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplets className="jewelry-icon-gold" size={12} />
                            <span className="jewelry-text-muted">{zone.humidity}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="jewelry-icon-gold" size={12} />
                            <span className="jewelry-text-muted">{zone.currentOccupancy}/{zone.maxOccupancy}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Security Performance Metrics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <div className="jewelry-glass-card p-6 text-center">
                  <Clock className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">{securityMetrics.avgResponseTime} min</h4>
                  <p className="jewelry-text-muted text-sm">Avg Response Time</p>
                </div>
                
                <div className="jewelry-glass-card p-6 text-center">
                  <Shield className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">{securityMetrics.complianceScore}%</h4>
                  <p className="jewelry-text-muted text-sm">Compliance Score</p>
                </div>
                
                <div className="jewelry-glass-card p-6 text-center">
                  <Radio className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">{securityMetrics.deviceOnlineRate}%</h4>
                  <p className="jewelry-text-muted text-sm">Device Online Rate</p>
                </div>
                
                <div className="jewelry-glass-card p-6 text-center">
                  <AlertCircle className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">{securityMetrics.falseAlarmRate}%</h4>
                  <p className="jewelry-text-muted text-sm">False Alarm Rate</p>
                </div>
              </motion.div>
            </>
          )}

          {/* Alerts Tab */}
          {selectedTab === 'alerts' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="jewelry-icon-gold" size={24} />
                  Security Alerts
                </h3>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedAlertType}
                    onChange={(e) => setSelectedAlertType(e.target.value)}
                    className="jewelry-input text-sm"
                  >
                    <option value="all">All Alerts</option>
                    <option value="intrusion">Intrusion</option>
                    <option value="access_violation">Access Violation</option>
                    <option value="sensor_trigger">Sensor Trigger</option>
                    <option value="environmental">Environmental</option>
                  </select>
                  <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-2">
                    <Download className="jewelry-icon-gold" size={16} />
                    <span>Export</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {securityAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="jewelry-glass-card p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <h4 className="jewelry-text-high-contrast font-semibold mb-1">{alert.title}</h4>
                          <p className="jewelry-text-muted text-sm">{alert.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${getAlertSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <button className="jewelry-btn-secondary p-2">
                          <MoreVertical className="jewelry-icon-gold" size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="jewelry-icon-gold" size={16} />
                        <span className="jewelry-text-muted">Location:</span>
                        <span className="jewelry-text-high-contrast">{alert.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="jewelry-icon-gold" size={16} />
                        <span className="jewelry-text-muted">Time:</span>
                        <span className="jewelry-text-high-contrast">{alert.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="jewelry-icon-gold" size={16} />
                        <span className="jewelry-text-muted">Assigned:</span>
                        <span className="jewelry-text-high-contrast">{alert.assignedTo || 'Unassigned'}</span>
                      </div>
                    </div>
                    
                    {alert.status === 'resolved' && (
                      <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <CheckCircle className="inline-block mr-2" size={16} />
                          Resolved by {alert.resolvedBy} at {alert.resolvedAt}
                        </p>
                        {alert.notes && (
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">Note: {alert.notes}</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Access Logs Tab */}
          {selectedTab === 'access' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                  <Key className="jewelry-icon-gold" size={24} />
                  Access Logs
                </h3>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="jewelry-input text-sm"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                  <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-2">
                    <Search className="jewelry-icon-gold" size={16} />
                    <span>Search</span>
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="jewelry-glass-card-subtle">
                    <tr>
                      <th className="p-4 text-left jewelry-text-luxury font-semibold">User</th>
                      <th className="p-4 text-left jewelry-text-luxury font-semibold">Action</th>
                      <th className="p-4 text-left jewelry-text-luxury font-semibold">Location</th>
                      <th className="p-4 text-left jewelry-text-luxury font-semibold">Time</th>
                      <th className="p-4 text-left jewelry-text-luxury font-semibold">Method</th>
                      <th className="p-4 text-center jewelry-text-luxury font-semibold">Status</th>
                      <th className="p-4 text-center jewelry-text-luxury font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.map((log, index) => (
                      <tr key={log.id} className="jewelry-glass-card border-b border-jewelry-blue-100 hover:bg-jewelry-blue-50 dark:hover:bg-jewelry-blue-900/20 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="jewelry-text-high-contrast font-medium">{log.userName}</p>
                            <p className="jewelry-text-muted text-xs">{log.userRole}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="jewelry-text-high-contrast">{log.action.replace('_', ' ').toUpperCase()}</span>
                        </td>
                        <td className="p-4 jewelry-text-high-contrast">{log.location}</td>
                        <td className="p-4 jewelry-text-muted">{log.timestamp}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-jewelry-blue-100 dark:bg-jewelry-blue-800 text-jewelry-blue-800 dark:text-jewelry-blue-200">
                            {log.method.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {log.authorized ? (
                            <CheckCircle className="jewelry-icon-success mx-auto" size={16} />
                          ) : (
                            <XCircle className="jewelry-icon-error mx-auto" size={16} />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button className="jewelry-btn-secondary p-1">
                            <Eye className="jewelry-icon-gold" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              Security management powered by <span className="jewelry-text-luxury font-semibold">HERA Security System</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}