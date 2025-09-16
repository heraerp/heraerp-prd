'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Textarea } from '@/src/components/ui/textarea'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
// import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import {
  BookOpen,
  Code,
  Users,
  Settings,
  Database,
  Globe,
  // Shield,
  Zap,
  Plus,
  FileText,
  Save,
  Eye,
  AlertCircle
} from 'lucide-react'

const documentationAreas = [
  {
    id: 'developer',
    name: 'Developer Documentation',
    icon: Code,
    description: 'API references, code examples, architecture guides',
    sections: [
      { id: 'api', name: 'API Reference', description: 'REST endpoints and GraphQL schemas' },
      { id: 'components', name: 'Components', description: 'React components and UI elements' },
      { id: 'architecture', name: 'Architecture', description: 'System design and patterns' },
      { id: 'deployment', name: 'Deployment', description: 'Setup and configuration guides' },
      { id: 'testing', name: 'Testing', description: 'Testing strategies and examples' }
    ]
  },
  {
    id: 'user',
    name: 'User Documentation',
    icon: Users,
    description: 'End-user guides and tutorials',
    sections: [
      { id: 'getting-started', name: 'Getting Started', description: 'First steps and onboarding' },
      { id: 'features', name: 'Features', description: 'Feature walkthroughs and usage' },
      { id: 'workflows', name: 'Workflows', description: 'Business process guides' },
      {
        id: 'troubleshooting',
        name: 'Troubleshooting',
        description: 'Common issues and solutions'
      },
      { id: 'faq', name: 'FAQ', description: 'Frequently asked questions' }
    ]
  },
  {
    id: 'admin',
    name: 'Admin Documentation',
    icon: Settings,
    description: 'System administration and configuration',
    sections: [
      { id: 'installation', name: 'Installation', description: 'System setup and requirements' },
      { id: 'configuration', name: 'Configuration', description: 'Settings and customization' },
      { id: 'security', name: 'Security', description: 'Access control and security policies' },
      { id: 'monitoring', name: 'Monitoring', description: 'Performance and health monitoring' },
      { id: 'backup', name: 'Backup & Recovery', description: 'Data protection strategies' }
    ]
  },
  {
    id: 'database',
    name: 'Database Documentation',
    icon: Database,
    description: 'Schema, relationships, and data models',
    sections: [
      { id: 'schema', name: 'Schema', description: 'Database structure and tables' },
      {
        id: 'relationships',
        name: 'Relationships',
        description: 'Entity relationships and constraints'
      },
      { id: 'migrations', name: 'Migrations', description: 'Database version control' },
      { id: 'procedures', name: 'Procedures', description: 'Stored procedures and functions' },
      { id: 'optimization', name: 'Optimization', description: 'Performance tuning guides' }
    ]
  }
]

const contentTypes = [
  { id: 'guide', name: 'Step-by-Step Guide', icon: BookOpen },
  { id: 'reference', name: 'Reference Documentation', icon: FileText },
  { id: 'tutorial', name: 'Interactive Tutorial', icon: Zap },
  { id: 'troubleshooting', name: 'Troubleshooting Guide', icon: AlertCircle }
]

