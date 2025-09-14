'use client'

import UniversalSidebar from '@/components/universal/UniversalSidebar'
import { 
  Calendar, 
  Users, 
  ShoppingCart, 
  Package, 
  Settings,
  BarChart3,
  Scissors,
  Home,
  CreditCard,
  UserCircle,
  Sparkles,
  Heart,
  Gift,
  Star,
  TrendingUp,
  Palette,
  Shield,
  UserPlus,
  Clock,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Zap,
  Award,
  Briefcase,
  Target,
  Database,
  Brain,
  Calculator,
  Truck
} from 'lucide-react'

// Main sidebar items (compact view)
const sidebarItems = [
  { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
  { title: 'Appointments', href: '/salon/appointments', icon: Calendar, badge: '12', badgeColor: 'bg-purple-500' },
  { title: 'POS', href: '/salon/pos', icon: CreditCard, badge: '3', badgeColor: 'bg-green-500' },
  { title: 'Customers', href: '/salon/customers', icon: Users },
  { title: 'Staff', href: '/salon/staff', icon: UserCircle },
  { title: 'Services', href: '/salon/services', icon: Scissors },
  { title: 'Inventory', href: '/salon/inventory', icon: Package, badge: '2', badgeColor: 'bg-red-500' },
  { title: 'Finance', href: '/salon/finance', icon: DollarSign },
]

// All apps for the modal
const allApps = [
  // Core Operations
  { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
  { title: 'Appointments', href: '/salon/appointments', icon: Calendar },
  { title: 'Calendar View', href: '/salon/appointments/calendar', icon: Calendar },
  { title: 'Book Appointment', href: '/salon/appointments/book', icon: UserPlus },
  { title: 'Today\'s Schedule', href: '/salon/appointments/today', icon: Clock },
  
  // Point of Sale
  { title: 'POS Checkout', href: '/salon/pos', icon: CreditCard },
  { title: 'Sales History', href: '/salon/pos/history', icon: FileText },
  { title: 'Receipts', href: '/salon/pos/receipts', icon: FileText },
  { title: 'Payment Methods', href: '/salon/pos/payments', icon: DollarSign },
  
  // Customer Management
  { title: 'Customers', href: '/salon/customers', icon: Users },
  { title: 'New Customer', href: '/salon/customers/new', icon: UserPlus },
  { title: 'Loyalty Program', href: '/salon/customers/loyalty', icon: Award },
  { title: 'Customer Groups', href: '/salon/customers/groups', icon: Users },
  { title: 'Birthday Club', href: '/salon/customers/birthdays', icon: Gift },
  
  // Staff Management
  { title: 'Staff', href: '/salon/staff', icon: UserCircle },
  { title: 'Staff Schedule', href: '/salon/staff/schedule', icon: Calendar },
  { title: 'Commissions', href: '/salon/staff/commissions', icon: DollarSign },
  { title: 'Performance', href: '/salon/staff/performance', icon: TrendingUp },
  { title: 'Training', href: '/salon/staff/training', icon: Award },
  
  // Services
  { title: 'Services', href: '/salon/services', icon: Scissors },
  { title: 'Service Menu', href: '/salon/services/menu', icon: FileText },
  { title: 'Packages', href: '/salon/services/packages', icon: Gift },
  { title: 'Pricing', href: '/salon/services/pricing', icon: DollarSign },
  { title: 'Service Categories', href: '/salon/services/categories', icon: Database },
  
  // Products & Inventory
  { title: 'Inventory', href: '/salon/inventory', icon: Package },
  { title: 'Products', href: '/salon/inventory/products', icon: Package },
  { title: 'Stock Levels', href: '/salon/inventory/stock', icon: BarChart3 },
  { title: 'Suppliers', href: '/salon/inventory/suppliers', icon: Truck },
  { title: 'Purchase Orders', href: '/salon/inventory/orders', icon: FileText },
  
  // Marketing
  { title: 'Marketing', href: '/salon/marketing', icon: Target },
  { title: 'Campaigns', href: '/salon/marketing/campaigns', icon: Zap },
  { title: 'SMS Marketing', href: '/salon/marketing/sms', icon: Heart },
  { title: 'Email Marketing', href: '/salon/marketing/email', icon: Heart },
  { title: 'Reviews', href: '/salon/marketing/reviews', icon: Star },
  
  // Finance
  { title: 'Finance', href: '/salon/finance', icon: DollarSign },
  { title: 'Reports', href: '/salon/finance/reports', icon: BarChart3 },
  { title: 'Expenses', href: '/salon/finance/expenses', icon: FileText },
  { title: 'Payroll', href: '/salon/finance/payroll', icon: DollarSign },
  { title: 'Tax Reports', href: '/salon/finance/tax', icon: Shield },
  
  // Analytics
  { title: 'Analytics', href: '/salon/analytics', icon: BarChart3 },
  { title: 'Business Insights', href: '/salon/analytics/insights', icon: TrendingUp },
  { title: 'Customer Analytics', href: '/salon/analytics/customers', icon: Users },
  { title: 'Service Analytics', href: '/salon/analytics/services', icon: Scissors },
  
  // Settings
  { title: 'Settings', href: '/salon/settings', icon: Settings },
  { title: 'Business Info', href: '/salon/settings/business', icon: Briefcase },
  { title: 'Working Hours', href: '/salon/settings/hours', icon: Clock },
  { title: 'Tax Settings', href: '/salon/settings/tax', icon: Shield },
  { title: 'Notifications', href: '/salon/settings/notifications', icon: AlertCircle },
]

// Bottom items
const bottomItems = [
  { title: 'AI Assistant', href: '/salon/ai-assistant', icon: Brain },
  { title: 'Digital Beauty', href: '/salon/digital-beauty', icon: Palette },
  { title: 'Settings', href: '/salon/settings', icon: Settings },
]

// Status indicators
const statusIndicators = [
  { icon: Clock, label: 'Today\'s Appointments', value: '12', color: 'text-purple-400' },
  { icon: AlertCircle, label: 'Walk-ins Waiting', value: '3', color: 'text-yellow-400' },
  { icon: CheckCircle, label: 'Completed Today', value: '8', color: 'text-green-400' },
]

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 relative">
      {/* Enhanced Gradient Background with Mesh */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-200/50 via-purple-100/30 to-pink-200/50" />
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/2 -right-4 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-violet-400/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
        
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.015]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(147, 51, 234, 0.1) 40px, rgba(147, 51, 234, 0.1) 41px),
                             repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(147, 51, 234, 0.1) 40px, rgba(147, 51, 234, 0.1) 41px)`
          }} />
        </div>
      </div>

      <UniversalSidebar
        organizationName="Premium Hair & Beauty Salon"
        organizationId="84a3654b-907b-472a-ac8f-a1ffb6fb711b"
        moduleColor={{ from: 'from-violet-600', to: 'to-purple-600' }}
        moduleIcon={Sparkles}
        moduleName="Salon"
        sidebarItems={sidebarItems}
        allApps={allApps}
        bottomItems={bottomItems}
        statusIndicators={statusIndicators}
      />

      {/* Main Content - Adjusted for sidebar */}
      <main className="lg:ml-20 min-h-screen">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8 pb-20 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Add custom styles for blob animation */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}