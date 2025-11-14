'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/useToast'
import { downloadFile } from '@/lib/download'
import { Download, FileText, Printer } from 'lucide-react'

interface ExportButtonProps {
  runId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

export function ExportEvidencePackButton({
  runId,
  variant = 'outline',
  size = 'sm'
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const response = await fetch(`/api/export/run/${runId}`)

      if (!response.ok) {
        throw new Error('Failed to export evidence pack')
      }

      const blob = await response.blob()
      const filename = `hera-evidence-run-${runId}.zip`

      downloadFile(blob, filename)

      toast.success(
        'Evidence Pack Downloaded',
        'The complete evidence pack has been downloaded successfully.'
      )
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export Failed', 'Failed to export evidence pack. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export Evidence Pack'}
    </Button>
  )
}

export function PrintViewButton({ runId, variant = 'outline', size = 'sm' }: ExportButtonProps) {
  const handlePrint = () => {
    const printUrl = `/runs/${runId}/print`
    window.open(printUrl, '_blank')
  }

  return (
    <Button variant={variant} size={size} onClick={handlePrint} className="gap-2">
      <Printer className="h-4 w-4" />
      Print View
    </Button>
  )
}

interface ExportActionsProps {
  runId: string
}

export function ExportActions({ runId }: ExportActionsProps) {
  return (
    <div className="flex gap-2">
      <ExportEvidencePackButton runId={runId} />
      <PrintViewButton runId={runId} />
    </div>
  )
}
