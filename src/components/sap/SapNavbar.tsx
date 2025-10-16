'use client'

import React from 'react'
import Link from 'next/link'
import { Search, Settings, Bell, HelpCircle, ChevronLeft, ChevronDown } from 'lucide-react'

export interface SapNavbarProps {
  title?: string
  breadcrumb?: string
  showBack?: boolean
  onBack?: () => void
  userInitials?: string
  userAvatar?: string
  showSearch?: boolean
  onSearchChange?: (query: string) => void
}

export function SapNavbar({
  title = "SAP",
  breadcrumb = "",
  showBack = true,
  onBack,
  userInitials = "EG",
  userAvatar,
  showSearch = true,
  onSearchChange
}: SapNavbarProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearchChange?.(query)
  }

  return (
    <header className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] h-12 border-b border-white/20 fixed top-0 left-0 right-0 z-50 flex items-center px-4 shadow-md">
      <div className="w-full flex items-center justify-between">
        {/* Left side - Back button, Logo and Breadcrumb */}
        <div className="flex items-center">
          {showBack && (
            <button 
              onClick={onBack}
              className="w-8 h-8 rounded border-none bg-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors mr-3"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          
          <Link href="/retail/home" className="flex items-center text-white no-underline">
            <div className="h-7 bg-white rounded px-2 flex items-center justify-center font-bold text-xs text-[#4A90E2] min-w-[40px]">
              {title}
            </div>
          </Link>
          
          {breadcrumb && (
            <div className="text-white text-sm font-normal ml-4 flex items-center">
              <span>{breadcrumb}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </div>
          )}
        </div>

        {/* Right side - Search and Actions */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative hidden md:block mr-4">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search..."
                className="w-60 px-3 py-1.5 bg-white/30 border border-white/40 rounded text-white placeholder-white/70 text-sm transition-all focus:outline-none focus:bg-white/40 focus:border-white/50"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
            </div>
          )}
          
          <button className="w-8 h-8 rounded border-none bg-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors" title="Search">
            <Search className="w-4 h-4" />
          </button>
          
          <button className="w-8 h-8 rounded border-none bg-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors" title="Help">
            <HelpCircle className="w-4 h-4" />
          </button>
          
          <button className="w-8 h-8 rounded border-none bg-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors" title="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          
          <button className="w-8 h-8 rounded border-none bg-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
          
          {/* User Avatar */}
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white border-2 border-white/30 cursor-pointer hover:scale-105 hover:border-white/50 transition-all ml-1">
            {userAvatar ? (
              <img src={userAvatar} alt="User" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-medium">{userInitials}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}