export default function DocumentationUpdatePage() {
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedContentType, setSelectedContentType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPage, setGeneratedPage] = useState<{
    title: string
    url: string
  } | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const currentArea = documentationAreas.find(area => area.id === selectedArea)
  const currentSection = currentArea?.sections.find(section => section.id === selectedSection)

  const handleGeneratePage = async () => {
    if (!selectedArea || !selectedSection || !selectedContentType || !title || !content) {
      alert('Please fill in all required fields')
      return
    }

    setIsGenerating(true)

    try {
      // Simulate API call to generate documentation page
      const response = await fetch('/api/v1/documentation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          area: selectedArea,
          section: selectedSection,
          contentType: selectedContentType,
          title,
          description,
          content,
          metadata: {
            auto_generated: true,
            created_via: 'documentation-update-interface',
            section: currentSection?.name,
            area: currentArea?.name
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        setGeneratedPage(result)

        // Reset form
        setTitle('')
        setDescription('')
        setContent('')
        setSelectedContentType('')

        alert(`Documentation page "${title}" generated successfully!`)
      } else {
        throw new Error('Failed to generate documentation page')
      }
    } catch (error) {
      console.error('Error generating page:', error)
      alert('Error generating documentation page. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-hera-primary">Update Documentation</h1>
          <p className="text-muted-foreground">
            Select an area and create new documentation pages with automatic generation
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Area Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Documentation Areas
                </CardTitle>
                <CardDescription>Choose the area you want to update</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {documentationAreas.map(area => {
                  const Icon = area.icon
                  return (
                    <div
                      key={area.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedArea === area.id
                          ? 'border-hera-primary bg-hera-primary/5'
                          : 'border-border hover:border-hera-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedArea(area.id)
                        setSelectedSection('')
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-hera-primary mt-0.5" />
                        <div>
                          <h3 className="font-medium">{area.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{area.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Section and Content Form */}
          <div className="lg:col-span-2">
            <Tabs
              value={previewMode ? 'preview' : 'edit'}
              onValueChange={value => setPreviewMode(value === 'preview')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Documentation Page</CardTitle>
                    <CardDescription>
                      {currentArea
                        ? `Adding to ${currentArea.name}`
                        : 'Select an area to get started'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {currentArea && (
                      <>
                        {/* Section Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="section">Section</Label>
                          <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a section" />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              {currentArea.sections.map(section => (
                                <SelectItem key={section.id} value={section.id}>
                                  <div className="py-1">
                                    <div className="font-medium">{section.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {section.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {currentSection && (
                          <>
                            {/* Content Type Selection */}
                            <div className="space-y-2">
                              <Label>Content Type</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {contentTypes.map(type => {
                                  const Icon = type.icon
                                  return (
                                    <div
                                      key={type.id}
                                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedContentType === type.id
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                          : 'border-border hover:border-blue-300 dark:border-border dark:hover:border-blue-600'
                                      }`}
                                      onClick={() => setSelectedContentType(type.id)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Icon
                                          className={`w-5 h-5 ${
                                            selectedContentType === type.id
                                              ? 'text-primary'
                                              : 'text-muted-foreground'
                                          }`}
                                        />
                                        <div className="text-sm font-medium">{type.name}</div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            <Separator />

                            {/* Page Details */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="title">Page Title *</Label>
                                <Input
                                  id="title"
                                  placeholder="Enter page title"
                                  value={title}
                                  onChange={e => setTitle(e.target.value)}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                  id="description"
                                  placeholder="Brief description of the page content"
                                  value={description}
                                  onChange={e => setDescription(e.target.value)}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="content">Content *</Label>
                                <Textarea
                                  id="content"
                                  placeholder="Enter your documentation content (Markdown supported)"
                                  value={content}
                                  onChange={e => setContent(e.target.value)}
                                  rows={12}
                                  className="font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Button
                                onClick={handleGeneratePage}
                                disabled={isGenerating || !title || !content}
                                className="hera-button flex items-center gap-2"
                              >
                                {isGenerating ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4" />
                                    Generate Page
                                  </>
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                onClick={() => setPreviewMode(true)}
                                disabled={!content}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {!currentArea && (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Select a documentation area to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview">
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>Preview how your documentation page will look</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {content ? (
                      <div className="prose prose-sm max-w-none">
                        {title && <h1>{title}</h1>}
                        {description && <p className="lead">{description}</p>}
                        <div className="whitespace-pre-wrap">{content}</div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Add content to see preview</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Generated Page Success */}
        {generatedPage && (
          <Card className="mt-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Save className="w-5 h-5" />
                Page Generated Successfully!
              </CardTitle>
              <CardDescription className="text-green-700">
                Your documentation has been created and is ready to view
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{generatedPage.title}</p>
                  <p className="text-sm text-muted-foreground">{generatedPage.url}</p>
                </div>
                <Button asChild>
                  <a href={generatedPage.url} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    View Page
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
