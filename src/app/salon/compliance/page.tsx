'use client'

import React, { useState, useMemo } from 'react'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useStaffComplianceAlerts } from '@/hooks/useStaffComplianceAlerts'
import { AlertTriangle, FileText, Calendar, Filter, Download, RefreshCw, User, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

export default function CompliancePage() {
  const { organizationId, organization } = useSecuredSalonContext()
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'expired' | 'critical' | 'warning'>('all')
  const [filterDocType, setFilterDocType] = useState<'all' | 'visa' | 'insurance'>('all')

  const { alerts, stats, isLoading, expiredAlerts, criticalAlerts, warningAlerts } = useStaffComplianceAlerts({
    organizationId,
    includeArchived: false
  })

  // Filter alerts based on selected filters
  const filteredAlerts = useMemo(() => {
    let filtered = alerts

    // Filter by severity
    if (filterSeverity === 'expired') {
      filtered = expiredAlerts
    } else if (filterSeverity === 'critical') {
      filtered = criticalAlerts
    } else if (filterSeverity === 'warning') {
      filtered = warningAlerts
    }

    // Filter by document type
    if (filterDocType !== 'all') {
      filtered = filtered.filter(a => a.documentType === filterDocType)
    }

    return filtered
  }, [alerts, expiredAlerts, criticalAlerts, warningAlerts, filterSeverity, filterDocType])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'expired':
        return '#DC2626'
      case 'critical':
        return '#F59E0B'
      case 'warning':
        return '#F59E0B'
      default:
        return COLORS.emerald
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'expired':
        return 'Expired'
      case 'critical':
        return 'Critical'
      case 'warning':
        return 'Warning'
      default:
        return 'Valid'
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.black }}>
      {/* Premium Header */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
          borderBottom: `1px solid ${COLORS.gold}20`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}10 100%)`,
                    border: `1px solid ${COLORS.gold}40`,
                    boxShadow: `0 4px 12px ${COLORS.gold}20`
                  }}
                >
                  <FileText className="w-6 h-6" style={{ color: COLORS.gold }} />
                </div>
                <div>
                  <h1
                    className="text-3xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Compliance Dashboard
                  </h1>
                  <p className="text-sm mt-1" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                    Staff Document Expiration Monitoring
                  </p>
                </div>
              </div>

              <Link href="/salon/staffs">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
                  }}
                >
                  <User className="w-4 h-4" />
                  Manage Staff
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="p-6 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
              border: `1px solid ${stats.totalAlerts > 0 ? '#F59E0B30' : `${COLORS.gold}20`}`
            }}
          >
            <AlertTriangle className="w-8 h-8 mb-3" style={{ color: stats.totalAlerts > 0 ? '#F59E0B' : COLORS.gold }} />
            <p className="text-sm mb-1" style={{ color: COLORS.bronze }}>
              Total Alerts
            </p>
            <p className="text-3xl font-bold" style={{ color: stats.totalAlerts > 0 ? '#F59E0B' : COLORS.emerald }}>
              {stats.totalAlerts}
            </p>
          </div>

          <div
            className="p-6 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
              border: `1px solid ${stats.expiredCount > 0 ? '#DC262630' : `${COLORS.gold}20`}`
            }}
          >
            <XCircle className="w-8 h-8 mb-3" style={{ color: stats.expiredCount > 0 ? '#DC2626' : COLORS.emerald }} />
            <p className="text-sm mb-1" style={{ color: COLORS.bronze }}>
              Expired
            </p>
            <p className="text-3xl font-bold" style={{ color: stats.expiredCount > 0 ? '#DC2626' : COLORS.emerald }}>
              {stats.expiredCount}
            </p>
          </div>

          <div
            className="p-6 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
              border: `1px solid ${stats.criticalCount > 0 ? '#F59E0B30' : `${COLORS.gold}20`}`
            }}
          >
            <AlertTriangle className="w-8 h-8 mb-3" style={{ color: stats.criticalCount > 0 ? '#F59E0B' : COLORS.emerald }} />
            <p className="text-sm mb-1" style={{ color: COLORS.bronze }}>
              Critical (≤7 days)
            </p>
            <p className="text-3xl font-bold" style={{ color: stats.criticalCount > 0 ? '#F59E0B' : COLORS.emerald }}>
              {stats.criticalCount}
            </p>
          </div>

          <div
            className="p-6 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
              border: `1px solid ${COLORS.gold}20`
            }}
          >
            <User className="w-8 h-8 mb-3" style={{ color: COLORS.bronze }} />
            <p className="text-sm mb-1" style={{ color: COLORS.bronze }}>
              Staff Affected
            </p>
            <p className="text-3xl font-bold" style={{ color: COLORS.champagne }}>
              {stats.affectedStaffCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div
          className="p-6 rounded-xl mb-6"
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
            border: `1px solid ${COLORS.gold}20`
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5" style={{ color: COLORS.gold }} />
            <h2 className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
              Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Severity Filter */}
            <div>
              <label className="text-sm mb-2 block" style={{ color: COLORS.bronze }}>
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  color: COLORS.champagne,
                  border: `1px solid ${COLORS.gold}40`
                }}
              >
                <option value="all">All Severities</option>
                <option value="expired">Expired Only</option>
                <option value="critical">Critical (≤7 days)</option>
                <option value="warning">Warning (≤30 days)</option>
              </select>
            </div>

            {/* Document Type Filter */}
            <div>
              <label className="text-sm mb-2 block" style={{ color: COLORS.bronze }}>
                Document Type
              </label>
              <select
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  color: COLORS.champagne,
                  border: `1px solid ${COLORS.gold}40`
                }}
              >
                <option value="all">All Documents</option>
                <option value="visa">Visa Only</option>
                <option value="insurance">Insurance Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
            border: `1px solid ${COLORS.gold}20`
          }}
        >
          <div
            className="p-6 border-b"
            style={{
              borderColor: `${COLORS.gold}20`
            }}
          >
            <h2 className="text-xl font-semibold" style={{ color: COLORS.champagne }}>
              Document Alerts
            </h2>
            <p className="text-sm mt-1" style={{ color: COLORS.lightText, opacity: 0.7 }}>
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: `${COLORS.gold}10` }}>
            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: COLORS.gold }} />
                <p style={{ color: COLORS.lightText }}>Loading compliance data...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.emerald }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.champagne }}>
                  All Clear!
                </h3>
                <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
                  No compliance alerts found with current filters.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const severityColor = getSeverityColor(alert.severity)
                return (
                  <div
                    key={alert.id}
                    className="p-6 hover:bg-opacity-50 transition-all"
                    style={{
                      backgroundColor: `${severityColor}05`
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${severityColor}20`,
                            border: `2px solid ${severityColor}50`
                          }}
                        >
                          {alert.documentType === 'visa' ? (
                            <FileText className="w-5 h-5" style={{ color: severityColor }} />
                          ) : (
                            <Calendar className="w-5 h-5" style={{ color: severityColor }} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
                              {alert.staffName}
                            </h3>
                            <span
                              className="px-3 py-1 rounded-lg text-xs font-semibold"
                              style={{
                                backgroundColor: `${severityColor}20`,
                                color: severityColor,
                                border: `1px solid ${severityColor}40`
                              }}
                            >
                              {getSeverityLabel(alert.severity)}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm" style={{ color: COLORS.lightText }}>
                              <strong style={{ color: COLORS.champagne }}>
                                {alert.documentType === 'visa' ? 'Visa' : 'Insurance'}:
                              </strong>{' '}
                              {alert.message}
                            </p>
                            <p className="text-xs" style={{ color: COLORS.bronze }}>
                              Expiry Date: {new Date(alert.expiryDate).toLocaleDateString('en-AE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link href={`/salon/staffs`}>
                        <button
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                          style={{
                            backgroundColor: `${COLORS.gold}20`,
                            border: `1px solid ${COLORS.gold}40`,
                            color: COLORS.champagne
                          }}
                        >
                          Update
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
