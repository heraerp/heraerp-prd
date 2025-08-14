'use client'

import React from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload, Download, Folder, File, Image, FileSpreadsheet, Search, Filter, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function CRMFilesPage() {
  const files = [
    { id: 1, name: 'Tech Solutions Proposal.pdf', type: 'pdf', size: '2.4 MB', modified: 'Today, 10:30 AM', contact: 'Sarah Johnson', icon: FileText },
    { id: 2, name: 'Contract Template.docx', type: 'doc', size: '156 KB', modified: 'Yesterday', contact: 'General', icon: FileText },
    { id: 3, name: 'Product Screenshots.zip', type: 'zip', size: '15.2 MB', modified: '3 days ago', contact: 'Mike Chen', icon: Folder },
    { id: 4, name: 'Pricing Sheet.xlsx', type: 'excel', size: '89 KB', modified: 'Last week', contact: 'Emily Rodriguez', icon: FileSpreadsheet },
    { id: 5, name: 'Company Logo.png', type: 'image', size: '245 KB', modified: 'Last week', contact: 'General', icon: Image },
  ]

  return (
    <CRMLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM Files</h1>
                <p className="text-gray-600 mt-1">Manage documents and attachments</p>
              </div>
            </div>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search files..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-gray-600">Total Files</p>
                <p className="text-2xl font-bold">247</p>
                <p className="text-xs text-gray-500 mt-1">Across all contacts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold">1.8 GB</p>
                <p className="text-xs text-gray-500 mt-1">Of 10 GB available</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-gray-600">Recent Uploads</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => {
                const Icon = file.icon
                return (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.modified}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {file.contact}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">Share</Button>
                      <Button size="sm" variant="ghost">Delete</Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  )
}