'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Menu,
  X,
  Home,
  Settings,
  TrendingUp,
  DollarSign,
  Award,
  CheckCircle,
  HelpCircle,
  FileText,
  Rocket
} from 'lucide-react'

interface FranchiseLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Home', href: '/franchise', icon: Home },
  { name: 'How It Works', href: '/franchise/how-it-works', icon: Settings },
  { name: 'Opportunity', href: '/franchise/opportunity', icon: TrendingUp },
  { name: 'Income Potential', href: '/franchise/income', icon: DollarSign },
  { name: 'Why HERA Wins', href: '/franchise/advantage', icon: Award },
  { name: 'Proof', href: '/franchise/proof', icon: CheckCircle },
  { name: 'FAQ', href: '/franchise/faq', icon: HelpCircle },
  { name: 'Apply', href: '/franchise/apply', icon: FileText },
  { name: 'Start Today', href: '/franchise/start', icon: Rocket }
]

export function FranchiseLayout({ children }: FranchiseLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl dark:bg-background/80 dark:border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/franchise" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <span className="text-sm font-bold text-foreground">H</span>
            </div>
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HERA
              </span>
              <span className="text-muted-foreground dark:text-slate-300 ml-1">Franchise</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-slate-200'
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground font-semibold px-6"
            >
              <Link href="/franchise/apply">Apply Now</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background dark:bg-background border-b border-border dark:border-border shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="space-y-2">
              {navigation.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 w-full',
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-slate-200'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-6 pt-4 border-t border-border dark:border-border">
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground font-semibold px-6 w-full"
              >
                <Link href="/franchise/apply">Apply Now</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-background dark:bg-background border-t border-border dark:border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/franchise" className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                  <span className="text-sm font-bold text-foreground">H</span>
                </div>
                <span className="text-xl font-bold">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    HERA
                  </span>
                  <span className="text-muted-foreground dark:text-slate-300 ml-1">Franchise</span>
                </span>
              </Link>
              <p className="text-muted-foreground dark:text-muted-foreground max-w-md">
                Join the ERP revolution. Work from home, disrupt a $50B industry, and earn
                $25K–$500K+ annually.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground dark:text-foreground mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/franchise/opportunity"
                    className="text-muted-foreground dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    Opportunity
                  </Link>
                </li>
                <li>
                  <Link
                    href="/franchise/income"
                    className="text-muted-foreground dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    Income Potential
                  </Link>
                </li>
                <li>
                  <Link
                    href="/franchise/proof"
                    className="text-muted-foreground dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link
                    href="/franchise/apply"
                    className="text-muted-foreground dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    Apply Now
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground dark:text-foreground mb-3">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/franchise/faq"
                    className="text-muted-foreground dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/franchise/how-it-works"
                    className="text-muted-foreground dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:franchise@hera.com"
                    className="text-muted-foreground dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border dark:border-border text-center text-muted-foreground dark:text-muted-foreground">
            <p>&copy; 2024 HERA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
