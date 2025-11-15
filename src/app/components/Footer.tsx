// app/components/Footer.tsx
'use client'

import React from 'react'
import Link from 'next/link'

type FooterProps = {
  showGradient?: boolean // turn on to add subtle hero-style gradient behind glass
}

export default function Footer({ showGradient = true }: FooterProps) {
  return (
    <footer className="relative mt-24">
      {showGradient && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="mx-auto h-40 w-[90%] max-w-7xl bg-gradient-to-r from-indigo-500/20 via-fuchsia-400/15 to-cyan-400/20 blur-2xl rounded-3xl"></div>
        </div>
      )}

      <div className="mx-auto w-[92%] max-w-7xl">
        <div className="rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 backdrop-blur-lg shadow-xl">
          {/* top row */}
          <div className="grid grid-cols-1 gap-12 px-8 py-12 lg:grid-cols-4 lg:gap-16 lg:px-12">
            {/* brand - takes 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 text-white font-bold text-lg">
                  H
                </span>
                <span className="text-xl font-semibold tracking-tight ink dark:text-slate-50">
                  HERA ERP
                </span>
              </Link>
              <p className="max-w-md text-sm leading-relaxed dark:ink-muted">
                Enterprise ERP with modern patterns, fast implementation, and AI-driven continuous
                improvement. Built for the future of business.
              </p>

              {/* social icons under brand */}
              <div className="flex gap-3 pt-2">
                <SocialIcon href="https://www.linkedin.com/company/heraerp?trk=public_post_feed-actor-image" label="LinkedIn">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5H4.5V23.5H.5V8.5zM8.5 8.5H12.3V10.3H12.35C12.9 9.25 14.25 8.1 16.3 8.1 20.2 8.1 21 10.7 21 14.2V23.5H17V15.3C17 13.4 16.95 10.95 14.6 10.95 12.2 10.95 11.85 12.95 11.85 15.15V23.5H8.5V8.5z" />
                  </svg>
                </SocialIcon>
                <SocialIcon href="https://x.com/hera_erp?s=11" label="X (Twitter)">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2H21.5l-7.59 8.66L23 22h-6.828l-5.35-6.39L4.3 22H1l8.14-9.29L1 2h6.914l4.98 5.82L18.244 2Zm-1.196 18h1.86L7.03 3.99H5.07L17.048 20Z" />
                  </svg>
                </SocialIcon>
                <SocialIcon href="https://youtube.com/@heraerp?si=-VgSSh9TCJ34qRV8" label="YouTube">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M23.5 6.2a3.1 3.1 0 0 0-2.18-2.18C19.2 3.5 12 3.5 12 3.5s-7.2 0-9.32.52A3.1 3.1 0 0 0 .5 6.2 32 32 0 0 0 0 12a32 32 0 0 0 .5 5.8 3.1 3.1 0 0 0 2.18 2.18C4.8 20.5 12 20.5 12 20.5s7.2 0 9.32-.52a3.1 3.1 0 0 0 2.18-2.18A32 32 0 0 0 24 12a32 32 0 0 0-.5-5.8ZM9.75 15.5v-7L16 12l-6.25 3.5Z" />
                  </svg>
                </SocialIcon>
                <SocialIcon href="https://www.instagram.com/hera_erp?igsh=emRpZ3RsbjB6Nmts&utm_source=qr" label="Instagram">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </SocialIcon>
              </div>
            </div>

            {/* product links */}
            <nav aria-label="Product" className="space-y-4">
              <h3 className="text-sm font-semibold ink dark:text-slate-50 uppercase tracking-wider">
                Product
              </h3>
              <div className="flex flex-col space-y-3">
                <Link
                  href="/demo"
                  className="block text-sm dark:-muted hover:ink dark:hover:text-slate-50 transition-colors py-0.5"
                >
                  Book a Demo
                </Link>
                <Link
                  href="/pricing-request"
                  className="block text-sm dark:-muted hover:ink dark:hover:text-slate-50 transition-colors py-0.5"
                >
                  Request Pricing
                </Link>
                <Link
                  href="/partners"
                  className="block text-sm dark:-muted hover:ink dark:hover:text-slate-50 transition-colors py-0.5"
                >
                  Partners
                </Link>
                <Link
                  href="/blog"
                  className="block text-sm dark:-muted hover:ink dark:hover:text-slate-50 transition-colors py-0.5"
                >
                  Blog & Updates
                </Link>
              </div>
            </nav>

            {/* company links */}
            <nav aria-label="Company" className="space-y-4">
              <h3 className="text-sm font-semibold ink dark:text-slate-50 uppercase tracking-wider">
                Company
              </h3>
              <div className="flex flex-col space-y-3">
                <Link
                  href="/contact"
                  className="block text-sm dark:-muted hover:ink dark:hover:text-slate-50 transition-colors py-0.5"
                >
                  Contact Us
                </Link>
                <Link
                  href="/policy"
                  className="block text-sm dark:-muted hover:ink dark:hover:text-slate-50 transition-colors py-0.5"
                >
                  Privacy & Cookies
                </Link>
                <Link
                  href="/terms"
                  className="block text-sm dark:-muted hover:ink dark:hover:text-slate-50 transition-colors py-0.5"
                >
                  Terms of Service
                </Link>
                <button
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5 text-left"
                  onClick={() => {
                    // @ts-ignore
                    window?.showCookiePreferences?.()
                  }}
                >
                  Cookie Preferences
                </button>
              </div>
            </nav>
          </div>

          {/* bottom row */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700 px-8 py-6 text-sm dark:ink-muted md:flex-row md:px-12">
            <p>© {new Date().getFullYear()} HERA ERP Ltd. All rights reserved.</p>
            <p className="text-sm">Built on modern enterprise patterns (patent pending).</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({
  href,
  label,
  children
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-600 ink dark:text-slate-300 bg-slate-100 dark:bg-slate-800 backdrop-blur-md hover:bg-slate-200 dark:hover:bg-slate-700 transition"
    >
      {children}
    </a>
  )
}
