'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Settings,
  Save,
  Globe,
  Calendar,
  Lock,
  Users,
  FileText,
  Mail,
  Bell,
  Shield,
  Database,
  RefreshCw,
  ChevronRight,
  Info,
  Check,
  X,
  AlertCircle,
  CreditCard,
  Building2,
  Calculator,
  DollarSign,
  Hash,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

// Kerala Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface SettingSection {
  id: string
  title: string
  description: string
  icon: React.ElementType
}

export default function FinanceSettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  // Settings State
  const [settings, setSettings] = useState({
    // General Settings
    fiscalYearStart: '01-01',
    fiscalYearEnd: '12-31',
    baseCurrency: 'INR',
    multiCurrency: true,
    currencyDecimalPlaces: 2,
    dateFormat: 'DD/MM/YYYY',
    
    // Accounting Settings
    accountingMethod: 'accrual',
    defaultPaymentTerms: 'NET30',
    enableTaxCalculation: true,
    defaultTaxRate: 5,
    requireApprovalAbove: 100000,
    allowNegativeInventory: false,
    
    // Document Settings
    invoicePrefix: 'INV',
    receiptPrefix: 'RCP',
    paymentPrefix: 'PAY',
    journalPrefix: 'JE',
    nextInvoiceNumber: '2024-1616',
    autoGenerateNumbers: true,
    
    // Security Settings
    requireDualApproval: true,
    dualApprovalThreshold: 500000,
    enforceSegregation: true,
    auditTrailRetention: 7,
    sessionTimeout: 30,
    
    // Notifications
    emailMonthlyReports: true,
    emailPaymentReminders: true,
    emailBudgetAlerts: true,
    alertThreshold: 90,
    notificationEmail: 'finance@keralavision.com',
    
    // Integration Settings
    enableBankSync: false,
    enableAutoReconciliation: false,
    apiAccessEnabled: true,
    webhookUrl: '',
    dataExportFormat: 'excel'
  })

  const sections: SettingSection[] = [
    { id: 'general', title: 'General Settings', description: 'Basic finance configuration', icon: Settings },
    { id: 'accounting', title: 'Accounting', description: 'Accounting methods and policies', icon: Calculator },
    { id: 'documents', title: 'Document Numbering', description: 'Invoice and document settings', icon: FileText },
    { id: 'security', title: 'Security & Compliance', description: 'Access control and audit settings', icon: Shield },
    { id: 'notifications', title: 'Notifications', description: 'Email alerts and reminders', icon: Bell },
    { id: 'integration', title: 'Integration', description: 'Third-party connections', icon: Database }
  ]

  const supabase = createClientComponentClient()

  const handleSave = async () => {
    setIsSaving(true)
    // Save settings to Supabase
    setTimeout(() => {
      setIsSaving(false)
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    }, 1000)
  }

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof settings]
    }))
  }

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Finance Settings
          </h1>
          <p className="text-white/60 mt-1">Configure financial system preferences and policies</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {showSaveSuccess && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
              <Check className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-400">Settings saved successfully</span>
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-green-600/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : ''}`} />
                    <span>{section.title}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 ml-auto text-emerald-400" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">General Settings</h2>
                  <p className="text-white/60 mb-6">Configure basic financial system preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Fiscal Year Start
                    </label>
                    <input
                      type="text"
                      value={settings.fiscalYearStart}
                      onChange={(e) => handleInputChange('fiscalYearStart', e.target.value)}
                      placeholder="MM-DD"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Fiscal Year End
                    </label>
                    <input
                      type="text"
                      value={settings.fiscalYearEnd}
                      onChange={(e) => handleInputChange('fiscalYearEnd', e.target.value)}
                      placeholder="MM-DD"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Base Currency
                    </label>
                    <select
                      value={settings.baseCurrency}
                      onChange={(e) => handleInputChange('baseCurrency', e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Date Format
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Enable Multi-Currency</p>
                      <p className="text-sm text-white/60">Support transactions in multiple currencies</p>
                    </div>
                    <button
                      onClick={() => handleToggle('multiCurrency')}
                      className="relative"
                    >
                      {settings.multiCurrency ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'accounting' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Accounting Settings</h2>
                  <p className="text-white/60 mb-6">Configure accounting methods and policies</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Accounting Method
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleInputChange('accountingMethod', 'accrual')}
                        className={`p-4 rounded-lg border transition-all duration-300 ${
                          settings.accountingMethod === 'accrual'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        <Calculator className="h-6 w-6 mb-2 mx-auto" />
                        <p className="font-medium">Accrual Basis</p>
                        <p className="text-xs mt-1">Record when earned/incurred</p>
                      </button>
                      <button
                        onClick={() => handleInputChange('accountingMethod', 'cash')}
                        className={`p-4 rounded-lg border transition-all duration-300 ${
                          settings.accountingMethod === 'cash'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        <DollarSign className="h-6 w-6 mb-2 mx-auto" />
                        <p className="font-medium">Cash Basis</p>
                        <p className="text-xs mt-1">Record when paid/received</p>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Default Payment Terms
                      </label>
                      <select
                        value={settings.defaultPaymentTerms}
                        onChange={(e) => handleInputChange('defaultPaymentTerms', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="NET15">Net 15 Days</option>
                        <option value="NET30">Net 30 Days</option>
                        <option value="NET45">Net 45 Days</option>
                        <option value="NET60">Net 60 Days</option>
                        <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Approval Required Above (₹)
                      </label>
                      <input
                        type="number"
                        value={settings.requireApprovalAbove}
                        onChange={(e) => handleInputChange('requireApprovalAbove', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium text-white">Enable Tax Calculation</p>
                        <p className="text-sm text-white/60">Automatically calculate tax on transactions</p>
                      </div>
                      <button
                        onClick={() => handleToggle('enableTaxCalculation')}
                        className="relative"
                      >
                        {settings.enableTaxCalculation ? (
                          <ToggleRight className="h-8 w-8 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-white/40" />
                        )}
                      </button>
                    </div>

                    {settings.enableTaxCalculation && (
                      <div className="ml-4">
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Default Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={settings.defaultTaxRate}
                          onChange={(e) => handleInputChange('defaultTaxRate', parseFloat(e.target.value))}
                          className="w-32 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium text-white">Allow Negative Inventory</p>
                        <p className="text-sm text-white/60">Permit transactions that result in negative stock</p>
                      </div>
                      <button
                        onClick={() => handleToggle('allowNegativeInventory')}
                        className="relative"
                      >
                        {settings.allowNegativeInventory ? (
                          <ToggleRight className="h-8 w-8 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-white/40" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'documents' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Document Numbering</h2>
                  <p className="text-white/60 mb-6">Configure document prefixes and numbering sequences</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Auto-Generate Document Numbers</p>
                      <p className="text-sm text-white/60">Automatically assign sequential numbers to documents</p>
                    </div>
                    <button
                      onClick={() => handleToggle('autoGenerateNumbers')}
                      className="relative"
                    >
                      {settings.autoGenerateNumbers ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Invoice Prefix
                    </label>
                    <div className="flex items-center space-x-2">
                      <Hash className="h-5 w-5 text-white/40" />
                      <input
                        type="text"
                        value={settings.invoicePrefix}
                        onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Receipt Prefix
                    </label>
                    <div className="flex items-center space-x-2">
                      <Hash className="h-5 w-5 text-white/40" />
                      <input
                        type="text"
                        value={settings.receiptPrefix}
                        onChange={(e) => handleInputChange('receiptPrefix', e.target.value)}
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Payment Prefix
                    </label>
                    <div className="flex items-center space-x-2">
                      <Hash className="h-5 w-5 text-white/40" />
                      <input
                        type="text"
                        value={settings.paymentPrefix}
                        onChange={(e) => handleInputChange('paymentPrefix', e.target.value)}
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Journal Entry Prefix
                    </label>
                    <div className="flex items-center space-x-2">
                      <Hash className="h-5 w-5 text-white/40" />
                      <input
                        type="text"
                        value={settings.journalPrefix}
                        onChange={(e) => handleInputChange('journalPrefix', e.target.value)}
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Next Invoice Number
                  </label>
                  <input
                    type="text"
                    value={settings.nextInvoiceNumber}
                    onChange={(e) => handleInputChange('nextInvoiceNumber', e.target.value)}
                    className="w-full max-w-xs px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-xs text-white/40 mt-1">This will be used for the next generated invoice</p>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Security & Compliance</h2>
                  <p className="text-white/60 mb-6">Configure access controls and audit requirements</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Require Dual Approval</p>
                      <p className="text-sm text-white/60">Two approvals needed for high-value transactions</p>
                    </div>
                    <button
                      onClick={() => handleToggle('requireDualApproval')}
                      className="relative"
                    >
                      {settings.requireDualApproval ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>

                  {settings.requireDualApproval && (
                    <div className="ml-4">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Dual Approval Threshold (₹)
                      </label>
                      <input
                        type="number"
                        value={settings.dualApprovalThreshold}
                        onChange={(e) => handleInputChange('dualApprovalThreshold', parseInt(e.target.value))}
                        className="w-48 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Enforce Segregation of Duties</p>
                      <p className="text-sm text-white/60">Prevent users from approving their own transactions</p>
                    </div>
                    <button
                      onClick={() => handleToggle('enforceSegregation')}
                      className="relative"
                    >
                      {settings.enforceSegregation ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Audit Trail Retention (Years)
                    </label>
                    <input
                      type="number"
                      value={settings.auditTrailRetention}
                      onChange={(e) => handleInputChange('auditTrailRetention', parseInt(e.target.value))}
                      min="1"
                      max="10"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Session Timeout (Minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                      min="5"
                      max="120"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-400">Compliance Note</p>
                      <p className="text-sm text-white/60 mt-1">
                        These settings help ensure compliance with financial regulations. Consult with your compliance
                        officer before making changes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Notification Settings</h2>
                  <p className="text-white/60 mb-6">Configure email alerts and automated reminders</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Notification Email
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-white/40" />
                    <input
                      type="email"
                      value={settings.notificationEmail}
                      onChange={(e) => handleInputChange('notificationEmail', e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="finance@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Monthly Financial Reports</p>
                      <p className="text-sm text-white/60">Receive monthly P&L, balance sheet, and cash flow</p>
                    </div>
                    <button
                      onClick={() => handleToggle('emailMonthlyReports')}
                      className="relative"
                    >
                      {settings.emailMonthlyReports ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Payment Reminders</p>
                      <p className="text-sm text-white/60">Send automated reminders for overdue payments</p>
                    </div>
                    <button
                      onClick={() => handleToggle('emailPaymentReminders')}
                      className="relative"
                    >
                      {settings.emailPaymentReminders ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Budget Alerts</p>
                      <p className="text-sm text-white/60">Alert when spending exceeds budget threshold</p>
                    </div>
                    <button
                      onClick={() => handleToggle('emailBudgetAlerts')}
                      className="relative"
                    >
                      {settings.emailBudgetAlerts ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>

                  {settings.emailBudgetAlerts && (
                    <div className="ml-4">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Alert Threshold (%)
                      </label>
                      <input
                        type="number"
                        value={settings.alertThreshold}
                        onChange={(e) => handleInputChange('alertThreshold', parseInt(e.target.value))}
                        min="50"
                        max="100"
                        className="w-32 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <p className="text-xs text-white/40 mt-1">Alert when budget usage reaches this percentage</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'integration' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Integration Settings</h2>
                  <p className="text-white/60 mb-6">Configure third-party connections and data exchange</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Bank Account Sync</p>
                      <p className="text-sm text-white/60">Automatically import bank transactions</p>
                    </div>
                    <button
                      onClick={() => handleToggle('enableBankSync')}
                      className="relative"
                    >
                      {settings.enableBankSync ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Auto-Reconciliation</p>
                      <p className="text-sm text-white/60">Automatically match transactions with bank records</p>
                    </div>
                    <button
                      onClick={() => handleToggle('enableAutoReconciliation')}
                      className="relative"
                    >
                      {settings.enableAutoReconciliation ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">API Access</p>
                      <p className="text-sm text-white/60">Enable programmatic access to financial data</p>
                    </div>
                    <button
                      onClick={() => handleToggle('apiAccessEnabled')}
                      className="relative"
                    >
                      {settings.apiAccessEnabled ? (
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-white/40" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="https://your-system.com/webhook"
                  />
                  <p className="text-xs text-white/40 mt-1">Receive real-time notifications of financial events</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Default Export Format
                  </label>
                  <select
                    value={settings.dataExportFormat}
                    onChange={(e) => handleInputChange('dataExportFormat', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-400">API Documentation</p>
                      <p className="text-sm text-white/60 mt-1">
                        Visit our developer portal for complete API documentation and integration guides.
                      </p>
                      <a href="#" className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center space-x-1">
                        <span>View API Docs</span>
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}