'use client'

import React from 'react'

export interface SapTab {
  key: string
  label: string
  disabled?: boolean
  badge?: string | number
}

export interface SapTabStripProps {
  tabs: SapTab[]
  activeTab: string
  onTabChange: (tabKey: string) => void
  className?: string
}

export function SapTabStrip({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}: SapTabStripProps) {
  return (
    <div className={`sap-tab-container ${className}`}>
      <div className="sap-tab-strip sap-font">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`sap-tab ${activeTab === tab.key ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            onClick={() => !tab.disabled && onTabChange(tab.key)}
            disabled={tab.disabled}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}