// ================================================================================
// REPORTS PRINT HEADER
// Smart Code: HERA.UI.REPORTS.PRINT_HEADER.v1
// Professional print header with logo, title, and metadata
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Building2, Calendar, Globe, FileText } from 'lucide-react'

interface PrintHeaderProps {
  reportTitle: string
  reportSubtitle?: string
  organization?: {
    name: string
    address?: string
    phone?: string
    email?: string
    tax_id?: string
    logo_url?: string
  }
  reportPeriod: string
  generatedAt?: Date
  currency?: string
  branch?: {
    name: string
    code: string
  }
  filters?: {
    label: string
    value: string
  }[]
  showLogo?: boolean
  className?: string
}

export function PrintHeader({
  reportTitle,
  reportSubtitle,
  organization,
  reportPeriod,
  generatedAt = new Date(),
  currency = 'AED',
  branch,
  filters = [],
  showLogo = true,
  className
}: PrintHeaderProps) {
  return (
    <div className={`print-header bg-white dark:bg-gray-900 ${className}`}>
      {/* Organization Header */}
      <div className="flex items-start justify-between mb-6">
        {/* Organization Info */}
        <div className="flex items-start gap-4">
          {/* Logo */}
          {showLogo && organization?.logo_url && (
            <div className="flex-shrink-0">
              <img
                src={organization.logo_url}
                alt={`${organization.name} logo`}
                className="h-16 w-16 object-contain"
                onError={e => {
                  // Hide logo if it fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Organization Details */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold ink dark:text-gray-100">
              {organization?.name || 'Organization Name'}
            </h1>

            {organization?.address && (
              <p className="text-sm dark:ink-muted flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {organization.address}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm dark:ink-muted">
              {organization?.phone && <span>Tel: {organization.phone}</span>}
              {organization?.email && <span>Email: {organization.email}</span>}
              {organization?.tax_id && <span>Tax ID: {organization.tax_id}</span>}
            </div>
          </div>
        </div>

        {/* Report Metadata */}
        <div className="text-right space-y-1 text-sm">
          <div className="dark:ink-muted">Generated</div>
          <div className="font-medium ink dark:text-gray-100">
            {generatedAt.toLocaleString('en-AE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <div className="text-xs ink-muted">
            {generatedAt.toLocaleString('en-AE', {
              timeZoneName: 'short'
            })}
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Report Header */}
      <div className="text-center space-y-3 mb-6">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-5 w-5 text-violet-600" />
          <h2 className="text-xl font-bold ink dark:text-gray-100 uppercase tracking-wide">
            {reportTitle}
          </h2>
        </div>

        {reportSubtitle && <p className="text-sm dark:ink-muted">{reportSubtitle}</p>}

        <div className="flex items-center justify-center gap-2">
          <Calendar className="h-4 w-4 ink-muted" />
          <span className="text-lg font-medium ink dark:text-gray-100">{reportPeriod}</span>
        </div>

        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="outline" className="border-violet-300 text-violet-700">
            <Globe className="h-3 w-3 mr-1" />
            Currency: {currency}
          </Badge>

          {branch && (
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              <Building2 className="h-3 w-3 mr-1" />
              Branch: {branch.name} ({branch.code})
            </Badge>
          )}
        </div>
      </div>

      {/* Filters Summary */}
      {filters.length > 0 && (
        <>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium ink dark:text-gray-300 mb-2">Applied Filters:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filters.map((filter, index) => (
                <div key={index} className="text-sm">
                  <span className="dark:ink-muted">{filter.label}:</span>{' '}
                  <span className="font-medium ink dark:text-gray-100">{filter.value}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="mb-6" />
        </>
      )}

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .print-header {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          .print-header h1,
          .print-header h2,
          .print-header h3 {
            color: black !important;
          }

          .print-header .text-gray-900 {
            color: black !important;
          }

          .print-header .text-gray-600,
          .print-header .text-gray-500 {
            color: #666 !important;
          }

          .print-header .border-violet-300,
          .print-header .border-blue-300 {
            border-color: #ccc !important;
          }

          .print-header .text-violet-700,
          .print-header .text-blue-700,
          .print-header .text-violet-600 {
            color: #333 !important;
          }

          .print-header .bg-gray-50 {
            background-color: #f9f9f9 !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>
    </div>
  )
}

// Utility component for print-specific layouts
export function PrintLayout({
  children,
  header,
  footer,
  className = ''
}: {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`print-layout min-h-screen bg-white text-black ${className}`}>
      {/* Print Header */}
      {header && <div className="print-header-section mb-8">{header}</div>}

      {/* Main Content */}
      <div className="print-content">{children}</div>

      {/* Print Footer */}
      {footer && (
        <div className="print-footer-section mt-8 pt-4 border-t border-gray-300">{footer}</div>
      )}

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body {
            font-size: 12px !important;
            line-height: 1.3 !important;
          }

          .print-layout {
            background: white !important;
            color: black !important;
            font-size: 12px !important;
            margin: 0 !important;
            padding: 0.5in !important;
          }

          .print-header-section {
            margin-bottom: 0.3in !important;
          }

          .print-footer-section {
            margin-top: 0.3in !important;
            padding-top: 0.1in !important;
            border-top: 1px solid #333 !important;
            page-break-inside: avoid;
          }

          /* Table styles for print */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
          }

          th,
          td {
            border: 1px solid #333 !important;
            padding: 4px 6px !important;
            text-align: left !important;
          }

          th {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
            color: black !important;
          }

          /* Amount columns */
          .amount,
          .text-right {
            text-align: right !important;
            font-family: 'Courier New', monospace !important;
          }

          /* Hide non-essential elements */
          .no-print,
          button:not(.print-button),
          .print-hidden {
            display: none !important;
          }

          /* Force page breaks */
          .page-break-before {
            page-break-before: always !important;
          }

          .page-break-after {
            page-break-after: always !important;
          }

          .page-break-inside-avoid {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  )
}

// Print footer component
export function PrintFooter({
  organization,
  currency = 'AED',
  disclaimer,
  pageNumbers = true
}: {
  organization?: { name: string; website?: string }
  currency?: string
  disclaimer?: string
  pageNumbers?: boolean
}) {
  return (
    <div className="print-footer text-xs ink-muted">
      <div className="flex justify-between items-center">
        <div>
          <div>Generated by HERA ERP System</div>
          {organization?.website && <div>Visit us: {organization.website}</div>}
        </div>

        <div className="text-right">
          <div>All amounts in {currency}</div>
          {disclaimer && <div className="mt-1">{disclaimer}</div>}
          {pageNumbers && (
            <div className="mt-1">
              Page <span className="page-number"></span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media print {
          .page-number::after {
            content: counter(page);
          }
        }
      `}</style>
    </div>
  )
}
