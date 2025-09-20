'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// HERA DNA Standard Color Palette for Assessment Dashboards
const HERA_ASSESSMENT_COLORS = {
  // Score Colors
  excellent: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' },
  good: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50' },
  fair: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/50' },
  poor: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/50' },

  // Text Colors with WCAG AAA compliance
  primary: 'text-gray-900 dark:text-foreground',
  secondary: 'text-gray-700 dark:text-gray-200',
  muted: 'text-muted-foreground dark:text-gray-300',

  // Status Colors
  complete: 'text-emerald-400',
  pending: 'text-amber-400',
  incomplete: 'text-muted-foreground',

  // Tab Colors (high contrast)
  tabInactive: 'text-teal-200 hover:text-teal-100',
  tabActive: 'text-foreground'
}

interface TabConfig {
  value: string
  label: string
  content: React.ReactNode
}

interface AssessmentDashboardDNAProps {
  title: string
  subtitle?: string
  score?: number
  scoreLabel?: string
  tabs?: TabConfig[]
  actions?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function AssessmentDashboardDNA({
  title,
  subtitle,
  score,
  scoreLabel = 'Overall Score',
  tabs,
  actions,
  className,
  children
}: AssessmentDashboardDNAProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return HERA_ASSESSMENT_COLORS.excellent
    if (score >= 60) return HERA_ASSESSMENT_COLORS.good
    if (score >= 40) return HERA_ASSESSMENT_COLORS.fair
    return HERA_ASSESSMENT_COLORS.poor
  }

  const scoreColor = score ? getScoreColor(score) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden backdrop-blur-xl',
          'bg-background/90 dark:bg-background/90',
          'border border-border/20 dark:border-gray-800/50',
          'shadow-xl',
          className
        )}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-emerald-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-emerald-500/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent dark:from-black/20" />
        </div>

        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className={cn('text-2xl font-bold', HERA_ASSESSMENT_COLORS.primary)}>
                {title}
              </CardTitle>
              {subtitle && (
                <CardDescription className={cn('mt-1', HERA_ASSESSMENT_COLORS.secondary)}>
                  {subtitle}
                </CardDescription>
              )}
            </div>

            {/* Score Display */}
            {score !== undefined && scoreColor && (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className={cn('text-sm font-medium mb-1', HERA_ASSESSMENT_COLORS.muted)}>
                    {scoreLabel}
                  </p>
                  <div
                    className={cn(
                      'px-6 py-3 rounded-xl',
                      'border-2',
                      scoreColor.bg,
                      scoreColor.border
                    )}
                  >
                    <span className={cn('text-3xl font-bold', scoreColor.text)}>{score}%</span>
                  </div>
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            )}

            {/* Actions without score */}
            {!score && actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </CardHeader>

        <CardContent>
          {tabs ? (
            <Tabs defaultValue={tabs[0]?.value} className="w-full">
              <TabsList
                className="grid w-full mb-6"
                style={{
                  gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'data-[state=active]:bg-gradient-to-r',
                      'data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20',
                      `data-[state=active]:${HERA_ASSESSMENT_COLORS.tabActive}`,
                      HERA_ASSESSMENT_COLORS.tabInactive,
                      'transition-all duration-200'
                    )}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map(tab => (
                <TabsContent key={tab.value} value={tab.value}>
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Helper Components with HERA DNA Standards

export function AssessmentScoreCard({
  label,
  score,
  total,
  className
}: {
  label: string
  score: number
  total?: number
  className?: string
}) {
  const percentage = total ? Math.round((score / total) * 100) : score
  const scoreColor =
    percentage >= 80
      ? HERA_ASSESSMENT_COLORS.excellent
      : percentage >= 60
        ? HERA_ASSESSMENT_COLORS.good
        : percentage >= 40
          ? HERA_ASSESSMENT_COLORS.fair
          : HERA_ASSESSMENT_COLORS.poor

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'p-6 rounded-xl',
        'bg-background/50 dark:bg-muted/50',
        'border border-border/50 dark:border-border/50',
        'backdrop-blur-sm',
        className
      )}
    >
      <p className={cn('text-sm font-medium mb-2', HERA_ASSESSMENT_COLORS.muted)}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={cn('text-3xl font-bold', scoreColor.text)}>{percentage}%</span>
        {total && (
          <span className={cn('text-sm', HERA_ASSESSMENT_COLORS.muted)}>
            ({score}/{total})
          </span>
        )}
      </div>
      <Progress
        value={percentage}
        className="mt-3 h-2"
        style={
          {
            '--progress-background': scoreColor.bg.replace('bg-', '').replace('/20', '')
          } as React.CSSProperties
        }
      />
    </motion.div>
  )
}

export function AssessmentStatusBadge({
  status,
  className
}: {
  status: 'complete' | 'pending' | 'incomplete'
  className?: string
}) {
  const config = {
    complete: {
      color: HERA_ASSESSMENT_COLORS.complete,
      label: 'Complete',
      bg: 'bg-emerald-500/10'
    },
    pending: {
      color: HERA_ASSESSMENT_COLORS.pending,
      label: 'Pending',
      bg: 'bg-amber-500/10'
    },
    incomplete: {
      color: HERA_ASSESSMENT_COLORS.incomplete,
      label: 'Incomplete',
      bg: 'bg-gray-500/10'
    }
  }

  const { color, label, bg } = config[status]

  return (
    <Badge variant="outline" className={cn('font-medium', bg, color, 'border-current', className)}>
      {label}
    </Badge>
  )
}

// Export color palette for consistent usage
export { HERA_ASSESSMENT_COLORS }
