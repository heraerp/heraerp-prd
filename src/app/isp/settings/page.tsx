'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Settings,
  Network,
  DollarSign,
  Users,
  UserCheck,
  Shield,
  Bell,
  Globe,
  Zap,
  Database,
  Key,
  Mail,
  Phone,
  MapPin,
  Wifi,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Save,
  RefreshCw,
  Edit2,
  Lock,
  Unlock,
  ChevronRight,
  Toggle,
  Sliders,
  FileText,
  CreditCard,
  Calendar,
  Clock,
  BarChart3
} from 'lucide-react'

// India Vision Organization ID
const INDIA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface ConfigSection {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  settings: ConfigSetting[]
}

interface ConfigSetting {
  key: string
  label: string
  description?: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'range' | 'color' | 'datetime'
  value: any
  options?: { label: string; value: any }[]
  min?: number
  max?: number
  step?: number
  unit?: string
  validation?: string
  category?: string
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Configuration sections with initial data
  const [configSections, setConfigSections] = useState<ConfigSection[]>([
    {
      id: 'general',
      title: 'General Settings',
      description: 'Basic organization and system settings',
      icon: Settings,
      color: 'from-[#00DDFF] to-[#0049B7]',
      settings: [
        {
          key: 'org_name',
          label: 'Organization Name',
          type: 'text',
          value: 'India Vision Internet Services Pvt Ltd',
          description: 'Legal name of the organization'
        },
        {
          key: 'business_id',
          label: 'Business Registration ID',
          type: 'text',
          value: 'KL2019ISP0001',
          description: 'Government registration number'
        },
        {
          key: 'fiscal_year_start',
          label: 'Fiscal Year Start',
          type: 'select',
          value: 'april',
          options: [
            { label: 'January', value: 'january' },
            { label: 'April', value: 'april' },
            { label: 'July', value: 'july' },
            { label: 'October', value: 'october' }
          ]
        },
        {
          key: 'timezone',
          label: 'Timezone',
          type: 'select',
          value: 'Asia/Kolkata',
          options: [
            { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
            { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
            { label: 'UTC', value: 'UTC' }
          ]
        },
        {
          key: 'currency',
          label: 'Currency',
          type: 'select',
          value: 'INR',
          options: [
            { label: 'Indian Rupee (₹)', value: 'INR' },
            { label: 'US Dollar ($)', value: 'USD' },
            { label: 'Euro (€)', value: 'EUR' }
          ]
        },
        {
          key: 'date_format',
          label: 'Date Format',
          type: 'select',
          value: 'DD/MM/YYYY',
          options: [
            { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
            { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
            { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
          ]
        }
      ]
    },
    {
      id: 'network',
      title: 'Network Configuration',
      description: 'Technical network settings and parameters',
      icon: Network,
      color: 'from-[#fff685] to-[#00DDFF]',
      settings: [
        {
          key: 'network_uptime_threshold',
          label: 'Network Uptime Target',
          type: 'range',
          value: 99.5,
          min: 95,
          max: 99.99,
          step: 0.01,
          unit: '%',
          description: 'Minimum acceptable network uptime percentage'
        },
        {
          key: 'bandwidth_reserve',
          label: 'Bandwidth Reserve',
          type: 'range',
          value: 20,
          min: 10,
          max: 40,
          step: 5,
          unit: '%',
          description: 'Reserved bandwidth for network stability'
        },
        {
          key: 'max_oversubscription_ratio',
          label: 'Max Oversubscription Ratio',
          type: 'select',
          value: '1:8',
          options: [
            { label: '1:4 (Premium)', value: '1:4' },
            { label: '1:8 (Standard)', value: '1:8' },
            { label: '1:12 (Economy)', value: '1:12' },
            { label: '1:16 (Budget)', value: '1:16' }
          ],
          description: 'Maximum bandwidth sharing ratio'
        },
        {
          key: 'latency_threshold',
          label: 'Latency Alert Threshold',
          type: 'number',
          value: 50,
          min: 10,
          max: 200,
          step: 10,
          unit: 'ms',
          description: 'Alert when latency exceeds this value'
        },
        {
          key: 'packet_loss_threshold',
          label: 'Packet Loss Alert',
          type: 'range',
          value: 0.5,
          min: 0.1,
          max: 5,
          step: 0.1,
          unit: '%',
          description: 'Maximum acceptable packet loss'
        },
        {
          key: 'auto_failover',
          label: 'Automatic Failover',
          type: 'boolean',
          value: true,
          description: 'Automatically switch to backup links on failure'
        },
        {
          key: 'bgp_enabled',
          label: 'BGP Routing',
          type: 'boolean',
          value: true,
          description: 'Enable Border Gateway Protocol for routing'
        }
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Revenue Rules',
      description: 'Payment terms, billing cycles, and revenue settings',
      icon: DollarSign,
      color: 'from-[#ff1d58] to-[#f75990]',
      settings: [
        {
          key: 'billing_cycle',
          label: 'Default Billing Cycle',
          type: 'select',
          value: 'monthly',
          options: [
            { label: 'Monthly', value: 'monthly' },
            { label: 'Quarterly', value: 'quarterly' },
            { label: 'Semi-Annual', value: 'semi-annual' },
            { label: 'Annual', value: 'annual' }
          ]
        },
        {
          key: 'payment_due_days',
          label: 'Payment Due Days',
          type: 'number',
          value: 7,
          min: 0,
          max: 30,
          unit: 'days',
          description: 'Days after invoice generation for payment'
        },
        {
          key: 'late_fee_percentage',
          label: 'Late Payment Fee',
          type: 'range',
          value: 2,
          min: 0,
          max: 10,
          step: 0.5,
          unit: '%',
          description: 'Monthly late payment penalty'
        },
        {
          key: 'auto_suspend_days',
          label: 'Auto Suspend After',
          type: 'number',
          value: 15,
          min: 7,
          max: 60,
          unit: 'days',
          description: 'Suspend service after days of non-payment'
        },
        {
          key: 'tax_rate',
          label: 'GST Rate',
          type: 'select',
          value: 18,
          options: [
            { label: '0%', value: 0 },
            { label: '5%', value: 5 },
            { label: '12%', value: 12 },
            { label: '18%', value: 18 },
            { label: '28%', value: 28 }
          ],
          unit: '%'
        },
        {
          key: 'invoice_prefix',
          label: 'Invoice Number Prefix',
          type: 'text',
          value: 'KV-INV-',
          description: 'Prefix for invoice numbering'
        },
        {
          key: 'prorate_billing',
          label: 'Prorate Partial Months',
          type: 'boolean',
          value: true,
          description: 'Calculate partial month charges'
        },
        {
          key: 'auto_invoice',
          label: 'Automatic Invoice Generation',
          type: 'boolean',
          value: true,
          description: 'Generate invoices automatically on billing date'
        }
      ]
    },
    {
      id: 'customer',
      title: 'Customer Management',
      description: 'Customer service and engagement settings',
      icon: Users,
      color: 'from-emerald-500 to-green-500',
      settings: [
        {
          key: 'min_contract_period',
          label: 'Minimum Contract Period',
          type: 'select',
          value: 3,
          options: [
            { label: 'No Contract', value: 0 },
            { label: '3 Months', value: 3 },
            { label: '6 Months', value: 6 },
            { label: '12 Months', value: 12 }
          ],
          unit: 'months'
        },
        {
          key: 'installation_fee',
          label: 'Standard Installation Fee',
          type: 'number',
          value: 1500,
          min: 0,
          max: 10000,
          step: 500,
          unit: '₹'
        },
        {
          key: 'security_deposit',
          label: 'Security Deposit',
          type: 'number',
          value: 2000,
          min: 0,
          max: 10000,
          step: 500,
          unit: '₹'
        },
        {
          key: 'customer_portal',
          label: 'Customer Self-Service Portal',
          type: 'boolean',
          value: true,
          description: 'Allow customers to manage their account online'
        },
        {
          key: 'auto_renewal',
          label: 'Auto-Renewal Default',
          type: 'boolean',
          value: true,
          description: 'Automatically renew subscriptions'
        },
        {
          key: 'referral_bonus',
          label: 'Referral Bonus Amount',
          type: 'number',
          value: 500,
          min: 0,
          max: 5000,
          step: 100,
          unit: '₹',
          description: 'Bonus for successful customer referrals'
        },
        {
          key: 'churn_alert_days',
          label: 'Churn Risk Alert',
          type: 'number',
          value: 30,
          min: 7,
          max: 90,
          unit: 'days',
          description: 'Alert for customers with no activity'
        }
      ]
    },
    {
      id: 'agent',
      title: 'Field Agent Configuration',
      description: 'Agent commission and performance settings',
      icon: UserCheck,
      color: 'from-purple-500 to-pink-500',
      settings: [
        {
          key: 'base_commission_rate',
          label: 'Base Commission Rate',
          type: 'range',
          value: 10,
          min: 5,
          max: 25,
          step: 1,
          unit: '%',
          description: 'Standard commission on collections'
        },
        {
          key: 'new_customer_bonus',
          label: 'New Customer Acquisition Bonus',
          type: 'number',
          value: 1000,
          min: 0,
          max: 5000,
          step: 250,
          unit: '₹'
        },
        {
          key: 'performance_threshold',
          label: 'Performance Bonus Threshold',
          type: 'range',
          value: 90,
          min: 70,
          max: 100,
          step: 5,
          unit: '%',
          description: 'Minimum score for performance bonus'
        },
        {
          key: 'performance_bonus_rate',
          label: 'Performance Bonus',
          type: 'range',
          value: 5,
          min: 0,
          max: 20,
          step: 1,
          unit: '%',
          description: 'Additional commission for high performers'
        },
        {
          key: 'territory_overlap',
          label: 'Allow Territory Overlap',
          type: 'boolean',
          value: false,
          description: 'Allow multiple agents in same area'
        },
        {
          key: 'agent_app_required',
          label: 'Mobile App Mandatory',
          type: 'boolean',
          value: true,
          description: 'Require agents to use mobile app'
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Alerts & Notifications',
      description: 'System alerts and notification preferences',
      icon: Bell,
      color: 'from-[#00DDFF] to-[#fff685]',
      settings: [
        {
          key: 'email_notifications',
          label: 'Email Notifications',
          type: 'boolean',
          value: true,
          description: 'Send email alerts for critical events'
        },
        {
          key: 'sms_notifications',
          label: 'SMS Notifications',
          type: 'boolean',
          value: true,
          description: 'Send SMS for urgent alerts'
        },
        {
          key: 'notification_email',
          label: 'Admin Email',
          type: 'text',
          value: 'admin@keralavision.com',
          description: 'Primary email for system notifications'
        },
        {
          key: 'alert_phone',
          label: 'Alert Phone Number',
          type: 'text',
          value: '+91 98765 43210',
          description: 'Phone number for critical alerts'
        },
        {
          key: 'revenue_alert_threshold',
          label: 'Revenue Drop Alert',
          type: 'range',
          value: 10,
          min: 5,
          max: 30,
          step: 5,
          unit: '%',
          description: 'Alert when revenue drops by this percentage'
        },
        {
          key: 'network_alert_cooldown',
          label: 'Alert Cooldown Period',
          type: 'select',
          value: 30,
          options: [
            { label: '15 minutes', value: 15 },
            { label: '30 minutes', value: 30 },
            { label: '1 hour', value: 60 },
            { label: '2 hours', value: 120 }
          ],
          unit: 'minutes',
          description: 'Minimum time between similar alerts'
        }
      ]
    }
  ])

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      // Fetch settings from Supabase
      const { data: settingsEntity } = await supabase
        .from('core_entities')
        .select('metadata')
        .eq('organization_id', INDIA_VISION_ORG_ID)
        .eq('entity_type', 'system_settings')
        .single()

      if (settingsEntity?.metadata) {
        // Update settings with saved values
        const savedSettings = settingsEntity.metadata
        setConfigSections(prev => 
          prev.map(section => ({
            ...section,
            settings: section.settings.map(setting => ({
              ...setting,
              value: savedSettings[setting.key] ?? setting.value
            }))
          }))
        )
        setLastSaved(new Date(settingsEntity.metadata.last_updated || Date.now()))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSettingChange = (sectionId: string, settingKey: string, newValue: any) => {
    setConfigSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              settings: section.settings.map(setting =>
                setting.key === settingKey
                  ? { ...setting, value: newValue }
                  : setting
              )
            }
          : section
      )
    )
    setHasChanges(true)
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // Collect all settings into a flat object
      const allSettings: any = {}
      configSections.forEach(section => {
        section.settings.forEach(setting => {
          allSettings[setting.key] = setting.value
        })
      })
      allSettings.last_updated = new Date().toISOString()

      // Check if settings entity exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', INDIA_VISION_ORG_ID)
        .eq('entity_type', 'system_settings')
        .single()

      if (existing) {
        // Update existing settings
        await supabase
          .from('core_entities')
          .update({
            metadata: allSettings
          })
          .eq('id', existing.id)
      } else {
        // Create new settings entity
        await supabase
          .from('core_entities')
          .insert({
            organization_id: INDIA_VISION_ORG_ID,
            entity_type: 'system_settings',
            entity_name: 'India Vision System Settings',
            entity_code: 'SETTINGS-001',
            smart_code: 'HERA.ISP.CONFIG.SYSTEM.SETTINGS.v1',
            metadata: allSettings
          })
      }

      setHasChanges(false)
      setLastSaved(new Date())
      
      // Show success feedback
      setTimeout(() => {
        setIsSaving(false)
      }, 1000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setIsSaving(false)
    }
  }

  const resetSection = (sectionId: string) => {
    // Reset to default values (would need to store defaults separately in production)
    loadSettings()
    setHasChanges(false)
  }

  const renderSettingControl = (setting: ConfigSetting, sectionId: string) => {
    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => handleSettingChange(sectionId, setting.key, e.target.value)}
            className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#00DDFF] transition-colors"
          />
        )
      
      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={setting.value}
              onChange={(e) => handleSettingChange(sectionId, setting.key, parseFloat(e.target.value))}
              min={setting.min}
              max={setting.max}
              step={setting.step}
              className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#00DDFF] transition-colors"
            />
            {setting.unit && (
              <span className="text-white/60 text-sm">{setting.unit}</span>
            )}
          </div>
        )
      
      case 'boolean':
        return (
          <button
            onClick={() => handleSettingChange(sectionId, setting.key, !setting.value)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
              setting.value ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7]' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                setting.value ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        )
      
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => handleSettingChange(sectionId, setting.key, e.target.value)}
            className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00DDFF] transition-colors"
          >
            {setting.options?.map(option => (
              <option key={option.value} value={option.value} className="bg-slate-800">
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'range':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <input
                type="range"
                value={setting.value}
                onChange={(e) => handleSettingChange(sectionId, setting.key, parseFloat(e.target.value))}
                min={setting.min}
                max={setting.max}
                step={setting.step}
                className="flex-1 mr-4"
              />
              <div className="flex items-center space-x-1">
                <span className="text-white font-medium">{setting.value}</span>
                {setting.unit && (
                  <span className="text-white/60 text-sm">{setting.unit}</span>
                )}
              </div>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-full transition-all duration-300"
                style={{
                  width: `${((setting.value - (setting.min || 0)) / ((setting.max || 100) - (setting.min || 0))) * 100}%`
                }}
              />
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const activeConfig = configSections.find(section => section.id === activeSection)

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 space-y-2">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
          <nav className="space-y-1">
            {configSections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#ff1d58]/20 to-[#f75990]/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{section.title}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Save Status */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Save Status</h3>
            {hasChanges && (
              <span className="text-xs text-yellow-400">Unsaved changes</span>
            )}
          </div>
          
          {lastSaved && (
            <p className="text-xs text-white/60 mb-3">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}

          <button
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              hasChanges && !isSaving
                ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-white hover:shadow-lg hover:shadow-[#00DDFF]/30'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeConfig && (
          <div className="relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${activeConfig.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              {/* Section Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${activeConfig.color}`}>
                      <activeConfig.icon className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{activeConfig.title}</h1>
                  </div>
                  <p className="text-white/60">{activeConfig.description}</p>
                </div>
                <button
                  onClick={() => resetSection(activeConfig.id)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Settings Grid */}
              <div className="space-y-6">
                {activeConfig.settings.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white">
                        {setting.label}
                      </label>
                      {setting.description && (
                        <div className="group/info relative">
                          <Info className="h-4 w-4 text-white/40 cursor-help" />
                          <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-10">
                            <p className="text-xs text-white/80">{setting.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {renderSettingControl(setting, activeConfig.id)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}