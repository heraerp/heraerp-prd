'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUCRMCP } from '@/lib/hooks/use-ucr-mcp'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useToast } from '@/components/ui/use-toast'
import {
  FileText,
  Copy,
  Eye,
  Search,
  Filter,
  Sparkles,
  Users,
  DollarSign,
  MessageCircle,
  Calendar,
  Clock,
  Shield,
  Zap
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface UCRTemplate {
  template_id: string
  industry: string
  module: string
  smart_code: string
  title: string
  rule_payload: any
}

export function UCRTemplateBrowser() {
  const { currentOrganization } = useMultiOrgAuth()
  const { listTemplates, cloneTemplate, loading } = useUCRMCP()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<UCRTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<UCRTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<UCRTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchQuery, activeCategory])

  const loadTemplates = async () => {
    try {
      const data = await listTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(t => {
        if (activeCategory === 'booking')
          return t.smart_code.includes('APPOINTMENT') || t.smart_code.includes('RESERVATION')
        if (activeCategory === 'pricing')
          return t.smart_code.includes('DISCOUNT') || t.smart_code.includes('PRICING')
        if (activeCategory === 'notifications')
          return t.smart_code.includes('NOTIFICATION') || t.smart_code.includes('REMINDER')
        return true
      })
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        t =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.smart_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.rule_payload.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTemplates(filtered)
  }

  const getCategoryIcon = (smartCode: string) => {
    if (smartCode.includes('APPOINTMENT') || smartCode.includes('RESERVATION')) return Users
    if (smartCode.includes('DISCOUNT') || smartCode.includes('PRICING')) return DollarSign
    if (smartCode.includes('NOTIFICATION')) return MessageCircle
    if (smartCode.includes('CANCEL')) return Calendar
    return FileText
  }

  const getCategoryColor = (smartCode: string) => {
    if (smartCode.includes('APPOINTMENT') || smartCode.includes('RESERVATION'))
      return 'from-purple-500 to-purple-700'
    if (smartCode.includes('DISCOUNT') || smartCode.includes('PRICING'))
      return 'from-emerald-500 to-green-600'
    if (smartCode.includes('NOTIFICATION')) return 'from-blue-500 to-indigo-600'
    if (smartCode.includes('CANCEL')) return 'from-orange-500 to-red-600'
    return 'from-gray-500 to-gray-700'
  }

  const handleCloneTemplate = async (template: UCRTemplate) => {
    if (!currentOrganization) {
      toast({
        title: 'No organization selected',
        description: 'Please select an organization first',
        variant: 'destructive'
      })
      return
    }

    // Navigate to customization page
    window.location.href = `/salon-data/templates/customize?template=${template.template_id}`
  }

  const renderRuleDetails = (payload: any) => {
    return (
      <div className="space-y-4">
        {payload.definitions && (
          <div>
            <h4 className="text-sm font-medium mb-2">Base Definitions</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
              {Object.entries(payload.definitions).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {payload.exceptions && payload.exceptions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Exceptions</h4>
            <div className="space-y-2">
              {payload.exceptions.map((exception: any, index: number) => (
                <div key={index} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="text-sm">
                    <span className="text-blue-700 dark:text-blue-300">IF</span>
                    {Object.entries(exception.if).map(([key, value]) => (
                      <span key={key} className="ml-2">
                        {key} = <span className="font-mono">{String(value)}</span>
                      </span>
                    ))}
                  </div>
                  <div className="text-sm mt-1">
                    <span className="text-green-700 dark:text-green-300">THEN</span>
                    {Object.entries(exception.then).map(([key, value]) => (
                      <span key={key} className="ml-2">
                        {key} = <span className="font-mono">{String(value)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {payload.calendar_effects && (
          <div>
            <h4 className="text-sm font-medium mb-2">Calendar Effects</h4>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <pre className="text-xs">{JSON.stringify(payload.calendar_effects, null, 2)}</pre>
            </div>
          </div>
        )}

        {payload.notifications && (
          <div>
            <h4 className="text-sm font-medium mb-2">Notifications</h4>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <div className="text-sm space-y-1">
                <div>Channels: {payload.notifications.channels?.join(', ')}</div>
                <div>Template: {payload.notifications.template}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">UCR Template Library</CardTitle>
              <CardDescription>
                Industry-proven business rules ready to use in your salon
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="booking">Booking</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => {
          const Icon = getCategoryIcon(template.smart_code)
          const gradient = getCategoryColor(template.smart_code)

          return (
            <Card
              key={template.template_id}
              className="hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {template.industry}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.module}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg mt-3">{template.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {template.rule_payload.description}
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <code className="text-xs break-all">{template.smart_code}</code>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setShowPreview(true)
                    }}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCloneTemplate(template)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Customize
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No templates found matching your criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.title}</DialogTitle>
            <DialogDescription>{selectedTemplate?.rule_payload.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-4">
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge>{selectedTemplate.industry}</Badge>
                  <Badge>{selectedTemplate.module}</Badge>
                  <Badge variant="outline">Template ID: {selectedTemplate.template_id}</Badge>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <code className="text-sm">{selectedTemplate.smart_code}</code>
                </div>
                {renderRuleDetails(selectedTemplate.rule_payload)}
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button
              onClick={() => selectedTemplate && handleCloneTemplate(selectedTemplate)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Customize This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
