// app/components/Footer.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type FooterProps = {
  showGradient?: boolean; // turn on to add subtle hero-style gradient behind glass
};

export default function Footer({ showGradient = false }: FooterProps) {
  const pathname = usePathname();

  // Show gradient only on home page
  const shouldShowGradient = showGradient && pathname === "/";

  return (
    <footer className="relative mt-24">
      {shouldShowGradient && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="mx-auto h-40 w-[90%] max-w-7xl bg-gradient-to-r from-indigo-500/20 via-fuchsia-400/15 to-cyan-400/20 blur-2xl rounded-3xl"></div>
        </div>
      )}

      <div className="mx-auto w-[92%] max-w-7xl">
        <div className="rounded-3xl border border-white/15 bg-white/10 dark:border-white/10 dark:bg-white/5 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)]">
          {/* top row */}
          <div className="grid grid-cols-1 gap-12 px-8 py-12 lg:grid-cols-4 lg:gap-16 lg:px-12">
            {/* brand - takes 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 text-white font-bold text-lg">
                  H
                </span>
                <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  HERA ERP
                </span>
              </Link>
              <p className="max-w-md text-sm leading-relaxed text-gray-700/90 dark:text-gray-300/90">
                Enterprise ERP with modern patterns, fast implementation, and
                AI-driven continuous improvement. Built for the future of business.
              </p>

              {/* social icons under brand */}
              <div className="flex gap-3 pt-2">
                <SocialIcon
                  href="https://www.linkedin.com/company/heraerp"
                  label="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5H4.5V23.5H.5V8.5zM8.5 8.5H12.3V10.3H12.35C12.9 9.25 14.25 8.1 16.3 8.1 20.2 8.1 21 10.7 21 14.2V23.5H17V15.3C17 13.4 16.95 10.95 14.6 10.95 12.2 10.95 11.85 12.95 11.85 15.15V23.5H8.5V8.5z"/>
                  </svg>
                </SocialIcon>
                <SocialIcon
                  href="https://x.com/heraerp"
                  label="X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2H21.5l-7.59 8.66L23 22h-6.828l-5.35-6.39L4.3 22H1l8.14-9.29L1 2h6.914l4.98 5.82L18.244 2Zm-1.196 18h1.86L7.03 3.99H5.07L17.048 20Z"/>
                  </svg>
                </SocialIcon>
                <SocialIcon
                  href="https://youtube.com/@heraerp"
                  label="YouTube"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M23.5 6.2a3.1 3.1 0 0 0-2.18-2.18C19.2 3.5 12 3.5 12 3.5s-7.2 0-9.32.52A3.1 3.1 0 0 0 .5 6.2 32 32 0 0 0 0 12a32 32 0 0 0 .5 5.8 3.1 3.1 0 0 0 2.18 2.18C4.8 20.5 12 20.5 12 20.5s7.2 0 9.32-.52a3.1 3.1 0 0 0 2.18-2.18A32 32 0 0 0 24 12a32 32 0 0 0-.5-5.8ZM9.75 15.5v-7L16 12l-6.25 3.5Z"/>
                  </svg>
                </SocialIcon>
                <SocialIcon
                  href="https://www.instagram.com/heraerp"
                  label="Instagram"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </SocialIcon>
                <SocialIcon
                  href="https://bsky.app/profile/heraerp.bsky.social"
                  label="Bluesky"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.057-.138.017-.276.035-.415.052-2.67-.297-5.568.628-6.383 3.364C.624 17.298.378 21.45 0 22.07c0 .689.139 1.861.902 2.204.659.299 1.664.621 4.3-1.24C7.954 21.093 10.913 17.21 12 15.2c1.087 2.01 4.046 5.893 6.798 7.834 2.636 1.861 3.641 1.539 4.3 1.24.763-.343.902-1.515.902-2.204-.378-.62-.624-4.772-.624-5.6-.815-2.736-3.713-3.661-6.383-3.364-.139-.017-.277-.035-.415-.052.14.018.279.037.415.057 2.67.296 5.568-.628 6.383-3.364.246-.829.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8Z"/>
                  </svg>
                </SocialIcon>
                <SocialIcon
                  href="https://www.facebook.com/heraerp"
                  label="Facebook"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
                  </svg>
                </SocialIcon>
              </div>
            </div>

            {/* product links */}
            <nav aria-label="Product" className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Product
              </h3>
              <div className="flex flex-col space-y-3">
                <Link href="/demo" className="footer-link">Book a Demo</Link>
                <Link href="/pricing-request" className="footer-link">Request Pricing</Link>
                <Link href="/partners" className="footer-link">Partners</Link>
                <Link href="/blog" className="footer-link">Blog & Updates</Link>
              </div>
            </nav>

            {/* company links */}
            <nav aria-label="Company" className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Company
              </h3>
              <div className="flex flex-col space-y-3">
                <Link href="/contact" className="footer-link">Contact Us</Link>
                <Link href="/policy" className="footer-link">Privacy & Cookies</Link>
                <Link href="/terms" className="footer-link">Terms of Service</Link>
                <button
                  className="footer-link text-left"
                  onClick={() => {
                    // @ts-ignore
                    window?.showCookiePreferences?.();
                  }}
                >
                  Cookie Preferences
                </button>
              </div>
            </nav>
          </div>

          {/* bottom row */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/15 px-8 py-6 text-sm text-gray-700/80 dark:text-gray-300/80 md:flex-row md:px-12">
            <p>© {new Date().getFullYear()} HERA ERP Ltd. All rights reserved.</p>
            <p className="text-sm">
              Built on modern enterprise patterns (patent pending).
            </p>
          </div>
        </div>
      </div>

      {/* local styles for links */}
      <style jsx global>{`
        .footer-link {
          display: block;
          color: rgba(17, 24, 39, 0.85);
          font-size: 0.875rem;
          line-height: 1.5;
          transition: color 0.2s ease;
          padding: 0.125rem 0;
        }
        .dark .footer-link {
          color: rgba(243, 244, 246, 0.85);
        }
        .footer-link:hover {
          color: #111827;
        }
        .dark .footer-link:hover {
          color: #ffffff;
        }
      `}</style>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 text-gray-800/80 dark:text-gray-100/80 bg-white/10 dark:bg-white/5 backdrop-blur-md hover:bg-white/20 hover:text-gray-900 dark:hover:text-white transition"
    >
      {children}
    </a>
  );
}