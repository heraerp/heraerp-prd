'use client'

import React from 'react'
import { JewelryNavDropdown } from '@/components/jewelry/JewelryNavDropdown'
import { JewelryNotifications } from '@/components/jewelry/JewelryNotifications'
import { JewelryUserMenu } from '@/components/jewelry/JewelryUserMenu'
import { JewelryAppsSearch } from '@/components/jewelry/JewelryAppsSearch'
import { Crown, Search, Menu, X } from 'lucide-react'

// Navigation items organized by category
const coreOperations = [
  { label: 'Dashboard', href: '/jewelry/dashboard' },
  { label: 'Worklist', href: '/jewelry/worklist' },
  { label: 'POS System', href: '/jewelry/pos' },
  { label: 'Inventory', href: '/jewelry/inventory' },
  { label: 'Mobile App', href: '/jewelry/mobile' },
  { label: 'Search Items', href: '/jewelry/search' },
  { label: 'Smart AI', href: '/jewelry/ai' }
]

const qualityCertification = [
  { label: 'Appraisals', href: '/jewelry/appraisals' },
  { label: 'Certificates', href: '/jewelry/certificates' },
  { label: 'Quality Control', href: '/jewelry/quality' },
  { label: 'Authentication', href: '/jewelry/auth' },
  { label: 'Grading', href: '/jewelry/grading' }
]

const customerManagement = [
  { label: 'Customers', href: '/jewelry/customers' },
  { label: 'VIP Services', href: '/jewelry/vip' },
  { label: 'Wishlist', href: '/jewelry/wishlist' },
  { label: 'Loyalty Program', href: '/jewelry/loyalty' }
]

const businessIntelligence = [
  { label: 'Analytics', href: '/jewelry/analytics' },
  { label: 'Intelligence', href: '/jewelry/intelligence' },
  { label: 'Reports', href: '/jewelry/reports' },
  { label: 'Financial', href: '/jewelry/financial' },
  { label: 'Profit Analysis', href: '/jewelry/profit' },
  { label: 'Market Trends', href: '/jewelry/trends' }
]

const operations = [
  { label: 'Workshop', href: '/jewelry/workshop' },
  { label: 'Repairs', href: '/jewelry/repairs' },
  { label: 'E-commerce', href: '/jewelry/ecommerce' },
  { label: 'Custom Orders', href: '/jewelry/custom' },
  { label: 'Appointments', href: '/jewelry/appointments' },
  { label: 'Scheduling', href: '/jewelry/schedule' }
]

const administration = [
  { label: 'Settings', href: '/jewelry/settings' },
  { label: 'Apps Manager', href: '/jewelry/apps' },
  { label: 'Integrations', href: '/jewelry/integrations' },
  { label: 'Configuration', href: '/jewelry/config' },
  { label: 'Owner Portal', href: '/jewelry/owner' },
  { label: 'Security', href: '/jewelry/security' },
  { label: 'Branch Management', href: '/jewelry/branches' },
  { label: 'Staff Portal', href: '/jewelry/staff' }
]

const documentation = [
  { label: 'Documentation Hub', href: '/docs/jewelry' },
  { label: 'Getting Started', href: '/docs/jewelry/getting-started' },
  { label: 'Inventory Guide', href: '/docs/jewelry/inventory' },
  { label: 'POS Guide', href: '/docs/jewelry/pos' },
  { label: 'Customer Guide', href: '/docs/jewelry/customers' },
  { label: 'Repair Services', href: '/docs/jewelry/repairs' },
  { label: 'Analytics Guide', href: '/docs/jewelry/analytics' }
]

export function JewelryNavbar() {
  const [showAppsSearch, setShowAppsSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="jewelry-glass-navbar backdrop-blur-xl border-b border-white/10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-8">
              <a
                href="/jewelry/dashboard"
                className="flex items-center gap-2 jewelry-text-luxury hover:jewelry-text-gold transition-colors"
              >
                <div className="jewelry-crown-glow p-2 rounded-xl">
                  <Crown className="h-6 w-6 jewelry-text-gold" />
                </div>
                <span className="text-xl font-bold">HERA Jewelry</span>
              </a>

              {/* Navigation Dropdowns - Horizontal Scrollable */}
              <div className="hidden lg:block flex-1 max-w-4xl overflow-hidden">
                <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide jewelry-navbar-scroll pb-1">
                  <JewelryNavDropdown label="Core Operations" items={coreOperations} />
                  <JewelryNavDropdown
                    label="Quality & Certification"
                    items={qualityCertification}
                  />
                  <JewelryNavDropdown label="Customer Management" items={customerManagement} />
                  <JewelryNavDropdown label="Business Intelligence" items={businessIntelligence} />
                  <JewelryNavDropdown label="Operations" items={operations} />
                  <JewelryNavDropdown label="Administration" items={administration} />
                  <JewelryNavDropdown label="Documentation" items={documentation} />
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
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
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

            {/* Quality & Certification */}
            <div>
              <h3 className="text-sm font-semibold jewelry-text-gold mb-2">
                Quality & Certification
              </h3>
              <div className="space-y-1">
                {qualityCertification.map(item => (
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
      <JewelryAppsSearch isOpen={showAppsSearch} onClose={() => setShowAppsSearch(false)} />
    </header>
  )
}
