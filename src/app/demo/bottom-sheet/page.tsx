'use client'

import React, { useState, useRef } from 'react'
import {
  BottomSheet,
  useBottomSheet,
  BottomSheetRef,
  BottomSheetPresets
} from '@/lib/dna/components/mobile/BottomSheet'
import { HeraButtonDNA } from '@/lib/dna/components/ui/hera-button-dna'
import {
  Smartphone,
  Settings,
  Share2,
  Filter,
  Calendar,
  MapPin,
  Image as ImageIcon,
  CreditCard,
  User,
  ChevronRight,
  Check
} from 'lucide-react'

// Demo data
const shareOptions = [
  { id: 'copy', label: 'Copy Link', icon: '🔗' },
  { id: 'twitter', label: 'Share on Twitter', icon: '🐦' },
  { id: 'facebook', label: 'Share on Facebook', icon: '📘' },
  { id: 'email', label: 'Send via Email', icon: '📧' }
]

const filterOptions = [
  { id: 'status', label: 'Status', value: 'All' },
  { id: 'date', label: 'Date Range', value: 'Last 30 days' },
  { id: 'category', label: 'Category', value: 'All Categories' },
  { id: 'priority', label: 'Priority', value: 'Any' }
]

const paymentMethods = [
  { id: 'card', label: 'Credit Card', sublabel: '**** 4242', icon: '💳' },
  { id: 'paypal', label: 'PayPal', sublabel: 'john@example.com', icon: '🅿️' },
  { id: 'apple', label: 'Apple Pay', sublabel: 'Default', icon: '🍎' }
]

