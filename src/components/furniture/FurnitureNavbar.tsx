'use client'

import { useState } from 'react'
import { FurnitureNavDropdown } from '@/components/furniture/FurnitureNavDropdown'
import { JewelryNotifications } from '@/components/jewelry/JewelryNotifications'
import { JewelryUserMenu } from '@/components/jewelry/JewelryUserMenu'
import { FurnitureAppsSearch } from '@/components/furniture/FurnitureAppsSearch'
import { Armchair, Search, Menu, X } from 'lucide-react'

// Navigation items organized by category for furniture business
const coreOperations = [
  { label: 'Dashboard', href: '/furniture' },
  { label: 'Design Studio', href: '/furniture/design-studio' },
  { label: 'AI Business Manager', href: '/furniture/ai-manager' },
  { label: 'Digital Accountant', href: '/furniture/digital-accountant' },
  { label: 'Lead Management', href: '/furniture/leads' },
  { label: 'Inventory Management', href: '/furniture/inventory' },
  { label: 'Mobile App', href: '/furniture/mobile' },
  { label: 'Search Items', href: '/furniture/search' }
]

const productionManufacturing = [
  { label: 'Production Planning', href: '/furniture/production' },
  { label: 'Work Orders', href: '/furniture/work-orders' },
  { label: 'Quality Control', href: '/furniture/quality' },
  { label: 'BOM Management', href: '/furniture/bom' },
  { label: 'Manufacturing', href: '/furniture/manufacturing' },
  { label: 'Craftsman Management', href: '/furniture/craftsmen' }
]

const customerManagement = [
  { label: 'Customer Management', href: '/furniture/customers' },
  { label: 'Sales Dashboard', href: '/furniture/sales' },
  { label: 'Quotations', href: '/furniture/quotes' },
  { label: 'Customer Service', href: '/furniture/service' },
  { label: 'Hotel Relations', href: '/furniture/hotels' },
  { label: 'Export Clients', href: '/furniture/export-clients' }
]

const businessIntelligence = [
  { label: 'Analytics Dashboard', href: '/furniture/analytics' },
  { label: 'Business Intelligence', href: '/furniture/intelligence' },
  { label: 'Financial Reports', href: '/furniture/financial' },
  { label: 'Profit Analysis', href: '/furniture/profit' },
  { label: 'Market Trends', href: '/furniture/trends' },
  { label: 'Kerala Market Insights', href: '/furniture/kerala-insights' }
]

const operations = [
  { label: 'Workshop Management', href: '/furniture/workshop' },
  { label: 'Supplier Management', href: '/furniture/suppliers' },
  { label: 'Procurement', href: '/furniture/procurement' },
  { label: 'Logistics', href: '/furniture/logistics' },
  { label: 'Delivery Tracking', href: '/furniture/delivery' },
  { label: 'Maintenance', href: '/furniture/maintenance' }
]

const administration = [
  { label: 'Settings', href: '/furniture/settings' },
  { label: 'User Management', href: '/furniture/users' },
  { label: 'Security', href: '/furniture/security' },
  { label: 'Branch Management', href: '/furniture/branches' },
  { label: 'Staff Portal', href: '/furniture/staff' },
  { label: 'Integrations', href: '/furniture/integrations' },
  { label: 'Configuration', href: '/furniture/config' },
  { label: 'Owner Portal', href: '/furniture/owner' }
]

const documentation = [
  { label: 'Documentation Hub', href: '/docs/furniture' },
  { label: 'Getting Started', href: '/docs/furniture/getting-started' },
  { label: 'Production Guide', href: '/docs/furniture/production' },
  { label: 'Inventory Guide', href: '/docs/furniture/inventory' },
  { label: 'Customer Guide', href: '/docs/furniture/customers' },
  { label: 'Manufacturing Guide', href: '/docs/furniture/manufacturing' },
  { label: 'Analytics Guide', href: '/docs/furniture/analytics' }
]

