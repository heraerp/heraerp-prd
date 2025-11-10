'use client'

import React from 'react'
import Link from 'next/link'
import { Search, Settings, Bell, HelpCircle, User } from 'lucide-react'

export interface SapHeaderProps {
  title?: string
  breadcrumb?: string
  showSearch?: boolean
  onSearchChange?: (query: string) => void
}

export function SapHeader({
  title = "HERA",
  breadcrumb = "Manage Fixed Assets",
  showSearch = true,
  onSearchChange
}: SapHeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearchChange?.(query)
  }

  return (
    <header className="sap-header sap-font">
      <div className="sap-header-content">
        {/* Left side - Logo and Breadcrumb */}
        <div className="flex items-center">
          <Link href="/" className="sap-logo">
            <div className="sap-logo-icon">
              HERA
            </div>
          </Link>
          <div className="sap-breadcrumb">
            {breadcrumb}
          </div>
        </div>

        {/* Right side - Search and Actions */}
        <div className="sap-header-actions">
          {showSearch && (
            <div className="relative hidden md:block mr-4">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search..."
                className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white placeholder-white/70 text-sm w-64 focus:bg-white/15 focus:outline-none"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
            </div>
          )}
          
          <button className="sap-header-btn" title="Search">
            <Search className="w-4 h-4" />
          </button>
          
          <button className="sap-header-btn" title="Help">
            <HelpCircle className="w-4 h-4" />
          </button>
          
          <button className="sap-header-btn" title="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          
          <button className="sap-header-btn" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
          
          <button className="sap-header-btn" title="User Menu">
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}