export default function BottomSheetDemo() {
  // Multiple sheet states
  const basicSheet = useBottomSheet()
  const shareSheet = useBottomSheet()
  const formSheet = useBottomSheet()
  const filterSheet = useBottomSheet()
  const fullscreenSheet = useBottomSheet()
  const customSnapSheet = useBottomSheet()

  // Demo states
  const [selectedPayment, setSelectedPayment] = useState('card')
  const [filters, setFilters] = useState(filterOptions)
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567'
  })

  // Ref for imperative control demo
  const imperativeSheetRef = useRef<BottomSheetRef>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Smartphone className="h-8 w-8 text-blue-600" />
          HERA Bottom Sheet Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Production-ready mobile UI component with gesture support
        </p>
      </div>

      {/* Demo Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Example */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Basic Example</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Simple bottom sheet with title and content
          </p>
          <HeraButtonDNA onClick={basicSheet.open} fullWidth>
            Open Basic Sheet
          </HeraButtonDNA>
        </div>

        {/* Share Sheet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Sheet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            iOS-style share action sheet
          </p>
          <HeraButtonDNA onClick={shareSheet.open} fullWidth variant="secondary">
            Share Content
          </HeraButtonDNA>
        </div>

        {/* Form Sheet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <User className="h-5 w-5" />
            Form Input
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Bottom sheet with form inputs
          </p>
          <HeraButtonDNA onClick={formSheet.open} fullWidth variant="outline">
            Edit Profile
          </HeraButtonDNA>
        </div>

        {/* Filter Sheet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Advanced filtering options
          </p>
          <HeraButtonDNA onClick={filterSheet.open} fullWidth>
            <Filter className="h-4 w-4" />
            Apply Filters
          </HeraButtonDNA>
        </div>

        {/* Fullscreen Sheet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Fullscreen Mode</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Takes up entire viewport</p>
          <HeraButtonDNA onClick={fullscreenSheet.open} fullWidth variant="secondary">
            Open Fullscreen
          </HeraButtonDNA>
        </div>

        {/* Custom Snaps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custom Snaps
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Multiple height snap points
          </p>
          <HeraButtonDNA onClick={customSnapSheet.open} fullWidth variant="outline">
            Multi-Height Sheet
          </HeraButtonDNA>
        </div>
      </div>

      {/* Imperative Control Demo */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Imperative Control Demo</h3>
          <p className="text-blue-100 mb-4">
            Control bottom sheet programmatically with ref methods
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => imperativeSheetRef.current?.expand()}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Expand
            </button>
            <button
              onClick={() => imperativeSheetRef.current?.collapse()}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Collapse
            </button>
            <button
              onClick={() => imperativeSheetRef.current?.snapTo(1)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Snap to Middle
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheets */}

      {/* Basic Sheet */}
      <BottomSheet
        {...basicSheet.sheetProps}
        title="Welcome to HERA"
        description="This is a basic bottom sheet example"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            This is a simple bottom sheet with default settings. You can drag it up and down to see
            different snap points, or swipe down to dismiss.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 Tip: Try dragging the handle at the top or clicking the backdrop to close
            </p>
          </div>
          <HeraButtonDNA fullWidth onClick={basicSheet.close}>
            Got it!
          </HeraButtonDNA>
        </div>
      </BottomSheet>

      {/* Share Sheet */}
      <BottomSheet
        {...shareSheet.sheetProps}
        title="Share"
        snapPoints={['auto']}
        defaultSnapPoint={0}
      >
        <div className="space-y-2">
          {shareOptions.map(option => (
            <button
              key={option.id}
              onClick={() => {
                console.log('Sharing via:', option.label)
                shareSheet.close()
              }}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="flex-1 font-medium">{option.label}</span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Form Sheet */}
      <BottomSheet
        {...formSheet.sheetProps}
        title="Edit Profile"
        footer={
          <div className="flex gap-3">
            <HeraButtonDNA variant="outline" fullWidth onClick={formSheet.close}>
              Cancel
            </HeraButtonDNA>
            <HeraButtonDNA
              fullWidth
              onClick={() => {
                console.log('Saving profile:', profileData)
                formSheet.close()
              }}
            >
              Save Changes
            </HeraButtonDNA>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={e => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={e => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </BottomSheet>

      {/* Filter Sheet */}
      <BottomSheet
        {...filterSheet.sheetProps}
        title="Filters"
        description="Refine your search results"
        snapPoints={['50%', '85%']}
        header={
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Filters</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Refine your search</p>
            </div>
            <button
              onClick={() => setFilters(filterOptions)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset
            </button>
          </div>
        }
        footer={
          <div className="flex gap-3">
            <HeraButtonDNA variant="outline" fullWidth onClick={filterSheet.close}>
              Cancel
            </HeraButtonDNA>
            <HeraButtonDNA
              fullWidth
              onClick={() => {
                console.log('Applying filters:', filters)
                filterSheet.close()
              }}
            >
              Apply Filters
            </HeraButtonDNA>
          </div>
        }
      >
        <div className="space-y-6">
          {filters.map(filter => (
            <div key={filter.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {filter.label}
              </label>
              <select
                value={filter.value}
                onChange={e => {
                  setFilters(
                    filters.map(f => (f.id === filter.id ? { ...f, value: e.target.value } : f))
                  )
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>{filter.value}</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Fullscreen Sheet */}
      <BottomSheet
        {...BottomSheetPresets.fullScreen}
        {...fullscreenSheet.sheetProps}
        closeButton="text"
        header={
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 -mx-6 px-6">
            <h2 className="text-2xl font-bold">Payment Method</h2>
            <button
              onClick={fullscreenSheet.close}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Done
            </button>
          </div>
        }
      >
        <div className="space-y-4 py-4">
          <p className="text-gray-600 dark:text-gray-400">
            Select your preferred payment method for this purchase
          </p>

          {paymentMethods.map(method => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selectedPayment === method.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="text-2xl">{method.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-medium">{method.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{method.sublabel}</p>
              </div>
              {selectedPayment === method.id && <Check className="h-5 w-5 text-blue-600" />}
            </button>
          ))}

          <button className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
            + Add New Payment Method
          </button>
        </div>
      </BottomSheet>

      {/* Custom Snap Points Sheet */}
      <BottomSheet
        {...customSnapSheet.sheetProps}
        ref={imperativeSheetRef}
        title="Multi-Height Sheet"
        snapPoints={[200, '50%', '90%']}
        defaultSnapPoint={1}
        onSnapChange={index => console.log('Snapped to index:', index)}
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl">
            <h4 className="font-semibold mb-2">Snap Points Demo</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This sheet has 3 snap points: 200px, 50%, and 90% of screen height. Try dragging to
              different heights!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
              <p className="font-medium">Schedule</p>
              <p className="text-sm text-gray-500">View calendar</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <MapPin className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
              <p className="font-medium">Location</p>
              <p className="text-sm text-gray-500">Set location</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <ImageIcon className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
              <p className="font-medium">Media</p>
              <p className="text-sm text-gray-500">Add photos</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <CreditCard className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
              <p className="font-medium">Payment</p>
              <p className="text-sm text-gray-500">Add card</p>
            </div>
          </div>

          {/* Add more content to demonstrate scrolling */}
          <div className="space-y-4">
            <h4 className="font-semibold">Additional Content</h4>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="font-medium">Section {i}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is scrollable content within the bottom sheet. The sheet maintains its snap
                  points while allowing internal scrolling.
                </p>
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
