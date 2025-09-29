import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { QueryProvider } from '@/components/providers/QueryProvider'
// import { HeraThemeProvider } from '@/components/universal/ui/HeraThemeProvider'
import ThemeProvider from '@/app/components/ThemeProvider'
import PublicPageWrapper from '@/app/components/PublicPageWrapper'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'
// import { DemoAuthHandler } from '@/components/auth/DemoAuthHandler'; // Temporarily disabled due to runtime error
import { ToastProvider } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import CookieBanner from '@/components/ui/cookie-banner'
// import "./globals.css"; // Original - temporarily disabled for migration testing
import './globals-migration-test.css' // Migration test - imports both styles
// import "../styles/intro.css"; // Temporarily disabled for SSR compatibility

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'HERA Universal ERP',
  description:
    'Run your entire business in one beautiful platform. From day one to enterprise scale.',
  authors: [{ name: 'HERA Team' }],
  creator: 'HERA Corporation',
  publisher: 'HERA Corporation',
  formatDetection: {
    telephone: false
  },
  openGraph: {
    title: 'HERA Universal ERP',
    description:
      'Run your entire business in one beautiful platform. From day one to enterprise scale.',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HERA Universal ERP',
    description:
      'Run your entire business in one beautiful platform. From day one to enterprise scale.'
  },
  icons: {
    icon: [
      { url: '/favicon-16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [{ url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg'
  }
}

export const viewport: Viewport = {
  themeColor: '#1E293B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <Script
          id="public-page-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // List of public routes that should be dark-only
                const PUBLIC_ROUTES = [
                  "/", "/demo", "/pricing-request", "/blog", "/docs",
                  "/contact", "/partners", "/solutions", "/features",
                  "/terms", "/policy", "/whatsapp-desktop", "/discover",
                  "/how-it-works", "/pricing", "/get-started", "/book-a-meeting",
                  "/about"
                ];

              const pathname = window.location.pathname;
              const isPublicPage = PUBLIC_ROUTES.some(route => {
                if (route === "/") {
                  return pathname === "/";
                }
                return pathname.startsWith(route);
              });

              if (isPublicPage) {
                // Force dark mode for public pages BEFORE hydration
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');

                // Add public-page class to body as soon as it's available
                function addPublicPageClass() {
                  if (document.body) {
                    document.body.classList.add('public-page');
                  }
                }

                // Try to add class immediately if body exists
                if (document.body) {
                  addPublicPageClass();
                } else if (document.readyState === 'loading') {
                  // Use DOMContentLoaded if still loading
                  document.addEventListener('DOMContentLoaded', addPublicPageClass);

                  // Also use MutationObserver as fallback for early body creation
                  const observer = new MutationObserver(function(mutations, obs) {
                    if (document.body) {
                      addPublicPageClass();
                      obs.disconnect();
                    }
                  });
                  observer.observe(document.documentElement, { childList: true, subtree: true });
                }
              } else {
                // Apply saved theme for non-public pages
                const saved = localStorage.getItem('theme') || 'dark';
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const effective = saved === 'system' ? (systemDark ? 'dark' : 'light') : saved;
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(effective);
              }

              // No-op cookie preferences function for footer
              window.showCookiePreferences = function() {
                console.log('Cookie preferences would be shown here');
                // TODO: Replace with actual CMP integration (Cookiebot/OneTrust)
              };
            })();
          `
        }}
      />
        {/* PWA functionality has been removed from HERA for multi-tenant safety */}
        {/* Setting cache control headers for multi-tenant security */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
        style={{
          minHeight: '100vh'
        }}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <PublicPageWrapper>
            <QueryProvider>
              <HERAAuthProvider>
                <ToastProvider>
                  {children}
                  <Toaster />
                  <CookieBanner />
                </ToastProvider>
              </HERAAuthProvider>
            </QueryProvider>
          </PublicPageWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
