// app/components/Navbar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type NavItem = { href: string; label: string }

const NAV_ITEMS: NavItem[] = [
  { href: '/solutions', label: 'Solutions' },
  { href: '/partners', label: 'Partners' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' }
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return
      const target = e.target as Node | null
      if (panelRef.current?.contains(target as Node)) return
      if (buttonRef.current?.contains(target as Node)) return
      setOpen(false)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : (pathname?.startsWith(href) ?? false)

  return (
    <header className="sticky top-0 z-50">
      {/* optional gradient wash under the glass bar */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="mx-auto h-20 w-[92%] max-w-7xl bg-gradient-to-r from-indigo-500/20 via-fuchsia-400/15 to-cyan-400/20 blur-2xl rounded-3xl" />
      </div>

      <div className="mx-auto mt-3 w-[92%] max-w-7xl">
        <div
          className="
            relative flex items-center justify-between rounded-3xl
            border border-white/15 bg-white/10 dark:border-white/10 dark:bg-white/5
            backdrop-blur-xl
            shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)]
            px-4 py-2 md:px-6
          "
          role="navigation"
          aria-label="Primary"
        >
          {/* Brand */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 rounded-xl"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 text-white font-bold">
              H
            </span>
            <span className="text-base md:text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              HERA ERP
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'px-3 py-2 rounded-xl text-sm transition',
                  'text-gray-800/80 hover:text-gray-900 dark:text-gray-100/80 dark:hover:text-white',
                  isActive(item.href)
                    ? 'bg-white/30 dark:bg-white/10 border border-white/30'
                    : 'hover:bg-white/20 dark:hover:bg-white/5 border border-transparent'
                ].join(' ')}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/auth/login"
              className="
                inline-flex items-center justify-center rounded-xl
                px-3.5 py-2 text-sm
                text-gray-900 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10
                transition
              "
            >
              Sign In
            </Link>
            <Link
              href="/pricing-request"
              className="
                inline-flex items-center justify-center rounded-xl border border-white/30
                bg-white/10 dark:bg-white/5 px-3.5 py-2 text-sm
                text-gray-900 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10
                transition
              "
            >
              Request Pricing
            </Link>
            <Link
              href="/demo"
              className="
                inline-flex items-center justify-center rounded-xl
                bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500
                text-white px-3.5 py-2 text-sm font-medium shadow
                hover:opacity-95 transition
              "
            >
              Book a Demo
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              ref={buttonRef}
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Toggle menu"
              className="
                inline-flex h-10 w-10 items-center justify-center rounded-2xl
                border border-white/20 text-gray-800/80 dark:text-gray-100/80
                bg-white/10 dark:bg-white/5 backdrop-blur-md
                hover:bg-white/20 hover:text-gray-900 dark:hover:text-white transition
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
              "
            >
              <span className="sr-only">Menu</span>
              <MenuIcon open={open} />
            </button>
          </div>

          {/* Mobile panel */}
          {open && (
            <div
              id="mobile-nav"
              ref={panelRef}
              className="
                absolute left-2 right-2 top-[calc(100%+8px)]
                rounded-2xl border border-white/15 bg-white/90 dark:bg-gray-900/90
                backdrop-blur-xl p-3
              "
            >
              <div className="flex flex-col">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'px-3 py-3 rounded-xl text-sm transition',
                      'text-gray-900 dark:text-gray-100',
                      isActive(item.href)
                        ? 'bg-white/60 dark:bg-white/10 border border-white/30'
                        : 'hover:bg-white/50 dark:hover:bg-white/5 border border-transparent'
                    ].join(' ')}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-2 flex flex-col gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="
                      inline-flex items-center justify-center rounded-xl
                      px-3 py-2 text-sm
                      text-gray-900 dark:text-gray-100 hover:bg-white/50 dark:hover:bg-white/5
                      transition
                    "
                  >
                    Sign In
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/pricing-request"
                      onClick={() => setOpen(false)}
                      className="
                        inline-flex items-center justify-center rounded-xl border border-white/30
                        bg-white/40 dark:bg-white/5 px-3 py-2 text-sm
                        text-gray-900 dark:text-gray-100 hover:bg-white/60 dark:hover:bg-white/10
                        transition
                      "
                    >
                      Request Pricing
                    </Link>
                    <Link
                      href="/demo"
                      onClick={() => setOpen(false)}
                      className="
                        inline-flex items-center justify-center rounded-xl
                        bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500
                        text-white px-3 py-2 text-sm font-medium shadow
                        hover:opacity-95 transition
                      "
                    >
                      Book a Demo
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
    </svg>
  )
}
