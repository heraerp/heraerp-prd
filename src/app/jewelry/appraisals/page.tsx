'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  Eye,
  Settings,
  BookOpen,
  Archive,
  Award,
  Search,
  Filter,
  Diamond,
  Sparkles
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

export default function JewelryAppraisalsPage() {
  // Mock data for dashboard metrics
  const metrics = {
    totalAppraisals: 156,
    totalValue: 2850000,
    pendingAppraisals: 8,
    completedThisMonth: 23,
    activeAppraisers: 4,
    avgCompletionTime: 3.2
  }

  // Navigation items for appraisal management
  const navigationItems = [
    {
      title: 'All Appraisals',
      description: 'View and manage all appraisal records',
      icon: FileText,
      href: '/jewelry/appraisals/list',
      count: metrics.totalAppraisals,
      color: 'jewelry-icon-gold'
    },
    {
      title: 'New Appraisal',
      description: 'Create a new jewelry appraisal',
      icon: Plus,
      href: '/jewelry/appraisals/new',
      color: 'jewelry-icon-gold'
    },
    {
      title: 'Pending Reviews',
      description: 'Appraisals awaiting review and approval',
      icon: Clock,
      href: '/jewelry/appraisals/pending',
      count: metrics.pendingAppraisals,
      color: 'jewelry-icon-gold'
    },
    {
      title: 'Completed',
      description: 'Finalized appraisal reports',
      icon: CheckCircle,
      href: '/jewelry/appraisals/completed',
      count: metrics.completedThisMonth,
      color: 'jewelry-icon-gold'
    },
    {
      title: 'Appraisers',
      description: 'Manage certified appraisers',
      icon: Users,
      href: '/jewelry/appraisals/appraisers',
      count: metrics.activeAppraisers,
      color: 'jewelry-icon-gold'
    },
    {
      title: 'Reports',
      description: 'Analytics and performance reports',
      icon: BarChart3,
      href: '/jewelry/appraisals/reports',
      color: 'jewelry-icon-gold'
    },
    {
      title: 'Calendar',
      description: 'Schedule and manage appointments',
      icon: Calendar,
      href: '/jewelry/appraisals/calendar',
      color: 'jewelry-icon-gold'
    },
    {
      title: 'Settings',
      description: 'Configure appraisal workflows',
      icon: Settings,
      href: '/jewelry/appraisals/settings',
      color: 'jewelry-icon-gold'
    }
  ]

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Shield className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Professional Appraisals
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Enterprise-grade jewelry valuation and certification management
            </p>
          </motion.div>

          {/* Summary Metrics */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="jewelry-glass-card jewelry-float p-6 text-center">
              <FileText className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{metrics.totalAppraisals}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Appraisals</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.1s' }}>
              <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">${(metrics.totalValue / 1000000).toFixed(1)}M</h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Value</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.2s' }}>
              <Clock className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{metrics.pendingAppraisals}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Pending Reviews</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.3s' }}>
              <TrendingUp className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{metrics.avgCompletionTime}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Avg Days</p>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
              <h2 className="jewelry-text-luxury text-xl font-semibold">Quick Actions</h2>
              <div className="flex gap-2">
                <Link href="/jewelry/appraisals/new">
                  <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                    <Plus className="jewelry-icon-gold" size={18} />
                    <span>New Appraisal</span>
                  </button>
                </Link>
                <Link href="/jewelry/appraisals/reports">
                  <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                    <BarChart3 className="jewelry-icon-gold" size={18} />
                    <span>View Reports</span>
                  </button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {navigationItems.slice(0, 4).map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <Link href={item.href}>
                    <div className="jewelry-glass-card jewelry-scale-hover p-6 text-center group cursor-pointer">
                      <item.icon className={`mx-auto mb-3 ${item.color} group-hover:scale-110 transition-transform`} size={32} />
                      <h3 className="jewelry-text-high-contrast font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="jewelry-text-muted text-sm mb-2">{item.description}</p>
                      {item.count && (
                        <div className="jewelry-text-luxury text-2xl font-bold">{item.count}</div>
                      )}
                      <ArrowRight className="mx-auto mt-2 jewelry-icon-gold opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Navigation Menu */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="jewelry-glass-panel"
          >
            <h2 className="jewelry-text-luxury text-xl font-semibold mb-6">Appraisal Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {navigationItems.slice(4).map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                >
                  <Link href={item.href}>
                    <div className="jewelry-glass-card jewelry-scale-hover p-4 group cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <item.icon className={`${item.color} group-hover:scale-110 transition-transform`} size={24} />
                        <div className="flex-1">
                          <h3 className="jewelry-text-high-contrast font-medium">{item.title}</h3>
                          <p className="jewelry-text-muted text-sm">{item.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.count && (
                            <span className="jewelry-status-luxury px-2 py-1 rounded text-xs font-medium">
                              {item.count}
                            </span>
                          )}
                          <ArrowRight className="jewelry-icon-gold opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="jewelry-text-luxury text-xl font-semibold">Recent Activity</h2>
              <Link href="/jewelry/appraisals/list">
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <Eye className="jewelry-icon-gold" size={16} />
                  <span>View All</span>
                </button>
              </Link>
            </div>

            <div className="space-y-3">
              <div className="jewelry-glass-card-subtle p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Diamond className="jewelry-icon-gold" size={20} />
                    <div>
                      <h4 className="jewelry-text-high-contrast font-medium">Diamond Engagement Ring - APR-2024-156</h4>
                      <p className="jewelry-text-muted text-sm">Completed appraisal for Sarah Johnson • $18,500</p>
                    </div>
                  </div>
                  <span className="jewelry-status-active px-2 py-1 rounded text-xs">COMPLETED</span>
                </div>
              </div>

              <div className="jewelry-glass-card-subtle p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="jewelry-icon-gold" size={20} />
                    <div>
                      <h4 className="jewelry-text-high-contrast font-medium">Vintage Pearl Necklace - APR-2024-155</h4>
                      <p className="jewelry-text-muted text-sm">In progress by Dr. Michael Sterling • $12,000</p>
                    </div>
                  </div>
                  <span className="jewelry-status-pending px-2 py-1 rounded text-xs">IN PROGRESS</span>
                </div>
              </div>

              <div className="jewelry-glass-card-subtle p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Award className="jewelry-icon-gold" size={20} />
                    <div>
                      <h4 className="jewelry-text-high-contrast font-medium">Emerald Tennis Bracelet - APR-2024-154</h4>
                      <p className="jewelry-text-muted text-sm">Awaiting client review • $45,000</p>
                    </div>
                  </div>
                  <span className="jewelry-status-luxury px-2 py-1 rounded text-xs">REVIEWED</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="text-center mt-12 mb-6"
          >
            <p className="text-jewelry-platinum-500 text-sm">
              Professional appraisal services powered by <span className="jewelry-text-luxury font-semibold">HERA Certification System</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}