export function FurnitureNavbar() {
  const [showAppsSearch, setShowAppsSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="jewelry-glass-navbar backdrop-blur-xl border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-8">
              <a
                href="/furniture"
                className="flex items-center gap-2 jewelry-text-luxury hover:jewelry-text-gold transition-colors"
              >
                <div className="jewelry-crown-glow p-2 rounded-xl">
                  <Armchair className="h-6 w-6 jewelry-text-gold" />
                </div>
                <span className="text-xl font-bold">HERA Furniture</span>
              </a>

              {/* Navigation Dropdowns - Horizontal Scrollable */}
              <div className="hidden lg:block flex-1 max-w-5xl">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide jewelry-navbar-scroll pb-1">
                  <FurnitureNavDropdown label="Core Operations" items={coreOperations} />
                  <FurnitureNavDropdown
                    label="Production & Manufacturing"
                    items={productionManufacturing}
                  />
                  <FurnitureNavDropdown label="Customer Management" items={customerManagement} />
                  <FurnitureNavDropdown label="Business Intelligence" items={businessIntelligence} />
                  <FurnitureNavDropdown label="Operations" items={operations} />
                  <FurnitureNavDropdown label="Administration" items={administration} />
                  <FurnitureNavDropdown label="Documentation" items={documentation} />
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button - Only on smaller screens */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden jewelry-glass-btn p-2 rounded-lg jewelry-text-luxury hover:jewelry-text-gold transition-colors"
                title="Toggle Menu"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle Menu</span>
              </button>

              {/* Search Apps Button */}
              <button
                onClick={() => setShowAppsSearch(true)}
                className="jewelry-glass-btn p-2 rounded-lg jewelry-text-luxury hover:jewelry-text-gold transition-colors group"
                title="Search All Apps"
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Search Apps</span>
              </button>

              <JewelryNotifications />
              <JewelryUserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden jewelry-glass-panel border-t border-white/10">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4">
            {/* Core Operations */}
            <div>
              <h3 className="text-sm font-semibold jewelry-text-gold mb-2">Core Operations</h3>
              <div className="space-y-1">
                {coreOperations.map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm jewelry-text-luxury hover:jewelry-text-gold hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Production & Manufacturing */}
            <div>
              <h3 className="text-sm font-semibold jewelry-text-gold mb-2">
                Production & Manufacturing
              </h3>
              <div className="space-y-1">
                {productionManufacturing.map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm jewelry-text-luxury hover:jewelry-text-gold hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Customer Management */}
            <div>
              <h3 className="text-sm font-semibold jewelry-text-gold mb-2">Customer Management</h3>
              <div className="space-y-1">
                {customerManagement.map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm jewelry-text-luxury hover:jewelry-text-gold hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Business Intelligence */}
            <div>
              <h3 className="text-sm font-semibold jewelry-text-gold mb-2">
                Business Intelligence
              </h3>
              <div className="space-y-1">
                {businessIntelligence.map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm jewelry-text-luxury hover:jewelry-text-gold hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Operations */}
            <div>
              <h3 className="text-sm font-semibold jewelry-text-gold mb-2">Operations</h3>
              <div className="space-y-1">
                {operations.map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm jewelry-text-luxury hover:jewelry-text-gold hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Administration */}
            <div>
              <h3 className="text-sm font-semibold jewelry-text-gold mb-2">Administration</h3>
              <div className="space-y-1">
                {administration.map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm jewelry-text-luxury hover:jewelry-text-gold hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Documentation */}
            <div>
              <h3 className="text-sm font-semibold jewelry-text-gold mb-2">Documentation</h3>
              <div className="space-y-1">
                {documentation.map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm jewelry-text-luxury hover:jewelry-text-gold hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apps Search Modal */}
      <FurnitureAppsSearch isOpen={showAppsSearch} onClose={() => setShowAppsSearch(false)} />
    </header>
  )
}