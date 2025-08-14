'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { HeraThemeToggle } from './HeraThemeProvider';
import { 
  Home, 
  DollarSign, 
  Palette, 
  Settings, 
  User,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    description: 'Main dashboard'
  },
  {
    name: 'PWM System',
    href: '/pwm',
    icon: DollarSign,
    description: 'Private Wealth Management'
  },
  {
    name: 'Design System',
    href: '/design-system',
    icon: Palette,
    description: 'HERA Universal Components'
  },
  {
    name: 'Auth',
    href: '/auth',
    icon: User,
    description: 'Authentication System'
  },
  {
    name: 'Restaurant',
    href: '/restaurant',
    icon: Settings,
    description: 'Restaurant Management'
  }
];

export function HeraNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-hera-500 to-hera-cyan-500 bg-clip-text text-transparent"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-hera-500 to-hera-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                H
              </div>
              <span>HERA</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-hera-500/10 text-hera-600 dark:text-hera-400 border border-hera-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  title={item.description}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle and Mobile Menu */}
          <div className="flex items-center space-x-2">
            <HeraThemeToggle className="hidden sm:inline-flex" />
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-hera-500/10 text-hera-600 dark:text-hera-400 border border-hera-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <div>
                    <div>{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
            
            <div className="pt-2 border-t border-border mt-4">
              <HeraThemeToggle className="w-full justify-start" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Breadcrumb component for page navigation
export function HeraBreadcrumb({ 
  items 
}: { 
  items: Array<{ name: string; href?: string }> 
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {items.map((item, index) => (
        <React.Fragment key={item.name}>
          {index > 0 && <span>/</span>}
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.name}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}