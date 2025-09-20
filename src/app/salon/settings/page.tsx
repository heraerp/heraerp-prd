'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  Save,
  Globe,
  CreditCard,
  Calendar,
  Users,
  Bell,
  Shield,
  Database,
  RefreshCw,
  ChevronRight,
  Info,
  Check,
  AlertCircle,
  DollarSign,
  Clock,
  Hash,
  ToggleLeft,
  ToggleRight,
  Scissors,
  Smartphone,
  Monitor,
  Workflow,
  Flag
} from 'lucide-react'
import { PageLayout } from '@/components/universal/PageLayout'
import { PageHeader } from '@/components/universal/PageHeader'

// Hair Talkz Organization ID
const ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

interface SettingSection {
  id: string
  title: string
  description: string
  icon: React.ElementType
}

interface SalonSettings {
  sections: {
    [key: string]: {
      display_name: string
      keys: Record<string, any>
    }
  }
}

export default function SalonSettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [settings, setSettings] = useState<SalonSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sections: SettingSection[] = [
    {
      id: 'general',
      title: 'General',
      description: 'Basic salon configuration',
      icon: Settings
    },
    {
      id: 'pos',
      title: 'POS Policies',
      description: 'VAT, pricing, and payment settings',
      icon: CreditCard
    },
    {
      id: 'appointment',
      title: 'Appointment Defaults',
      description: 'Booking and scheduling preferences',
      icon: Calendar
    },
    {
      id: 'commission',
      title: 'Commission Rules',
      description: 'Staff commission configuration',
      icon: Users
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Stock management policies',
      icon: Database
    },
    {
      id: 'membership',
      title: 'Membership',
      description: 'Customer loyalty program',
      icon: Shield
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Messaging and notifications',
      icon: Smartphone
    },
    {
      id: 'hardware',
      title: 'Hardware',
      description: 'Printer and POS hardware',
      icon: Monitor
    },
    {
      id: 'workflows',
      title: 'Workflow Toggles',
      description: 'Enable/disable business processes',
      icon: Workflow
    },
    {
      id: 'feature_flags',
      title: 'Feature Flags',
      description: 'Playbook mode controls',
      icon: Flag
    }
  ]

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const r = await fetch(`/api/v1/salon/settings?organization_id=${ORG_ID}`, {
        cache: 'no-store'
      })
      const result = await r.json()
      if (result.settings) {
        setSettings(result.settings)
      } else {
        setError('Failed to load settings')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSection = async (section: string, patch: any) => {
    try {
      await fetch(`/api/v1/salon/settings/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ organization_id: ORG_ID, patch })
      })
    } catch (err) {
      console.error(`Failed to save ${section}:`, err)
    }
  }

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((section: string, patch: any) => {
      saveSection(section, patch)
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    }, 300),
    []
  )

  const handleSectionChange = (sectionId: string, key: string, value: any) => {
    if (!settings) return

    const newSettings = {
      ...settings,
      sections: {
        ...settings.sections,
        [sectionId]: {
          ...settings.sections[sectionId],
          keys: {
            ...settings.sections[sectionId]?.keys,
            [key]: value
          }
        }
      }
    }
    setSettings(newSettings)

    // Debounced save
    debouncedSave(sectionId, { [key]: value })
  }

  const handleToggle = (sectionId: string, key: string) => {
    const currentValue = settings?.sections[sectionId]?.keys[key]
    handleSectionChange(sectionId, key, !currentValue)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="ml-2 text-foreground/60">Loading settings...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-400">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>{error}</span>
      </div>
    )
  }

  const currentSection = settings?.sections[activeSection]

  return (
    <PageLayout>
      <PageHeader
        title="Settings"
        breadcrumbs={[
          { label: 'HERA' },
          { label: 'SALON OS' },
          { label: 'Settings', isActive: true }
        ]}
        actions={
          showSaveSuccess && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
              <Check className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-400">Settings saved automatically</span>
            </div>
          )
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <nav className="space-y-1">
              {sections.map(section => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-green-600/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-white/70'}`}
                    />
                    <span>{section.title}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto text-emerald-400" />}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            {currentSection && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    {currentSection.display_name}
                  </h2>
                  <p className="text-white/70 mb-6">
                    {sections.find(s => s.id === activeSection)?.description}
                  </p>
                </div>

                {/* General Section */}
                {activeSection === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Salon Name
                      </label>
                      <input
                        type="text"
                        value={currentSection.keys.salon_name || ''}
                        onChange={e => handleSectionChange('general', 'salon_name', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Timezone
                      </label>
                      <select
                        value={currentSection.keys.timezone || ''}
                        onChange={e => handleSectionChange('general', 'timezone', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="Europe/London">Europe/London</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Currency
                      </label>
                      <select
                        value={currentSection.keys.currency || ''}
                        onChange={e => handleSectionChange('general', 'currency', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="GBP">GBP - British Pound</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="AED">AED - UAE Dirham</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Locale</label>
                      <select
                        value={currentSection.keys.locale || ''}
                        onChange={e => handleSectionChange('general', 'locale', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="en-GB">English (UK)</option>
                        <option value="en-US">English (US)</option>
                        <option value="ar-AE">Arabic (UAE)</option>
                        <option value="fr-FR">French (France)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* POS Section */}
                {activeSection === 'pos' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          VAT Profile
                        </label>
                        <select
                          value={currentSection.keys.vat_profile || ''}
                          onChange={e => handleSectionChange('pos', 'vat_profile', e.target.value)}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                          <option value="UK_VAT_STANDARD">UK VAT Standard (20%)</option>
                          <option value="UK_VAT_REDUCED">UK VAT Reduced (5%)</option>
                          <option value="UAE_VAT_STANDARD">UAE VAT Standard (5%)</option>
                          <option value="VAT_EXEMPT">VAT Exempt</option>
                        </select>
                        <p className="text-xs text-white/50 mt-1">
                          Used by pricing procedures for tax calculations
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Discount Cap (%)
                        </label>
                        <input
                          type="number"
                          value={currentSection.keys.discount_cap_percent || ''}
                          onChange={e =>
                            handleSectionChange(
                              'pos',
                              'discount_cap_percent',
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          Auto Reprice Debounce (ms)
                        </label>
                        <input
                          type="number"
                          value={currentSection.keys.auto_reprice_debounce_ms || ''}
                          onChange={e =>
                            handleSectionChange(
                              'pos',
                              'auto_reprice_debounce_ms',
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <p className="text-xs text-foreground/40 mt-1">
                          Performance: delay before repricing cart after changes
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          Rounding Mode
                        </label>
                        <select
                          value={currentSection.keys.rounding_mode || ''}
                          onChange={e =>
                            handleSectionChange('pos', 'rounding_mode', e.target.value)
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                          <option value="BANKERS_2DP">Bankers Rounding (2DP)</option>
                          <option value="ROUND_UP">Round Up</option>
                          <option value="ROUND_DOWN">Round Down</option>
                          <option value="ROUND_NEAREST">Round Nearest</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-background/5 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">Price Includes Tax</p>
                          <p className="text-sm text-foreground/60">
                            Display prices with tax included
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggle('pos', 'price_includes_tax')}
                          className="relative"
                        >
                          {currentSection.keys.price_includes_tax ? (
                            <ToggleRight className="h-8 w-8 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-foreground/40" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-background/5 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">Tips Enabled</p>
                          <p className="text-sm text-foreground/60">
                            Allow customers to add tips during checkout
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggle('pos', 'tip_enabled')}
                          className="relative"
                        >
                          {currentSection.keys.tip_enabled ? (
                            <ToggleRight className="h-8 w-8 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-foreground/40" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feature Flags Section */}
                {activeSection === 'feature_flags' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-400">
                            Playbook Mode Controls
                          </p>
                          <p className="text-sm text-foreground/60 mt-1">
                            These flags control which features use the new Playbook engine. Changes
                            affect system behavior.
                          </p>
                        </div>
                      </div>
                    </div>

                    {currentSection.keys.playbook_mode &&
                      typeof currentSection.keys.playbook_mode === 'object' &&
                      Object.entries(currentSection.keys.playbook_mode).map(([flag, enabled]) => (
                        <div
                          key={flag}
                          className="flex items-center justify-between p-4 bg-background/5 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {flag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-sm text-foreground/60">playbook_mode.{flag}</p>
                          </div>
                          <button
                            onClick={() =>
                              handleSectionChange('feature_flags', 'playbook_mode', {
                                ...currentSection.keys.playbook_mode,
                                [flag]: !enabled
                              })
                            }
                            className="relative"
                          >
                            {enabled ? (
                              <ToggleRight className="h-8 w-8 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="h-8 w-8 text-foreground/40" />
                            )}
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Appointment Section */}
                {activeSection === 'appointment' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          Default Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={currentSection.keys.default_duration_min || ''}
                          onChange={e =>
                            handleSectionChange(
                              'appointment',
                              'default_duration_min',
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          Buffer Time (minutes)
                        </label>
                        <input
                          type="number"
                          value={currentSection.keys.buffer_min || ''}
                          onChange={e =>
                            handleSectionChange(
                              'appointment',
                              'buffer_min',
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          No Show Fee (£)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={currentSection.keys.no_show_fee_amount || ''}
                          onChange={e =>
                            handleSectionChange(
                              'appointment',
                              'no_show_fee_amount',
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          Auto Status on Check-in
                        </label>
                        <select
                          value={currentSection.keys.auto_status_on_checkin || ''}
                          onChange={e =>
                            handleSectionChange(
                              'appointment',
                              'auto_status_on_checkin',
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="WAITING">Waiting</option>
                          <option value="CHECKED_IN">Checked In</option>
                          <option value="NO_CHANGE">No Change</option>
                        </select>
                        <p className="text-xs text-foreground/40 mt-1">
                          Status applied when customer checks in
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background/5 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Allow Overbooking</p>
                        <p className="text-sm text-foreground/60">
                          Permit bookings beyond staff capacity
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle('appointment', 'allow_overbook')}
                        className="relative"
                      >
                        {currentSection.keys.allow_overbook ? (
                          <ToggleRight className="h-8 w-8 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-foreground/40" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Commission Section */}
                {activeSection === 'commission' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          Commission Base
                        </label>
                        <select
                          value={currentSection.keys.base || ''}
                          onChange={e => handleSectionChange('commission', 'base', e.target.value)}
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                          <option value="AFTER_DISCOUNTS_BEFORE_TAX">
                            After Discounts, Before Tax
                          </option>
                          <option value="BEFORE_DISCOUNTS">Before Discounts</option>
                          <option value="AFTER_TAX">After Tax</option>
                          <option value="GROSS_AMOUNT">Gross Amount</option>
                        </select>
                        <p className="text-xs text-foreground/40 mt-1">
                          Calculation base affects commission amounts
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          Default Rate (%)
                        </label>
                        <input
                          type="number"
                          value={currentSection.keys.default_rate_percent || ''}
                          onChange={e =>
                            handleSectionChange(
                              'commission',
                              'default_rate_percent',
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-foreground/80 mb-4">
                        Role Overrides
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-foreground/60 mb-1">
                            Stylist Rate (%)
                          </label>
                          <input
                            type="number"
                            value={currentSection.keys.role_overrides?.stylist || ''}
                            onChange={e =>
                              handleSectionChange('commission', 'role_overrides', {
                                ...currentSection.keys.role_overrides,
                                stylist: parseInt(e.target.value)
                              })
                            }
                            className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-foreground/60 mb-1">
                            Colorist Rate (%)
                          </label>
                          <input
                            type="number"
                            value={currentSection.keys.role_overrides?.colorist || ''}
                            onChange={e =>
                              handleSectionChange('commission', 'role_overrides', {
                                ...currentSection.keys.role_overrides,
                                colorist: parseInt(e.target.value)
                              })
                            }
                            className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Section */}
                {activeSection === 'whatsapp' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          Sender ID
                        </label>
                        <input
                          type="text"
                          value={currentSection.keys.sender_id || ''}
                          onChange={e =>
                            handleSectionChange('whatsapp', 'sender_id', e.target.value)
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <p className="text-xs text-foreground/40 mt-1">
                          WhatsApp Business Service Provider ID
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                          Daily Send Cap
                        </label>
                        <input
                          type="number"
                          value={currentSection.keys.daily_send_cap || ''}
                          onChange={e =>
                            handleSectionChange(
                              'whatsapp',
                              'daily_send_cap',
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-2 bg-background/5 border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-foreground/80 mb-4">
                        Template Defaults
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-background/5 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">Appointment Follow-up</p>
                            <p className="text-sm text-foreground/60">
                              Send follow-up messages after appointments
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleSectionChange('whatsapp', 'template_defaults', {
                                ...currentSection.keys.template_defaults,
                                APPT_FOLLOWUP: {
                                  ...currentSection.keys.template_defaults?.APPT_FOLLOWUP,
                                  enabled:
                                    !currentSection.keys.template_defaults?.APPT_FOLLOWUP?.enabled
                                }
                              })
                            }
                            className="relative"
                          >
                            {currentSection.keys.template_defaults?.APPT_FOLLOWUP?.enabled ? (
                              <ToggleRight className="h-8 w-8 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="h-8 w-8 text-foreground/40" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-background/5 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">Promotional Media</p>
                            <p className="text-sm text-foreground/60">
                              Send promotional messages with images
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleSectionChange('whatsapp', 'template_defaults', {
                                ...currentSection.keys.template_defaults,
                                PROMO_MEDIA: {
                                  ...currentSection.keys.template_defaults?.PROMO_MEDIA,
                                  enabled:
                                    !currentSection.keys.template_defaults?.PROMO_MEDIA?.enabled
                                }
                              })
                            }
                            className="relative"
                          >
                            {currentSection.keys.template_defaults?.PROMO_MEDIA?.enabled ? (
                              <ToggleRight className="h-8 w-8 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="h-8 w-8 text-foreground/40" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Workflow Toggles Section */}
                {activeSection === 'workflows' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background/5 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Follow-up After Sale</p>
                        <p className="text-sm text-foreground/60">
                          Send automated follow-ups after completed sales
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle('workflows', 'enable_followup_after_sale')}
                        className="relative"
                      >
                        {currentSection.keys.enable_followup_after_sale ? (
                          <ToggleRight className="h-8 w-8 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-foreground/40" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background/5 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Leave Approval Required</p>
                        <p className="text-sm text-foreground/60">
                          Staff leave requests require manager approval
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle('workflows', 'enable_leave_approval')}
                        className="relative"
                      >
                        {currentSection.keys.enable_leave_approval ? (
                          <ToggleRight className="h-8 w-8 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-foreground/40" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background/5 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Membership Auto-Renewal</p>
                        <p className="text-sm text-foreground/60">
                          Automatically renew customer memberships
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle('workflows', 'enable_membership_renewal')}
                        className="relative"
                      >
                        {currentSection.keys.enable_membership_renewal ? (
                          <ToggleRight className="h-8 w-8 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-foreground/40" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Add sections for remaining categories as needed */}
                {![
                  'general',
                  'pos',
                  'feature_flags',
                  'appointment',
                  'commission',
                  'whatsapp',
                  'workflows'
                ].includes(activeSection) && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                      <span className="text-amber-400">
                        {currentSection.display_name} settings coming soon
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

// Simple debounce function (TSX-safe, no generics)
function debounce(func: (...args: any[]) => any, waitFor: number) {
  let timeout: any = null
  return (...args: any[]) => {
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), waitFor)
  }
}
