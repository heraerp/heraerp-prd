'use client'

import React from 'react'

interface LeaveBalanceCardProps {
  type: string
  icon: React.ReactNode
  balance: number
  used: number
  color: string
  organizationId?: string
}

export function LeaveBalanceCard({
  type,
  icon,
  balance,
  used,
  color,
  organizationId
}: LeaveBalanceCardProps) {
  const remaining = balance - used
  const percentage = (used / balance) * 100

  return (
    <div
      className="relative overflow-hidden rounded-xl p-6 cursor-pointer group transition-all duration-700 hover:-translate-y-2"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(31, 41, 55, 0.85) 0%, 
            rgba(17, 24, 39, 0.9) 100%
          )
        `,
        backdropFilter: 'blur(20px) saturate(120%)',
        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.5),
          0 4px 16px rgba(${
            color.includes('purple')
              ? '147, 51, 234'
              : color.includes('blue')
                ? '59, 130, 246'
                : color.includes('emerald')
                  ? '16, 185, 129'
                  : '245, 158, 11'
          }, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">{type}</p>
          <p className="text-2xl font-bold !text-gray-100 dark:!text-foreground">{remaining} days</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-r ${color} text-foreground`}>{icon}</div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="!text-muted-foreground dark:!text-muted-foreground">Used</span>
          <span className="font-medium !text-gray-100 dark:!text-foreground">{used} days</span>
        </div>

        <div className="w-full bg-muted-foreground/10/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <p className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">
          {remaining} of {balance} days remaining
        </p>
      </div>
    </div>
  )
}
