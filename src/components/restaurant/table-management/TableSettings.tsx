'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Settings,
  Save,
  RefreshCw,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Bell,
  Shield,
  Palette,
  Layout,
  Zap,
  Globe,
  Mail,
  MessageSquare,
  CreditCard,
  AlertCircle,
  CheckCircle,
  HelpCircle
} from 'lucide-react'

interface TableSettingsProps {
  onSettingsUpdate: () => void
}

export function TableSettings({ onSettingsUpdate }: TableSettingsProps) {
  const [settings, setSettings] = useState({
    // General Settings
    defaultCapacity: 4,
    defaultDuration: 120,
    minReservationNotice: 30,
    maxAdvanceBooking: 90,
    autoConfirmReservations: false,
    requireDeposit: false,
    defaultDepositAmount: 50,
    depositThresholdPartySize: 6,

    // Operating Hours
    operatingHours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '22:00', closed: false },
      friday: { open: '11:00', close: '23:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false }
    },

    // Table Management
    enableTableCombining: true,
    enableQRCodeMenus: true,
    autoReleaseTime: 15,
    overbookingPercentage: 10,
    bufferTimeBetweenReservations: 15,

    // Notifications
    enableSMSNotifications: true,
    enableEmailNotifications: true,
    reminderTimeBeforeReservation: 120,
    waitlistNotifications: true,

    // Pricing Tiers
    pricingTiers: {
      standard: { name: 'Standard', surcharge: 0 },
      premium: { name: 'Premium', surcharge: 15 },
      vip: { name: 'VIP', surcharge: 30 }
    },

    // Status Colors
    statusColors: {
      available: '#10b981',
      occupied: '#ef4444',
      reserved: '#f59e0b',
      cleaning: '#3b82f6',
      maintenance: '#6b7280'
    },

    // Integration Settings
    posIntegration: true,
    kitchenDisplayIntegration: true,
    loyaltyProgramIntegration: false,
    thirdPartyReservations: true
  })

  const [isLoading, setIsLoading] = useState(false)

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      // In production, this would save to the API
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Settings saved successfully')
      onSettingsUpdate()
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) return

    // Reset to default values
    setSettings({
      defaultCapacity: 4,
      defaultDuration: 120,
      minReservationNotice: 30,
      maxAdvanceBooking: 90,
      autoConfirmReservations: false,
      requireDeposit: false,
      defaultDepositAmount: 50,
      depositThresholdPartySize: 6,
      operatingHours: {
        monday: { open: '11:00', close: '22:00', closed: false },
        tuesday: { open: '11:00', close: '22:00', closed: false },
        wednesday: { open: '11:00', close: '22:00', closed: false },
        thursday: { open: '11:00', close: '22:00', closed: false },
        friday: { open: '11:00', close: '23:00', closed: false },
        saturday: { open: '10:00', close: '23:00', closed: false },
        sunday: { open: '10:00', close: '21:00', closed: false }
      },
      enableTableCombining: true,
      enableQRCodeMenus: true,
      autoReleaseTime: 15,
      overbookingPercentage: 10,
      bufferTimeBetweenReservations: 15,
      enableSMSNotifications: true,
      enableEmailNotifications: true,
      reminderTimeBeforeReservation: 120,
      waitlistNotifications: true,
      pricingTiers: {
        standard: { name: 'Standard', surcharge: 0 },
        premium: { name: 'Premium', surcharge: 15 },
        vip: { name: 'VIP', surcharge: 30 }
      },
      statusColors: {
        available: '#10b981',
        occupied: '#ef4444',
        reserved: '#f59e0b',
        cleaning: '#3b82f6',
        maintenance: '#6b7280'
      },
      posIntegration: true,
      kitchenDisplayIntegration: true,
      loyaltyProgramIntegration: false,
      thirdPartyReservations: true
    })

    toast.success('Settings reset to defaults')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Table Management Settings</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure default settings for table management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={resetToDefaults}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={saveSettings} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </Card>

      {/* General Settings */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          General Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="defaultCapacity">Default Table Capacity</Label>
            <Input
              id="defaultCapacity"
              type="number"
              value={settings.defaultCapacity}
              onChange={e =>
                setSettings({ ...settings, defaultCapacity: parseInt(e.target.value) })
              }
              min="1"
              max="20"
            />
            <p className="text-xs text-gray-500 mt-1">Default capacity when creating new tables</p>
          </div>

          <div>
            <Label htmlFor="defaultDuration">Default Reservation Duration (minutes)</Label>
            <Input
              id="defaultDuration"
              type="number"
              value={settings.defaultDuration}
              onChange={e =>
                setSettings({ ...settings, defaultDuration: parseInt(e.target.value) })
              }
              min="30"
              max="480"
              step="30"
            />
            <p className="text-xs text-gray-500 mt-1">How long reservations last by default</p>
          </div>

          <div>
            <Label htmlFor="minReservationNotice">Minimum Reservation Notice (minutes)</Label>
            <Input
              id="minReservationNotice"
              type="number"
              value={settings.minReservationNotice}
              onChange={e =>
                setSettings({ ...settings, minReservationNotice: parseInt(e.target.value) })
              }
              min="0"
              max="1440"
            />
            <p className="text-xs text-gray-500 mt-1">
              How far in advance reservations must be made
            </p>
          </div>

          <div>
            <Label htmlFor="maxAdvanceBooking">Maximum Advance Booking (days)</Label>
            <Input
              id="maxAdvanceBooking"
              type="number"
              value={settings.maxAdvanceBooking}
              onChange={e =>
                setSettings({ ...settings, maxAdvanceBooking: parseInt(e.target.value) })
              }
              min="1"
              max="365"
            />
            <p className="text-xs text-gray-500 mt-1">
              How far in the future reservations can be made
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoConfirm">Auto-confirm Reservations</Label>
              <p className="text-xs text-gray-500">Automatically confirm new reservations</p>
            </div>
            <Switch
              id="autoConfirm"
              checked={settings.autoConfirmReservations}
              onCheckedChange={checked =>
                setSettings({ ...settings, autoConfirmReservations: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requireDeposit">Require Deposit</Label>
              <p className="text-xs text-gray-500">Require deposit for large party reservations</p>
            </div>
            <Switch
              id="requireDeposit"
              checked={settings.requireDeposit}
              onCheckedChange={checked => setSettings({ ...settings, requireDeposit: checked })}
            />
          </div>

          {settings.requireDeposit && (
            <>
              <div>
                <Label htmlFor="defaultDepositAmount">Default Deposit Amount ($)</Label>
                <Input
                  id="defaultDepositAmount"
                  type="number"
                  value={settings.defaultDepositAmount}
                  onChange={e =>
                    setSettings({ ...settings, defaultDepositAmount: parseFloat(e.target.value) })
                  }
                  min="0"
                  step="10"
                />
              </div>

              <div>
                <Label htmlFor="depositThresholdPartySize">Deposit Required for Parties Of</Label>
                <Input
                  id="depositThresholdPartySize"
                  type="number"
                  value={settings.depositThresholdPartySize}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      depositThresholdPartySize: parseInt(e.target.value)
                    })
                  }
                  min="1"
                  max="20"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Operating Hours */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Operating Hours
        </h4>
        <div className="space-y-3">
          {Object.entries(settings.operatingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24">
                <span className="text-sm font-medium capitalize">{day}</span>
              </div>
              <div className="flex items-center space-x-2 flex-1">
                <Switch
                  checked={!hours.closed}
                  onCheckedChange={checked =>
                    setSettings({
                      ...settings,
                      operatingHours: {
                        ...settings.operatingHours,
                        [day]: { ...hours, closed: !checked }
                      }
                    })
                  }
                />
                {!hours.closed && (
                  <>
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          operatingHours: {
                            ...settings.operatingHours,
                            [day]: { ...hours, open: e.target.value }
                          }
                        })
                      }
                      className="w-32"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          operatingHours: {
                            ...settings.operatingHours,
                            [day]: { ...hours, close: e.target.value }
                          }
                        })
                      }
                      className="w-32"
                    />
                  </>
                )}
                {hours.closed && <span className="text-gray-500 text-sm">Closed</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Table Management */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
          <Layout className="w-5 h-5 mr-2" />
          Table Management
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableTableCombining">Enable Table Combining</Label>
              <p className="text-xs text-gray-500">
                Allow tables to be combined for larger parties
              </p>
            </div>
            <Switch
              id="enableTableCombining"
              checked={settings.enableTableCombining}
              onCheckedChange={checked =>
                setSettings({ ...settings, enableTableCombining: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableQRCodeMenus">Enable QR Code Menus</Label>
              <p className="text-xs text-gray-500">Generate QR codes for digital menus</p>
            </div>
            <Switch
              id="enableQRCodeMenus"
              checked={settings.enableQRCodeMenus}
              onCheckedChange={checked => setSettings({ ...settings, enableQRCodeMenus: checked })}
            />
          </div>

          <div>
            <Label htmlFor="autoReleaseTime">Auto-release Time (minutes)</Label>
            <Input
              id="autoReleaseTime"
              type="number"
              value={settings.autoReleaseTime}
              onChange={e =>
                setSettings({ ...settings, autoReleaseTime: parseInt(e.target.value) })
              }
              min="5"
              max="60"
            />
            <p className="text-xs text-gray-500 mt-1">Release reservation if party doesn't show</p>
          </div>

          <div>
            <Label htmlFor="overbookingPercentage">Overbooking Percentage</Label>
            <Input
              id="overbookingPercentage"
              type="number"
              value={settings.overbookingPercentage}
              onChange={e =>
                setSettings({ ...settings, overbookingPercentage: parseInt(e.target.value) })
              }
              min="0"
              max="30"
            />
            <p className="text-xs text-gray-500 mt-1">Allow overbooking to account for no-shows</p>
          </div>

          <div>
            <Label htmlFor="bufferTime">Buffer Time Between Reservations (minutes)</Label>
            <Input
              id="bufferTime"
              type="number"
              value={settings.bufferTimeBetweenReservations}
              onChange={e =>
                setSettings({
                  ...settings,
                  bufferTimeBetweenReservations: parseInt(e.target.value)
                })
              }
              min="0"
              max="60"
            />
            <p className="text-xs text-gray-500 mt-1">Time needed to clean and reset tables</p>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableSMS">Enable SMS Notifications</Label>
              <p className="text-xs text-gray-500">Send reservation confirmations via SMS</p>
            </div>
            <Switch
              id="enableSMS"
              checked={settings.enableSMSNotifications}
              onCheckedChange={checked =>
                setSettings({ ...settings, enableSMSNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableEmail">Enable Email Notifications</Label>
              <p className="text-xs text-gray-500">Send reservation confirmations via email</p>
            </div>
            <Switch
              id="enableEmail"
              checked={settings.enableEmailNotifications}
              onCheckedChange={checked =>
                setSettings({ ...settings, enableEmailNotifications: checked })
              }
            />
          </div>

          <div>
            <Label htmlFor="reminderTime">Reminder Time Before Reservation (minutes)</Label>
            <Input
              id="reminderTime"
              type="number"
              value={settings.reminderTimeBeforeReservation}
              onChange={e =>
                setSettings({
                  ...settings,
                  reminderTimeBeforeReservation: parseInt(e.target.value)
                })
              }
              min="30"
              max="1440"
              step="30"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="waitlistNotifications">Waitlist Notifications</Label>
              <p className="text-xs text-gray-500">Notify waitlist when tables become available</p>
            </div>
            <Switch
              id="waitlistNotifications"
              checked={settings.waitlistNotifications}
              onCheckedChange={checked =>
                setSettings({ ...settings, waitlistNotifications: checked })
              }
            />
          </div>
        </div>
      </Card>

      {/* Pricing Tiers */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Pricing Tiers
        </h4>
        <div className="space-y-4">
          {Object.entries(settings.pricingTiers).map(([tier, config]) => (
            <div key={tier} className="flex items-center space-x-4">
              <div className="w-24">
                <Badge
                  className={
                    tier === 'vip'
                      ? 'bg-purple-100 text-purple-800'
                      : tier === 'premium'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }
                >
                  {config.name}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 flex-1">
                <Label>Surcharge %</Label>
                <Input
                  type="number"
                  value={config.surcharge}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      pricingTiers: {
                        ...settings.pricingTiers,
                        [tier]: { ...config, surcharge: parseInt(e.target.value) }
                      }
                    })
                  }
                  min="0"
                  max="100"
                  className="w-24"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Integration Settings */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Integrations
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="posIntegration">POS Integration</Label>
              <p className="text-xs text-gray-500">Sync with point of sale system</p>
            </div>
            <Switch
              id="posIntegration"
              checked={settings.posIntegration}
              onCheckedChange={checked => setSettings({ ...settings, posIntegration: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="kitchenDisplay">Kitchen Display Integration</Label>
              <p className="text-xs text-gray-500">Show table status in kitchen</p>
            </div>
            <Switch
              id="kitchenDisplay"
              checked={settings.kitchenDisplayIntegration}
              onCheckedChange={checked =>
                setSettings({ ...settings, kitchenDisplayIntegration: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="loyaltyProgram">Loyalty Program Integration</Label>
              <p className="text-xs text-gray-500">Track visits for loyalty rewards</p>
            </div>
            <Switch
              id="loyaltyProgram"
              checked={settings.loyaltyProgramIntegration}
              onCheckedChange={checked =>
                setSettings({ ...settings, loyaltyProgramIntegration: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="thirdParty">Third-party Reservations</Label>
              <p className="text-xs text-gray-500">Accept reservations from OpenTable, etc.</p>
            </div>
            <Switch
              id="thirdParty"
              checked={settings.thirdPartyReservations}
              onCheckedChange={checked =>
                setSettings({ ...settings, thirdPartyReservations: checked })
              }
            />
          </div>
        </div>
      </Card>

      {/* Status Color Customization */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2" />
          Status Colors
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(settings.statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center space-x-3">
              <input
                type="color"
                value={color}
                onChange={e =>
                  setSettings({
                    ...settings,
                    statusColors: {
                      ...settings.statusColors,
                      [status]: e.target.value
                    }
                  })
                }
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Label className="capitalize">{status}</Label>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
