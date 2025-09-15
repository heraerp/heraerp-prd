/**
 * HERA CRM Import/Export API Endpoint
 * Handles data migration and bulk operations
 *
 * Project Manager Task: Data Import/Export Backend
 */

import { NextRequest, NextResponse } from 'next/server'
import { createImportExportService } from '@/lib/crm/import-export-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organizationId, data, options } = body

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const importExportService = createImportExportService(organizationId)

    switch (action) {
      case 'import_contacts': {
        const { contacts, template } = data
        const result = await importExportService.importContacts(contacts, template, options)
        return NextResponse.json(result)
      }

      case 'import_opportunities': {
        const { opportunities, template } = data
        const result = await importExportService.importOpportunities(
          opportunities,
          template,
          options
        )
        return NextResponse.json(result)
      }

      case 'export_data': {
        const { exportOptions } = data
        const result = await importExportService.exportData(exportOptions)
        return NextResponse.json(result)
      }

      case 'get_templates': {
        const templates = importExportService.getImportTemplates()
        return NextResponse.json({ success: true, templates })
      }

      case 'parse_csv': {
        const { csvText } = data
        const parsed = importExportService.parseCSV(csvText)
        return NextResponse.json({ success: true, data: parsed })
      }

      case 'dry_run_import': {
        const { importData, template, entityType } = data
        let result

        if (entityType === 'contact') {
          result = await importExportService.importContacts(importData, template, {
            ...options,
            dryRun: true
          })
        } else if (entityType === 'opportunity') {
          result = await importExportService.importOpportunities(importData, template, {
            ...options,
            dryRun: true
          })
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid entity type for dry run' },
            { status: 400 }
          )
        }

        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('CRM Import/Export API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const action = searchParams.get('action')

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const importExportService = createImportExportService(organizationId)

    switch (action) {
      case 'templates': {
        const templates = importExportService.getImportTemplates()
        return NextResponse.json({ success: true, templates })
      }

      case 'export_sample': {
        // Generate sample CSV for download
        const entityType = searchParams.get('entityType') as 'contact' | 'opportunity' | 'task'

        let sampleData: any[]
        switch (entityType) {
          case 'contact':
            sampleData = [
              {
                name: 'John Doe',
                company: 'Sample Corp',
                email: 'john@sample.com',
                phone: '(555) 123-4567',
                status: 'lead',
                industry: 'Technology',
                value: 5000,
                source: 'Website',
                notes: 'Interested in our services'
              }
            ]
            break
          case 'opportunity':
            sampleData = [
              {
                name: 'Sample Deal',
                contact: 'John Doe',
                company: 'Sample Corp',
                stage: 'proposal',
                value: 25000,
                closeDate: '2024-12-31',
                probability: 75,
                assignedTo: 'sales@company.com',
                description: 'Large enterprise deal'
              }
            ]
            break
          default:
            sampleData = []
        }

        // Convert to CSV
        const result = await importExportService.exportData({
          entityType: 'contact', // Doesn't matter for sample
          format: 'csv'
        })

        // Use the sample data instead
        const headers = Object.keys(sampleData[0] || {})
        const csvLines = [
          headers.map(h => `"${h}"`).join(','),
          ...sampleData.map(item => headers.map(h => `"${item[h] || ''}"`).join(','))
        ]
        const csvContent = csvLines.join('\n')

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="sample-${entityType}-import.csv"`
          }
        })
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('CRM Import/Export API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
