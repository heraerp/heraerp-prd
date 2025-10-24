/**
 * HERA Enterprise Import Modal
 * Smart Code: HERA.ENTERPRISE.IMPORT_EXPORT.MODAL.V1
 *
 * Reusable import modal with instructions, progress tracking, and results
 */

'use client'

import React, { useRef } from 'react'
import { Upload, Download, Sparkles, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import type { ImportProgress, ImportResult } from './types'

const COLORS = {
  charcoal: '#1A1A1A',
  charcoalDark: '#0F0F0F',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C'
}

interface HeraImportModalProps {
  open: boolean
  onClose: () => void
  entityName: string
  entityNamePlural: string
  isImporting: boolean
  importProgress: ImportProgress | null
  importResults: ImportResult | null
  onDownloadTemplate: () => Promise<void>
  onImport: (file: File) => Promise<void>
  instructions?: string[]
}

export function HeraImportModal({
  open,
  onClose,
  entityName,
  entityNamePlural,
  isImporting,
  importProgress,
  importResults,
  onDownloadTemplate,
  onImport,
  instructions
}: HeraImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await onImport(file)
      e.target.value = '' // Reset input
    }
  }

  const handleClose = () => {
    if (!isImporting) {
      onClose()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.bronze}40`,
          boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
        }}
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: COLORS.bronze + '20',
                border: `1px solid ${COLORS.bronze}40`
              }}
            >
              <Upload className="w-5 h-5" style={{ color: COLORS.bronze }} />
            </div>
            <AlertDialogTitle className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
              Import {entityNamePlural}
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4" style={{ color: COLORS.champagne }}>
          {/* Instructions */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: COLORS.charcoalDark + '80',
              borderColor: COLORS.gold + '30'
            }}
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: COLORS.gold }}>
              <Sparkles className="w-4 h-4" />
              Import Instructions
            </h3>
            <ul className="text-sm space-y-1.5 ml-6 list-disc opacity-90">
              {instructions ? (
                instructions.map((instruction, i) => <li key={i}>{instruction}</li>)
              ) : (
                <>
                  <li>Download the template to see the correct format</li>
                  <li><span className="font-semibold">Required fields</span> are marked with * in the header</li>
                  <li>Fill in all required information for each {entityName.toLowerCase()}</li>
                  <li>Reference data must match existing entries exactly (case-insensitive)</li>
                  <li>Save the file and upload it to import</li>
                </>
              )}
            </ul>
          </div>

          {/* Download Template Button */}
          <button
            onClick={onDownloadTemplate}
            disabled={isImporting}
            className="w-full min-h-[48px] rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: COLORS.gold + '20',
              border: `1px solid ${COLORS.gold}50`,
              color: COLORS.champagne
            }}
          >
            <Download className="w-4 h-4" />
            Download Import Template
          </button>

          {/* File Upload */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center"
            style={{ borderColor: COLORS.bronze + '40' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isImporting}
            />
            <label
              htmlFor="import-file"
              className={`cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isImporting && fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.bronze }} />
              <p className="font-semibold mb-1" style={{ color: COLORS.champagne }}>
                {isImporting ? 'Importing...' : 'Click to select Excel or CSV file'}
              </p>
              <p className="text-sm opacity-70">Supports .xlsx, .xls, and .csv formats</p>
            </label>
          </div>

          {/* Progress Bar */}
          {isImporting && importProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: COLORS.champagne }}>
                  Import Progress {importProgress.currentItem ? `- ${importProgress.currentItem}` : ''}
                </span>
                <span style={{ color: COLORS.gold }}>{importProgress.percentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.charcoalDark }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${importProgress.percentage}%`,
                    backgroundColor: COLORS.gold,
                    boxShadow: `0 0 10px ${COLORS.gold}80`
                  }}
                />
              </div>
              <p className="text-xs text-center opacity-70">
                {importProgress.current} of {importProgress.total} {entityNamePlural.toLowerCase()} processed
              </p>
            </div>
          )}

          {/* Results */}
          {importResults && (
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.charcoalDark + '80',
                borderColor:
                  importResults.total === 0
                    ? COLORS.gold + '50'
                    : importResults.failed > 0
                    ? '#FFA500'
                    : COLORS.emerald + '50'
              }}
            >
              <h3 className="font-semibold mb-3" style={{ color: COLORS.champagne }}>
                Import Results
              </h3>

              {importResults.total === 0 && importResults.errors.length === 0 ? (
                <div className="text-center py-4">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: COLORS.gold }} />
                  <p className="font-medium mb-2">Template validated successfully</p>
                  <p className="text-sm opacity-70 mb-4">
                    No data found. Fill in the template and upload again to import {entityNamePlural.toLowerCase()}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center text-sm mb-3">
                    <div>
                      <p className="opacity-70">Total</p>
                      <p className="text-lg font-bold">{importResults.total}</p>
                    </div>
                    <div>
                      <p className="opacity-70">Success</p>
                      <p className="text-lg font-bold" style={{ color: COLORS.emerald }}>
                        {importResults.success}
                      </p>
                    </div>
                    <div>
                      <p className="opacity-70">Failed</p>
                      <p className="text-lg font-bold" style={{ color: '#FF6B6B' }}>
                        {importResults.failed}
                      </p>
                    </div>
                  </div>

                  {importResults.errors.length > 0 && (
                    <div className="space-y-1 mb-4">
                      <p className="text-xs font-semibold" style={{ color: '#FFA500' }}>
                        First {Math.min(importResults.errors.length, 10)} errors:
                      </p>
                      <div className="max-h-32 overflow-y-auto text-xs space-y-0.5">
                        {importResults.errors.slice(0, 10).map((error, idx) => (
                          <p key={idx} className="opacity-80">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {importResults.success > 0 && importResults.failed === 0 && (
                    <div className="text-center pt-3 border-t" style={{ borderColor: COLORS.bronze + '30' }}>
                      <p className="text-sm font-medium mb-3" style={{ color: COLORS.emerald }}>
                        ✓ All {entityNamePlural.toLowerCase()} imported successfully!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel
            onClick={handleClose}
            disabled={isImporting}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            {importResults ? 'Close' : 'Cancel'}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
