"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/app/components/ThemeToggle";

type NavItem = { href: string; label: string }

const NAV_ITEMS: NavItem[] = [
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "Partners" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

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
      {/* Enhanced gradient background with depth */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="mx-auto h-24 w-[94%] max-w-7xl bg-gradient-to-r from-blue-600/25 via-indigo-500/20 via-purple-500/20 to-cyan-500/25 blur-3xl rounded-3xl" />
        <div className="mx-auto h-16 w-[90%] max-w-6xl bg-gradient-to-r from-white/10 via-transparent to-white/10 blur-xl rounded-2xl" />
      </div>

      <div className="mx-auto mt-4 w-[94%] max-w-7xl">
        <div
          role="navigation" aria-label="Primary"
          className="relative flex items-center justify-between rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/50 shadow-2xl shadow-black/5 px-6 py-3 md:px-8"
        >
          {/* Enhanced Brand */}
          <Link
            href="/"
            className="group inline-flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 text-white font-black text-lg shadow-lg shadow-indigo-500/25">
                H
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-400 via-purple-400 to-cyan-400 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm" />
            </div>
            <span className="ink text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-700 dark:from-indigo-300 dark:via-purple-300 dark:to-cyan-300 bg-clip-text text-transparent">
              HERA ERP
            </span>
          </Link>

          {/* Enhanced Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                  isActive(item.href)
                    ? "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 shadow-lg shadow-indigo-500/10"
                    : "text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40 hover:backdrop-blur-sm hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-white/30 dark:hover:border-gray-700/30 hover:shadow-md",
                ].join(" ")}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <span className="relative z-10">{item.label}</span>
                {/* Subtle hover glow */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Enhanced Sign In */}
          <div className="hidden md:flex items-center">
            <Link
              href="/auth/login"
              className="group relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden border border-indigo-200/50 dark:border-indigo-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-indigo-700 dark:text-indigo-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sign In
              </span>
              {/* Subtle shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-12 group-hover:animate-[shimmer_2s_ease-in-out]" />
              </div>
            </Link>
          </div>

          {/* Enhanced Mobile menu button */}
          <div className="md:hidden">
            <button
              ref={buttonRef}
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Toggle menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 hover:scale-105 shadow-lg shadow-black/5"
            >
              <span className="sr-only">Menu</span>
              <MenuIcon open={open} />
            </button>
          </div>

          {/* Enhanced Mobile panel */}
          {open && (
            <div
              id="mobile-nav"
              ref={panelRef}
              className="absolute left-3 right-3 top-[calc(100%+12px)] rounded-2xl border border-white/20 dark:border-gray-700/50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-black/10 p-4"
            >
              <div className="flex flex-col space-y-1">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "px-5 py-3.5 rounded-xl text-base font-medium transition-all duration-300",
                      isActive(item.href)
                        ? "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:backdrop-blur-sm hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-white/30 dark:hover:border-gray-700/30",
                    ].join(" ")}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-4 pt-4 border-t border-white/20 dark:border-gray-700/50">
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 hover:bg-white/90 dark:hover:bg-gray-800/90 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Sign In
                  </Link>
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