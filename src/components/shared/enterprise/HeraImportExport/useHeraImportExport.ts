/**
 * HERA Enterprise Import/Export Hook
 * Smart Code: HERA.ENTERPRISE.IMPORT_EXPORT.HOOK.V1
 *
 * Reusable hook for Excel/CSV import and export functionality
 * Handles validation, progress tracking, error handling, and batch operations
 */

import { useState, useCallback } from 'react'
import type { ImportExportConfig, ImportResult, ImportProgress } from './types'

export function useHeraImportExport<T = any>(config: ImportExportConfig<T>) {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResults, setImportResults] = useState<ImportResult | null>(null)

  /**
   * Download template with instructions and reference data
   */
  const downloadTemplate = useCallback(async () => {
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      // ===== INSTRUCTIONS SHEET =====
      const instructionsData: any[] = [
        [`${config.entityName} Import Template`],
        [''],
        ['⚠️ IMPORTANT INSTRUCTIONS'],
        ['1. Fill in the data sheet with your information'],
        ['2. Required fields are marked with * in the header'],
        ['3. Ensure reference data matches existing entries exactly (case-insensitive)'],
        ['4. Save and upload the file to import'],
        ['']
      ]

      // Add field descriptions
      instructionsData.push(['FIELD DESCRIPTIONS:'])
      config.fields.forEach(field => {
        const required = field.required ? ' (REQUIRED)' : ' (Optional)'
        const typeInfo = field.type === 'enum' ? ` - Values: ${field.enumValues?.join(', ')}` : ''
        instructionsData.push([`${field.headerName}${required}${typeInfo}`])
        if (field.description) {
          instructionsData.push([`  ${field.description}`])
        }
      })
      instructionsData.push([''])

      // Add reference data
      if (config.referenceData && config.referenceData.length > 0) {
        instructionsData.push(['AVAILABLE REFERENCE DATA:'])
        config.referenceData.forEach(ref => {
          instructionsData.push([`${ref.displayName}:`])
          ref.items.forEach(item => instructionsData.push([`  - ${item.name}`]))
          instructionsData.push([''])
        })
      }

      // Add example row
      instructionsData.push(['EXAMPLE DATA:'])
      const exampleHeaders = config.fields.map(f => f.headerName)
      const exampleValues = config.fields.map(f => f.example ?? '')
      instructionsData.push(exampleHeaders)
      instructionsData.push(exampleValues)

      const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
      instructionsSheet['!cols'] = [{ wch: 80 }] // Wide column for readability
      XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions')

      // ===== DATA SHEET (Headers only) =====
      const headers = config.fields.map(f => f.required ? `${f.headerName}*` : f.headerName)
      const dataSheet = XLSX.utils.aoa_to_sheet([headers])

      // Set column widths based on header length
      dataSheet['!cols'] = config.fields.map(f => ({ wch: Math.max(f.headerName.length + 5, 15) }))

      XLSX.utils.book_append_sheet(wb, dataSheet, config.templateSheetName || 'Data')

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // Download
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const fileName = `${config.filePrefix || config.entityNamePlural}_Import_Template.xlsx`
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { success: true, fileName }
    } catch (error: any) {
      console.error('[HeraImportExport] Template download failed:', error)
      throw new Error(`Failed to download template: ${error.message}`)
    }
  }, [config])

  /**
   * Import data from Excel/CSV file
   */
  const importFile = useCallback(async (file: File): Promise<ImportResult> => {
    setIsImporting(true)
    setImportProgress({ current: 0, total: 0, percentage: 0 })
    setImportResults(null)

    try {
      const XLSX = await import('xlsx')

      // Read file
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      // Get data sheet
      const sheetName = workbook.SheetNames.includes(config.templateSheetName || 'Data')
        ? config.templateSheetName || 'Data'
        : workbook.SheetNames[0]

      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]

      // Validate file structure
      if (jsonData.length === 0) {
        throw new Error('File is empty. Please add headers and data.')
      }

      // Parse headers and data
      const headers = jsonData[0].map((h: any) => String(h || '').trim().replace('*', ''))
      const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== '' && cell !== null))

      // Handle empty data gracefully
      if (rows.length === 0) {
        const result: ImportResult = { total: 0, success: 0, failed: 0, errors: [] }
        setImportResults(result)
        setImportProgress({ current: 0, total: 0, percentage: 100 })
        setIsImporting(false)
        return result
      }

      setImportProgress({ current: 0, total: rows.length, percentage: 0 })

      const results: ImportResult = { total: rows.length, success: 0, failed: 0, errors: [] }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNum = i + 2 // Account for header row

        try {
          // Map row data to entity fields
          const entityData: any = {}

          config.fields.forEach((field, fieldIndex) => {
            // Find column index by matching header
            const colIndex = headers.findIndex(h =>
              h.toLowerCase() === field.headerName.toLowerCase()
            )

            if (colIndex === -1) {
              if (field.required) {
                throw new Error(`Required field "${field.headerName}" not found in file`)
              }
              return
            }

            const rawValue = row[colIndex]

            // Skip empty optional fields
            if (!rawValue && !field.required) {
              return
            }

            // Validate required fields
            if (field.required && !rawValue) {
              throw new Error(`${field.headerName} is required`)
            }

            // Parse value based on type
            let parsedValue: any

            if (field.parser) {
              // Use custom parser
              parsedValue = field.parser(rawValue)
            } else {
              // Use default parsers
              switch (field.type) {
                case 'number':
                  parsedValue = parseFloat(String(rawValue)) || 0
                  break
                case 'boolean':
                  parsedValue = String(rawValue).toLowerCase() === 'yes' ||
                                String(rawValue).toLowerCase() === 'true'
                  break
                case 'date':
                  parsedValue = new Date(rawValue).toISOString()
                  break
                case 'enum':
                  const enumValue = String(rawValue).trim()
                  if (field.enumValues && !field.enumValues.includes(enumValue)) {
                    throw new Error(
                      `Invalid value "${enumValue}" for ${field.headerName}. ` +
                      `Must be one of: ${field.enumValues.join(', ')}`
                    )
                  }
                  parsedValue = enumValue
                  break
                default:
                  parsedValue = String(rawValue).trim()
              }
            }

            entityData[field.fieldName] = parsedValue
          })

          // Custom validation if provided
          if (config.validateRow) {
            const validationError = config.validateRow(entityData, rowNum)
            if (validationError) {
              throw new Error(validationError)
            }
          }

          // Create entity
          await config.onCreate(entityData)
          results.success++

          // Update progress
          setImportProgress({
            current: i + 1,
            total: rows.length,
            percentage: Math.round(((i + 1) / rows.length) * 100),
            currentItem: entityData[config.fields[0]?.fieldName] || `Row ${rowNum}`
          })

        } catch (error: any) {
          results.failed++
          const errorMsg = `Row ${rowNum}: ${error.message || 'Unknown error'}`
          results.errors.push(errorMsg)
          console.error('[HeraImportExport] Import error:', errorMsg)
        }
      }

      setImportResults(results)
      setImportProgress({ current: rows.length, total: rows.length, percentage: 100 })
      return results

    } catch (error: any) {
      console.error('[HeraImportExport] Import failed:', error)
      const result: ImportResult = {
        total: 0,
        success: 0,
        failed: 0,
        errors: [error.message || 'Import failed']
      }
      setImportResults(result)
      throw error
    } finally {
      setIsImporting(false)
    }
  }, [config])

  /**
   * Export data to Excel
   */
  const exportData = useCallback(async (): Promise<{ success: boolean; fileName: string }> => {
    if (!config.exportData || config.exportData.length === 0) {
      throw new Error('No data available to export')
    }

    setIsExporting(true)

    try {
      const XLSX = await import('xlsx')

      // Prepare export data
      let exportRows: any[]

      if (config.exportMapper) {
        // Use custom mapper
        exportRows = config.exportData.map(config.exportMapper)
      } else {
        // Use default mapping based on fields
        exportRows = config.exportData.map(item => {
          const row: Record<string, any> = {}
          config.fields.forEach(field => {
            row[field.headerName] = (item as any)[field.fieldName] ?? ''
          })
          return row
        })
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportRows)

      // Set column widths
      ws['!cols'] = config.fields.map(f => ({
        wch: Math.max(f.headerName.length + 5, 15)
      }))

      XLSX.utils.book_append_sheet(wb, ws, config.entityNamePlural)

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const fileName = `${config.filePrefix || config.entityNamePlural}_Export_${timestamp}.xlsx`

      // Write file
      XLSX.writeFile(wb, fileName)

      return { success: true, fileName }

    } catch (error: any) {
      console.error('[HeraImportExport] Export failed:', error)
      throw new Error(`Failed to export data: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }, [config])

  return {
    // State
    isImporting,
    isExporting,
    importProgress,
    importResults,

    // Actions
    downloadTemplate,
    importFile,
    exportData,

    // Reset
    resetImport: () => {
      setImportProgress(null)
      setImportResults(null)
      setIsImporting(false)
    }
  }
}
