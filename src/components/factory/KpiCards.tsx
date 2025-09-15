/**
 * KPI Cards for Factory Dashboard
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, Shield, FileCheck, Calendar } from 'lucide-react'
import type { KPISet } from '@/lib/types/factory'

interface KpiCardsProps {
  kpis: KPISet
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const cards = [
    {
      title: 'Lead Time',
      value: `${kpis.leadTimeDays}d`,
      subtitle: 'PLAN → RELEASE',
      icon: Clock,
      color: 'from-blue-500 to-blue-600',
      target: '< 3 days',
      isGood: kpis.leadTimeDays <= 3
    },
    {
      title: 'Coverage',
      value: `${kpis.coverageAvg.toFixed(1)}%`,
      subtitle: 'Test Coverage Avg',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      target: '> 85%',
      isGood: kpis.coverageAvg >= 85
    },
    {
      title: 'Guardrail Pass',
      value: `${kpis.guardrailPassRate.toFixed(1)}%`,
      subtitle: 'Compliance Rate',
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      target: '> 95%',
      isGood: kpis.guardrailPassRate >= 95
    },
    {
      title: 'Audit Ready',
      value: kpis.auditReady ? 'YES' : 'NO',
      subtitle: 'SBOM + Attestations',
      icon: FileCheck,
      color: kpis.auditReady ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
      target: '30 day freshness',
      isGood: kpis.auditReady
    },
    {
      title: 'Fiscal Aligned',
      value: kpis.fiscalAligned ? 'OPEN' : 'CLOSED',
      subtitle: 'Period Status',
      icon: Calendar,
      color: kpis.fiscalAligned ? 'from-cyan-500 to-cyan-600' : 'from-orange-500 to-orange-600',
      target: 'Open period',
      isGood: kpis.fiscalAligned
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" aria-label="KPI Cards">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-background dark:bg-muted shadow-lg"
        >
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-10`} />

          {/* Content */}
          <div className="relative p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                  {card.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-foreground mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                <card.icon className="w-5 h-5 text-foreground" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">{card.subtitle}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Target: {card.target}
                </span>
                {card.isGood ? (
                  <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                ) : (
                  <span className="text-xs text-red-600 dark:text-red-400">!</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
