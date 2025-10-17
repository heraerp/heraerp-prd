'use client'

import React from 'react'
import { SapHeader } from '@/components/sap/SapHeader'
import { SapObjectHeader, type ObjectAttribute, type KeyFigure } from '@/components/sap/SapObjectHeader'
import { SapTabStrip, type SapTab } from '@/components/sap/SapTabStrip'
import { SapTable, type SapTableColumn, type SapTableRecord } from '@/components/sap/SapTable'
import { BarChart3, TrendingUp, Calendar, MapPin, Users, Building } from 'lucide-react'

export default function AssetDetailsPage({ params }: { params: { id: string } }) {
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
            {/* Depreciation Areas Table */}
            <SapTable
              title="Depreciation Areas"
              columns={depreciationColumns}
              data={depreciationData}
              expandable={true}
              showToolbar={true}
              onSettings={() => console.log('Settings clicked')}
              onFullscreen={() => console.log('Fullscreen clicked')}
            />
            
            {/* Life Cycle Chart Placeholder */}
            <div className="sap-content-section">
              <div className="sap-section-header">
                <h3 className="sap-section-title">
                  <BarChart3 className="w-4 h-4" />
                  Asset Value Life Cycle
                </h3>
                <div className="sap-section-actions">
                  <button className="sap-icon-btn" title="Export Chart">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 text-center">
                  <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Asset Depreciation Chart</h4>
                  <p className="text-gray-600">Interactive chart showing asset value over time with depreciation curves</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'general':
        return (
          <div className="sap-content-section">
            <div className="sap-section-header">
              <h3 className="sap-section-title">
                <Building className="w-4 h-4" />
                General Information
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="sap-form-group">
                  <label className="sap-form-label">Asset Description</label>
                  <input type="text" value="Main Office Building" className="sap-form-input" readOnly />
                </div>
                <div className="sap-form-group">
                  <label className="sap-form-label">Inventory Number</label>
                  <input type="text" value="INV-2020-001" className="sap-form-input" readOnly />
                </div>
                <div className="sap-form-group">
                  <label className="sap-form-label">Serial Number</label>
                  <input type="text" value="BLDG-HQ-001" className="sap-form-input" readOnly />
                </div>
                <div className="sap-form-group">
                  <label className="sap-form-label">Manufacturer</label>
                  <input type="text" value="Construction Corp" className="sap-form-input" readOnly />
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'origin':
        return (
          <div className="sap-content-section">
            <div className="sap-section-header">
              <h3 className="sap-section-title">
                <MapPin className="w-4 h-4" />
                Asset Origin & History
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">January 1, 2020</span>
                  </div>
                  <p className="text-gray-600">Asset acquired and capitalized</p>
                  <p className="text-sm text-gray-500 mt-1">Initial value: 500,000.00 EUR</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">March 15, 2021</span>
                  </div>
                  <p className="text-gray-600">Major renovation completed</p>
                  <p className="text-sm text-gray-500 mt-1">Additional investment: 50,000.00 EUR</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="sap-content-section">
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tab Content</h3>
              <p className="text-gray-600">Content for {activeTab} tab will be displayed here.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="sap-font">
      {/* SAP Header */}
      <SapHeader 
        title="HERA" 
        breadcrumb="Manage Fixed Assets > Asset Details"
        showSearch={true}
      />
      
      <main className="sap-main">
        {/* Object Header - Asset Information */}
        <SapObjectHeader
          title={`200026-0 ${params.id?.toUpperCase() || 'TEST'} ASSET`}
          subtitle="Main Office Building • Active • Last updated: 2 hours ago"
          attributes={assetAttributes}
          keyFigures={keyFigures}
        />
        
        {/* Tab Navigation */}
        <SapTabStrip
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Tab Content */}
        <div className="sap-content sap-fade-in">
          {renderTabContent()}
        </div>
      </main>
    </div>
  )
}