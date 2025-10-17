'use client'

import React from 'react'
import { SapHeader } from '@/components/sap/SapHeader'
import { SapObjectHeader, type ObjectAttribute, type KeyFigure } from '@/components/sap/SapObjectHeader'
import { SapTabStrip, type SapTab } from '@/components/sap/SapTabStrip'
import { SapTable, type SapTableColumn, type SapTableRecord } from '@/components/sap/SapTable'
import { BarChart3, TrendingUp, Calendar, MapPin, Users, Building, Sparkles, Zap, Layers } from 'lucide-react'

export default function PremiumAssetDetailsPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('values')

  // Asset data - matching the SAP screenshot format
  const assetAttributes: ObjectAttribute[] = [
    { label: 'Asset Class', value: 'Building' },
    { label: 'Capitalized On', value: '01.01.2020' },
    { label: 'Cost Center', value: '1000' },
    { label: 'Plant', value: 'HEAD' },
    { label: 'Location', value: 'Main Building' },
    { label: 'Room', value: 'B1-001' }
  ]

  const keyFigures: KeyFigure[] = [
    { value: 500000, currency: 'EUR', label: 'Acquisition Value' },
    { value: 125000, currency: 'EUR', label: 'Accumulated Depreciation' },
    { value: 375000, currency: 'EUR', label: 'Net Book Value' }
  ]

  const tabs: SapTab[] = [
    { key: 'values', label: 'Values' },
    { key: 'general', label: 'General' },
    { key: 'origin', label: 'Origin' },
    { key: 'compare', label: 'Compare Values' },
    { key: 'attachments', label: 'Attachments', badge: '3' },
    { key: 'notes', label: 'Notes' }
  ]

  // Depreciation Areas table data - matching SAP format
  const depreciationColumns: SapTableColumn[] = [
    { key: 'area', label: 'Depreciation Area', width: '150px' },
    { key: 'description', label: 'Description', width: '200px' },
    { key: 'acquisitionValue', label: 'Acquisition Value', align: 'right', width: '150px' },
    { key: 'accDepreciation', label: 'Acc. Depreciation', align: 'right', width: '150px' },
    { key: 'netBookValue', label: 'Net Book Value', align: 'right', width: '150px' },
    { key: 'depMethod', label: 'Depreciation Method', width: '180px' },
    { key: 'usefulLife', label: 'Useful Life', align: 'center', width: '120px' }
  ]

  const depreciationData: SapTableRecord[] = [
    {
      id: '01',
      area: '01',
      description: 'Book depreciation',
      acquisitionValue: '500,000.00 EUR',
      accDepreciation: '125,000.00 EUR',
      netBookValue: '375,000.00 EUR',
      depMethod: 'Straight-line',
      usefulLife: '20 years',
      children: [
        {
          id: '01-detail-1',
          area: '',
          description: 'Annual Depreciation',
          acquisitionValue: '',
          accDepreciation: '25,000.00 EUR',
          netBookValue: '',
          depMethod: 'Annual',
          usefulLife: ''
        }
      ]
    },
    {
      id: '02',
      area: '02',
      description: 'Tax depreciation',
      acquisitionValue: '500,000.00 EUR',
      accDepreciation: '150,000.00 EUR',
      netBookValue: '350,000.00 EUR',
      depMethod: 'Declining balance',
      usefulLife: '15 years'
    },
    {
      id: '15',
      area: '15',
      description: 'Cost accounting',
      acquisitionValue: '500,000.00 EUR',
      accDepreciation: '120,000.00 EUR',
      netBookValue: '380,000.00 EUR',
      depMethod: 'Units of production',
      usefulLife: '25 years'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'values':
        return (
          <div className="space-y-6">
            {/* Enhanced Depreciation Areas Table */}
            <div className="premium-content-section">
              <div className="premium-section-header">
                <h3 className="premium-section-title">
                  <Layers className="w-5 h-5" />
                  Depreciation Areas
                </h3>
                <div className="premium-section-actions">
                  <button className="premium-icon-btn" title="AI Insights">
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button className="premium-icon-btn" title="Auto-calculate">
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="premium-table-wrapper">
                <SapTable
                  columns={depreciationColumns}
                  data={depreciationData}
                  expandable={true}
                  className="premium-table"
                />
              </div>
            </div>
            
            {/* Enhanced Life Cycle Chart */}
            <div className="premium-content-section">
              <div className="premium-section-header">
                <h3 className="premium-section-title">
                  <BarChart3 className="w-5 h-5" />
                  Asset Value Life Cycle
                </h3>
                <div className="premium-section-actions">
                  <button className="premium-icon-btn" title="Export Chart">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-8">
                <div className="premium-chart-container">
                  <div className="premium-chart-content">
                    <BarChart3 className="w-20 h-20 text-blue-400 mx-auto mb-6" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">Interactive Asset Analytics</h4>
                    <p className="text-gray-600 mb-6">Advanced depreciation modeling with predictive insights</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">📈</div>
                        <div className="text-gray-500 mt-1">Growth Tracking</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">🎯</div>
                        <div className="text-gray-500 mt-1">Value Prediction</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">⚡</div>
                        <div className="text-gray-500 mt-1">Real-time Updates</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'general':
        return (
          <div className="premium-content-section">
            <div className="premium-section-header">
              <h3 className="premium-section-title">
                <Building className="w-5 h-5" />
                General Information
              </h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="premium-form-group">
                  <label className="premium-form-label">Asset Description</label>
                  <input type="text" value="Main Office Building" className="premium-form-input" readOnly />
                </div>
                <div className="premium-form-group">
                  <label className="premium-form-label">Inventory Number</label>
                  <input type="text" value="INV-2020-001" className="premium-form-input" readOnly />
                </div>
                <div className="premium-form-group">
                  <label className="premium-form-label">Serial Number</label>
                  <input type="text" value="BLDG-HQ-001" className="premium-form-input" readOnly />
                </div>
                <div className="premium-form-group">
                  <label className="premium-form-label">Manufacturer</label>
                  <input type="text" value="Construction Corp" className="premium-form-input" readOnly />
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'origin':
        return (
          <div className="premium-content-section">
            <div className="premium-section-header">
              <h3 className="premium-section-title">
                <MapPin className="w-5 h-5" />
                Asset Origin & History
              </h3>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                <div className="premium-timeline-item">
                  <div className="premium-timeline-marker bg-blue-500"></div>
                  <div className="premium-timeline-content">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold text-lg">January 1, 2020</span>
                    </div>
                    <p className="text-gray-700 font-medium">Asset acquired and capitalized</p>
                    <p className="text-sm text-gray-500 mt-2">Initial value: 500,000.00 EUR</p>
                  </div>
                </div>
                <div className="premium-timeline-item">
                  <div className="premium-timeline-marker bg-green-500"></div>
                  <div className="premium-timeline-content">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold text-lg">March 15, 2021</span>
                    </div>
                    <p className="text-gray-700 font-medium">Major renovation completed</p>
                    <p className="text-sm text-gray-500 mt-2">Additional investment: 50,000.00 EUR</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="premium-content-section">
            <div className="p-12 text-center">
              <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View</h3>
              <p className="text-gray-600">Enhanced content for {activeTab} tab with advanced features and premium styling.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="premium-app">
      {/* Premium Glassmorphism Header */}
      <header className="premium-header">
        <div className="premium-header-content">
          {/* Left side - Logo and Breadcrumb */}
          <div className="flex items-center">
            <div className="premium-logo">
              <div className="premium-logo-icon">
                HERA
              </div>
            </div>
            <div className="premium-breadcrumb">
              Manage Fixed Assets → Asset Details
            </div>
          </div>

          {/* Right side - Search and Actions */}
          <div className="premium-header-actions">
            <div className="relative hidden md:block mr-6">
              <input
                type="text"
                placeholder="Search assets..."
                className="premium-search-input"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs text-white/80">⌘K</span>
                </div>
              </div>
            </div>
            
            <button className="premium-header-btn" title="AI Assistant">
              <Sparkles className="w-4 h-4" />
            </button>
            
            <button className="premium-header-btn" title="Quick Actions">
              <Zap className="w-4 h-4" />
            </button>
            
            <button className="premium-header-btn" title="Notifications">
              <span className="relative">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"></div>
              </span>
            </button>
            
            <div className="premium-user-avatar">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>
      
      <main className="premium-main">
        {/* Enhanced Object Header */}
        <div className="premium-object-header">
          <div className="premium-object-header-content">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="premium-object-title">200026-0 {params.id?.toUpperCase() || 'PREMIUM'} ASSET</h1>
                <p className="premium-object-subtitle">
                  Main Office Building • Active • Last updated: 2 hours ago
                </p>
              </div>
              <div className="premium-status-badge">
                <span className="premium-status-dot bg-green-400"></span>
                Active
              </div>
            </div>

            {/* Enhanced Attributes Grid */}
            <div className="premium-object-attributes">
              {assetAttributes.map((attr, index) => (
                <div key={index} className="premium-object-attribute">
                  <span className="premium-object-attribute-label">{attr.label}</span>
                  <span className="premium-object-attribute-value">{attr.value}</span>
                </div>
              ))}
            </div>

            {/* Enhanced Key Figures */}
            <div className="premium-key-figures">
              {keyFigures.map((figure, index) => (
                <div key={index} className="premium-key-figure">
                  <div className="premium-key-figure-value">
                    {typeof figure.value === 'number' 
                      ? figure.value.toLocaleString('en-US', { minimumFractionDigits: 2 })
                      : figure.value
                    }
                  </div>
                  {figure.currency && (
                    <div className="premium-key-figure-currency">{figure.currency}</div>
                  )}
                  {figure.label && (
                    <div className="premium-key-figure-label">{figure.label}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Premium Tab Navigation */}
        <div className="premium-tab-container">
          <div className="premium-tab-strip">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`premium-tab ${activeTab === tab.key ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
                onClick={() => !tab.disabled && setActiveTab(tab.key)}
                disabled={tab.disabled}
              >
                {tab.label}
                {tab.badge && (
                  <span className="premium-tab-badge">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Premium Content */}
        <div className="premium-content">
          {renderTabContent()}
        </div>
      </main>

      <style jsx>{`
        .premium-app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .premium-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          height: 64px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          padding: 0 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .premium-header-content {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .premium-logo {
          display: flex;
          align-items: center;
          gap: 16px;
          color: white;
          text-decoration: none;
        }

        .premium-logo-icon {
          width: 40px;
          height: 28px;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          color: #4f46e5;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .premium-breadcrumb {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          font-weight: 500;
          margin-left: 32px;
        }

        .premium-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .premium-search-input {
          width: 320px;
          padding: 12px 20px;
          padding-right: 48px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          placeholder-color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .premium-search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }

        .premium-search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .premium-header-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .premium-header-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .premium-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .premium-user-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .premium-main {
          margin-top: 64px;
          min-height: calc(100vh - 64px);
        }

        .premium-object-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        }

        .premium-object-header-content {
          padding: 32px 24px;
          max-width: none;
        }

        .premium-object-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #1f2937 0%, #4f46e5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .premium-object-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
          font-weight: 500;
        }

        .premium-status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 20px;
          color: #059669;
          font-size: 14px;
          font-weight: 500;
        }

        .premium-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .premium-object-attributes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .premium-object-attribute {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .premium-object-attribute:hover {
          background: rgba(255, 255, 255, 0.7);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .premium-object-attribute-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .premium-object-attribute-value {
          font-size: 16px;
          color: #1f2937;
          font-weight: 600;
        }

        .premium-key-figures {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .premium-key-figure {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          min-width: 180px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .premium-key-figure:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .premium-key-figure-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .premium-key-figure-currency {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
          margin-top: 4px;
        }

        .premium-key-figure-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          text-align: center;
          font-weight: 600;
        }

        .premium-tab-container {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          overflow-x: auto;
        }

        .premium-tab-strip {
          display: flex;
          height: 56px;
          align-items: stretch;
          padding: 0 24px;
          min-width: max-content;
        }

        .premium-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 24px;
          font-size: 15px;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          white-space: nowrap;
          transition: all 0.3s ease;
          border-bottom: 3px solid transparent;
        }

        .premium-tab:hover {
          color: #4f46e5;
          background: rgba(79, 70, 229, 0.05);
        }

        .premium-tab.active {
          color: #4f46e5;
          font-weight: 600;
          border-bottom-color: #4f46e5;
          background: rgba(79, 70, 229, 0.05);
        }

        .premium-tab-badge {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          min-width: 18px;
          text-align: center;
        }

        .premium-content {
          background: transparent;
          padding: 24px;
        }

        .premium-content-section {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }

        .premium-content-section:hover {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
        }

        .premium-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.5);
        }

        .premium-section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .premium-section-actions {
          display: flex;
          gap: 8px;
        }

        .premium-icon-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(79, 70, 229, 0.1);
          color: #4f46e5;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .premium-icon-btn:hover {
          background: rgba(79, 70, 229, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(79, 70, 229, 0.2);
        }

        .premium-table-wrapper {
          overflow: hidden;
        }

        .premium-table {
          background: rgba(255, 255, 255, 0.9);
        }

        .premium-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .premium-form-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .premium-form-input {
          padding: 12px 16px;
          border: 1px solid rgba(209, 213, 219, 0.6);
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          background: rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
          color: #1f2937;
        }

        .premium-form-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          background: rgba(255, 255, 255, 0.95);
        }

        .premium-timeline-item {
          display: flex;
          gap: 20px;
          position: relative;
        }

        .premium-timeline-item:not(:last-child):after {
          content: '';
          position: absolute;
          left: 10px;
          top: 40px;
          bottom: -24px;
          width: 2px;
          background: linear-gradient(to bottom, #e5e7eb, transparent);
        }

        .premium-timeline-marker {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.8);
        }

        .premium-timeline-content {
          flex: 1;
          padding-bottom: 24px;
        }

        .premium-chart-container {
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          border: 1px solid rgba(79, 70, 229, 0.1);
        }

        .premium-chart-content {
          max-width: 480px;
          margin: 0 auto;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .premium-header {
            padding: 0 16px;
          }
          
          .premium-search-input {
            display: none;
          }
          
          .premium-object-header-content {
            padding: 24px 16px;
          }
          
          .premium-content {
            padding: 16px;
          }
          
          .premium-object-attributes {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .premium-key-figures {
            flex-direction: column;
            align-items: stretch;
          }
          
          .premium-key-figure {
            min-width: unset;
          }
        }
      `}</style>
    </div>
  )
}