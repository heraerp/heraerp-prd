'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, ExternalLink } from 'lucide-react'

type Props = {
  slug: string
  current: {
    subdomain?: string
    domains?: string[]
    previewBase: string
    organizationName: string
  }
  onSave: (payload: {
    slug: string
    subdomain: string
    domains: string[]
  }) => Promise<{ ok: boolean; error?: string }>
}

export default function SubdomainSettingsForm({ slug, current, onSave }: Props) {
  const [subdomain, setSubdomain] = useState(current.subdomain ?? '')
  const [domains, setDomains] = useState<string[]>(current.domains ?? [])
  const [domainDraft, setDomainDraft] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, startSaving] = useTransition()

  // Generate preview URLs (use http for local development)
  const protocol =
    current.previewBase.includes('lvh.me') || current.previewBase.includes('localhost')
      ? 'http'
      : 'https'
  const previewUrl = subdomain
    ? `${protocol}://${subdomain}.${current.previewBase}/salon-data`
    : null
  const currentUrl = current.subdomain
    ? `${protocol}://${current.subdomain}.${current.previewBase}/salon-data`
    : null

  const handleAddDomain = () => {
    if (!domainDraft.trim()) return

    // Basic domain validation
    const domainPattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!domainPattern.test(domainDraft.trim())) {
      setError('Invalid domain format')
      return
    }

    if (domains.includes(domainDraft.trim())) {
      setError('Domain already added')
      return
    }

    setDomains([...domains, domainDraft.trim()])
    setDomainDraft('')
    setError('')
  }

  const handleRemoveDomain = (domain: string) => {
    setDomains(domains.filter(d => d !== domain))
  }

  const handleSave = () => {
    if (!subdomain.trim()) {
      setError('Subdomain is required')
      return
    }

    startSaving(async () => {
      try {
        setError('')
        setSuccess(false)

        const result = await onSave({
          slug,
          subdomain: subdomain.trim().toLowerCase(),
          domains
        })

        if (result.ok) {
          setSuccess(true)
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(false), 3000)
        } else {
          setError(result.error || 'Failed to save settings')
        }
      } catch (err) {
        setError('An unexpected error occurred')
        console.error('Save error:', err)
      }
    })
  }

  const handleSubdomainChange = (value: string) => {
    // Auto-format: lowercase, replace spaces/special chars with hyphens
    const formatted = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '')

    setSubdomain(formatted)
    setError('')
  }

  const isChanged =
    subdomain !== (current.subdomain ?? '') ||
    JSON.stringify(domains) !== JSON.stringify(current.domains ?? [])

  return (
    <div className="max-w-2xl space-y-6">
      {/* Current Status */}
      {currentUrl && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base !text-gray-900 dark:!text-gray-100">
              Current Subdomain
              <Badge variant="secondary">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded !text-gray-900 dark:!text-gray-100">
                {current.subdomain}
              </code>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="!text-blue-600 dark:!text-blue-400 hover:!text-blue-800 dark:hover:!text-blue-300 flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Visit
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subdomain Settings */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="!text-gray-900 dark:!text-gray-100">Subdomain Settings</CardTitle>
          <CardDescription className="!text-gray-600 dark:!text-gray-400">
            Configure your organization's subdomain for branded access to {current.organizationName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subdomain Input */}
          <div className="space-y-2">
            <Label htmlFor="subdomain" className="!text-gray-700 dark:!text-gray-300">
              Subdomain *
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={e => handleSubdomainChange(e.target.value)}
                placeholder="my-organization"
                className="flex-1 !text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm !text-gray-500 dark:!text-gray-400 whitespace-nowrap">
                .{current.previewBase}
              </span>
            </div>
            {previewUrl && (
              <p className="text-xs !text-gray-500 dark:!text-gray-400 mt-1">
                Preview:{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded !text-gray-900 dark:!text-gray-100">
                  {previewUrl}
                </code>
              </p>
            )}
          </div>

          {/* Custom Domains */}
          <div className="space-y-2">
            <Label className="!text-gray-700 dark:!text-gray-300">Custom Domains (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={domainDraft}
                onChange={e => setDomainDraft(e.target.value)}
                placeholder="salon.mycompany.com"
                className="flex-1 !text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddDomain()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddDomain}
                disabled={!domainDraft.trim()}
                className="!text-gray-900 dark:!text-gray-100 border-gray-300 dark:border-gray-600"
              >
                <Plus className="h-4 w-4 !text-gray-900 dark:!text-gray-100" />
              </Button>
            </div>

            {domains.length > 0 && (
              <div className="space-y-2 mt-2">
                {domains.map((domain, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-2"
                  >
                    <code className="text-sm !text-gray-900 dark:!text-gray-100">{domain}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDomain(domain)}
                      className="h-6 w-6 p-0 !text-red-600 dark:!text-red-400 hover:!text-red-800 dark:hover:!text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs !text-gray-500 dark:!text-gray-400">
              Custom domains require DNS configuration. Contact support for setup assistance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <AlertDescription className="text-green-800 dark:text-green-200">
            Subdomain settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || !isChanged || !subdomain.trim()}
          className="min-w-24 bg-blue-600 hover:bg-blue-700 !text-white"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>

        {isChanged && (
          <Button
            variant="outline"
            onClick={() => {
              setSubdomain(current.subdomain ?? '')
              setDomains(current.domains ?? [])
              setError('')
              setSuccess(false)
            }}
            disabled={saving}
            className="!text-gray-900 dark:!text-gray-100 border-gray-300 dark:border-gray-600"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
