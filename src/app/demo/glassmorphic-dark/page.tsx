'use client'

import { useState } from 'react'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Search,
  Bell,
  Settings,
  CreditCard,
  Package,
  BarChart3
} from 'lucide-react'
import {
  GlassmorphicDarkLayout,
  GlassmorphicCard,
  GlassmorphicButton,
  GlassmorphicStatCard,
  GlassmorphicInput,
  glassmorphicThemes
} from '@/lib/dna/components/layouts/GlassmorphicDarkLayout'

export default function GlassmorphicDarkDemo() {
  const [selectedTheme, setSelectedTheme] = useState('isp')
  const [searchValue, setSearchValue] = useState('')
  
  const theme = glassmorphicThemes[selectedTheme as keyof typeof glassmorphicThemes]
  
  return (
    <GlassmorphicDarkLayout theme={theme}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Glassmorphic Dark Template</h1>
            <p className="text-white/60 mt-1">HERA DNA Design System Showcase</p>
          </div>
          
          {/* Theme Selector */}
          <select 
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
          >
            {Object.keys(glassmorphicThemes).map(key => (
              <option key={key} value={key}>
                {glassmorphicThemes[key as keyof typeof glassmorphicThemes].name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Search Bar */}
        <GlassmorphicInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search anything..."
          theme={theme}
          icon={Search}
        />
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassmorphicStatCard
            label="Total Revenue"
            value="$125,430"
            icon={DollarSign}
            theme={theme}
            trend={{ value: 12.5, isPositive: true }}
          />
          <GlassmorphicStatCard
            label="Active Users"
            value="3,842"
            icon={Users}
            theme={theme}
            trend={{ value: 8.3, isPositive: true }}
          />
          <GlassmorphicStatCard
            label="Total Orders"
            value="1,234"
            icon={ShoppingCart}
            theme={theme}
            trend={{ value: -2.4, isPositive: false }}
          />
          <GlassmorphicStatCard
            label="Growth Rate"
            value="23.5%"
            icon={TrendingUp}
            theme={theme}
            trend={{ value: 5.7, isPositive: true }}
          />
        </div>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Large Card */}
          <div className="lg:col-span-2">
            <GlassmorphicCard theme={theme}>
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ background: `linear-gradient(to bottom right, ${theme.colors.secondary}, ${theme.colors.primary})` }}
                      >
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Order #{1000 + item}</p>
                        <p className="text-xs text-white/60">2 hours ago</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-white">${(Math.random() * 1000).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </GlassmorphicCard>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <GlassmorphicCard theme={theme}>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <GlassmorphicButton theme={theme} variant="primary" className="w-full">
                  <CreditCard className="h-4 w-4" />
                  <span>Process Payment</span>
                </GlassmorphicButton>
                <GlassmorphicButton theme={theme} variant="secondary" className="w-full">
                  <BarChart3 className="h-4 w-4" />
                  <span>View Reports</span>
                </GlassmorphicButton>
                <GlassmorphicButton theme={theme} variant="danger" className="w-full">
                  <Bell className="h-4 w-4" />
                  <span>Send Alert</span>
                </GlassmorphicButton>
              </div>
            </GlassmorphicCard>
            
            {/* Settings Card */}
            <GlassmorphicCard theme={theme}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Settings</h3>
                <Settings className="h-5 w-5 text-white/60" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">Notifications</span>
                  <div 
                    className="w-10 h-6 rounded-full p-1 cursor-pointer transition-colors"
                    style={{ backgroundColor: theme.colors.secondary + '30' }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full transition-transform translate-x-4"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">Dark Mode</span>
                  <div className="w-10 h-6 bg-white/10 rounded-full p-1 cursor-pointer">
                    <div className="w-4 h-4 bg-white/40 rounded-full" />
                  </div>
                </div>
              </div>
            </GlassmorphicCard>
          </div>
        </div>
        
        {/* Color Palette Display */}
        <GlassmorphicCard theme={theme}>
          <h3 className="text-lg font-semibold text-white mb-4">Current Theme Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(theme.colors).map(([name, color]) => (
              <div key={name} className="text-center">
                <div 
                  className="w-full h-20 rounded-lg mb-2 border border-white/20"
                  style={{ backgroundColor: color }}
                />
                <p className="text-xs text-white/60 capitalize">{name}</p>
                <p className="text-xs text-white/80 font-mono">{color}</p>
              </div>
            ))}
          </div>
        </GlassmorphicCard>
      </div>
    </GlassmorphicDarkLayout>
  )
}