'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Key,
  Lock,
  Download,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Info,
  Sparkles,
  CheckCircle
} from 'lucide-react'
import {
  generateSimpleCustomerKey,
  generateCustomerKeyBundle,
  exportCustomerKeys,
  CustomerKeyBundle
} from '@/lib/pwm/customer-key-management'

interface CustomerKeyManagementProps {
  organizationId: string
}

export function CustomerKeyManagement({ organizationId }: CustomerKeyManagementProps) {
  const [keyMode, setKeyMode] = useState<'automatic' | 'simple' | 'advanced'>('automatic')
  const [customerKey, setCustomerKey] = useState<string | null>(null)
  const [mnemonic, setMnemonic] = useState<string[]>([])
  const [keyBundle, setKeyBundle] = useState<CustomerKeyBundle | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateSimpleKey = () => {
    const { key, mnemonic: words, fingerprint } = generateSimpleCustomerKey()
    setCustomerKey(key)
    setMnemonic(words)
  }

  const generateAdvancedKey = () => {
    const bundle = generateCustomerKeyBundle(organizationId)
    setKeyBundle(bundle)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadKey = (format: 'json' | 'paper') => {
    if (!keyBundle) return

    const exported = exportCustomerKeys(keyBundle, format)
    const blob = new Blob([exported as string], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hera-pwm-key-${keyBundle.fingerprint}.${format === 'json' ? 'json' : 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-600" />
            Encryption Key Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={keyMode} onValueChange={v => setKeyMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="automatic">
                <Shield className="h-4 w-4 mr-2" />
                Automatic
              </TabsTrigger>
              <TabsTrigger value="simple">
                <Key className="h-4 w-4 mr-2" />
                Simple Key
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <Lock className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Automatic Mode */}
            <TabsContent value="automatic" className="space-y-4 mt-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommended for most users</strong>
                  <br />
                  Your data is automatically encrypted using enterprise-grade security. No key
                  management required.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Platform-Managed Encryption</div>
                    <div className="text-sm text-muted-foreground">
                      HERA handles all key generation, rotation, and storage
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Zero Configuration</div>
                    <div className="text-sm text-muted-foreground">
                      Works immediately with no setup required
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Automatic Backups</div>
                    <div className="text-sm text-muted-foreground">
                      Keys are securely backed up and recoverable
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Currently Active
                </Badge>
              </div>
            </TabsContent>

            {/* Simple Key Mode */}
            <TabsContent value="simple" className="space-y-4 mt-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Generate your own encryption key for additional security. You must save this key -
                  we cannot recover it for you.
                </AlertDescription>
              </Alert>

              {!customerKey ? (
                <div className="text-center py-8">
                  <Button onClick={generateSimpleKey} size="lg">
                    <Key className="h-5 w-5 mr-2" />
                    Generate My Encryption Key
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Generated Key Display */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Your Encryption Key</label>
                      <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="font-mono text-xs p-3 bg-slate-100 rounded-lg break-all">
                        {showKey ? customerKey : '••••••••••••••••••••••••••••••••'}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2"
                        onClick={() => copyToClipboard(customerKey)}
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Recovery Phrase */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Recovery Phrase</label>
                    <div className="grid grid-cols-3 gap-2">
                      {mnemonic.map((word, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 bg-amber-50 border border-amber-200 rounded text-center text-sm font-medium"
                        >
                          {index + 1}. {word}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Write down these words in order. They can help verify your key.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadKey('paper')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Backup
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCustomerKey(null)
                        setMnemonic([])
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate New Key
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Advanced Mode */}
            <TabsContent value="advanced" className="space-y-4 mt-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Advanced key management with RSA-4096 encryption. Suitable for users with
                  cryptographic expertise.
                </AlertDescription>
              </Alert>

              {!keyBundle ? (
                <div className="text-center py-8">
                  <Button onClick={generateAdvancedKey} size="lg">
                    <Lock className="h-5 w-5 mr-2" />
                    Generate Advanced Key Pair
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Key ID</label>
                      <div className="font-mono text-xs mt-1">{keyBundle.keyId}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fingerprint</label>
                      <div className="font-mono text-xs mt-1">{keyBundle.fingerprint}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Created</label>
                      <div className="text-sm mt-1">
                        {new Date(keyBundle.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Export Options</label>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => downloadKey('json')}>
                        <Download className="h-4 w-4 mr-2" />
                        JSON Format
                      </Button>
                      <Button variant="outline" onClick={() => downloadKey('paper')}>
                        <Download className="h-4 w-4 mr-2" />
                        Paper Backup
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Important Security Information:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Platform-managed encryption is recommended for most users</li>
            <li>If you choose to manage your own keys, you are responsible for their security</li>
            <li>Lost keys cannot be recovered - always keep secure backups</li>
            <li>Never share your encryption keys with anyone</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default CustomerKeyManagement
