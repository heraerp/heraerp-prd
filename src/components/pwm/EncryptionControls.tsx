'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Settings,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { validateEncryptionSetup, generateMasterKey } from '@/src/lib/pwm/encryption'
import CustomerKeyManagement from './CustomerKeyManagement'

interface EncryptionControlsProps {
  organizationId: string
  onEncryptionChange?: (enabled: boolean) => void
}

interface EncryptionStatus {
  isEnabled: boolean
  isConfigured: boolean
  encryptedFieldsCount: number
  lastEncryptionCheck: string
  errors: string[]
}

export function EncryptionControls({
  organizationId,
  onEncryptionChange
}: EncryptionControlsProps) {
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus>({
    isEnabled: true,
    isConfigured: true,
    encryptedFieldsCount: 0,
    lastEncryptionCheck: new Date().toISOString(),
    errors: []
  })

  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [masterKeyInput, setMasterKeyInput] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    validateEncryptionConfiguration()
  }, [organizationId])

  const validateEncryptionConfiguration = async () => {
    setIsValidating(true)
    try {
      const validation = validateEncryptionSetup()
      setEncryptionStatus(prev => ({
        ...prev,
        isConfigured: validation.isValid,
        errors: validation.errors,
        lastEncryptionCheck: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Encryption validation failed:', error)
      setEncryptionStatus(prev => ({
        ...prev,
        isConfigured: false,
        errors: ['Encryption validation failed']
      }))
    } finally {
      setIsValidating(false)
    }
  }

  const toggleEncryption = (enabled: boolean) => {
    setEncryptionStatus(prev => ({ ...prev, isEnabled: enabled }))
    onEncryptionChange?.(enabled)
  }

  const generateNewMasterKey = () => {
    const newKey = generateMasterKey()
    setMasterKeyInput(newKey)
  }

  const exportEncryptionConfig = () => {
    const config = {
      organizationId,
      encryptionEnabled: encryptionStatus.isEnabled,
      timestamp: new Date().toISOString(),
      // Never export actual keys
      note: 'This is a configuration export. Master keys must be managed separately.'
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pwm-encryption-config-${organizationId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Customer Key Management */}
      <CustomerKeyManagement organizationId={organizationId} />

      {/* Encryption Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Data Encryption Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Encryption</Label>
              <div className="text-sm text-muted-foreground">
                Encrypt sensitive financial data using AES-256-GCM
              </div>
            </div>
            <Switch checked={encryptionStatus.isEnabled} onCheckedChange={toggleEncryption} />
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {encryptionStatus.isConfigured ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                Configuration {encryptionStatus.isConfigured ? 'Valid' : 'Invalid'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {encryptionStatus.encryptedFieldsCount} encrypted fields
              </span>
            </div>
          </div>

          {/* Error Display */}
          {encryptionStatus.errors.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Encryption Issues:</div>
                  <ul className="list-disc list-inside text-sm">
                    {encryptionStatus.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={validateEncryptionConfiguration}
              disabled={isValidating}
            >
              {isValidating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Validate Setup
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
              <Settings className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Controls */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-600" />
              Advanced Encryption Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Management */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Master Key Management</Label>
              <div className="text-sm text-muted-foreground mb-3">
                Master keys should be managed through secure environment variables in production.
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateNewMasterKey}
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate New Key
                </Button>
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  Development Only
                </Badge>
              </div>

              {masterKeyInput && (
                <div className="space-y-2">
                  <Label htmlFor="master-key">Generated Master Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="master-key"
                      type={showSensitiveData ? 'text' : 'password'}
                      value={masterKeyInput}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                    >
                      {showSensitiveData ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-amber-600">
                    Store this key securely as PWM_MASTER_KEY environment variable
                  </div>
                </div>
              )}
            </div>

            {/* Sensitive Data Visibility */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Data Visibility</Label>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-sensitive">Show Sensitive Data</Label>
                  <div className="text-sm text-muted-foreground">
                    Temporarily reveal encrypted data for debugging
                  </div>
                </div>
                <Switch
                  id="show-sensitive"
                  checked={showSensitiveData}
                  onCheckedChange={setShowSensitiveData}
                />
              </div>
            </div>

            {/* Export/Import */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Configuration Management</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportEncryptionConfig}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Config
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Config
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encrypted Fields Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-600" />
            Protected Data Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Account Numbers',
              'SSN/Tax IDs',
              'Bank Details',
              'Routing Numbers',
              'Beneficiary Info',
              'Private Notes',
              'Advisor Contacts',
              'Transaction Details'
            ].map(field => (
              <div key={field} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">{field}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            These fields are automatically encrypted using AES-256-GCM with organization-specific
            keys.
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">Security Best Practices:</div>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Master keys are never stored in the database</li>
              <li>Each organization has unique encryption keys</li>
              <li>Data is encrypted at rest and in transit</li>
              <li>Regular key rotation is recommended</li>
              <li>Access is logged for compliance auditing</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default EncryptionControls
