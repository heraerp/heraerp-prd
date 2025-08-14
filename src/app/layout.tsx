import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerProvider } from "@/components/pwa/ServiceWorkerProvider";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { HeraThemeProvider } from "@/components/universal/ui/HeraThemeProvider";
import { SupabaseAuthProvider } from "@/contexts/supabase-auth-context";
import { AuthProvider } from "@/contexts/auth-context";
import ProgressiveLayout from "@/components/layout/ProgressiveLayout";
import "./globals.css";
// import "../styles/intro.css"; // Temporarily disabled for SSR compatibility

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HERA Universal ERP",
  description: "Run your entire business in one beautiful platform. From day one to enterprise scale.",
  applicationName: "HERA ERP",
  authors: [{ name: "HERA Team" }],
  creator: "HERA Corporation",
  publisher: "HERA Corporation",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HERA ERP",
  },
  openGraph: {
    title: "HERA Universal ERP",
    description: "Run your entire business in one beautiful platform. From day one to enterprise scale.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HERA Universal ERP",
    description: "Run your entire business in one beautiful platform. From day one to enterprise scale.",
  },
  icons: {
    icon: [
      { url: '/favicon-16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.svg'
  },
};

export const viewport: Viewport = {
  themeColor: "#1E293B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HERA ERP" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning={true}
      >
        <HeraThemeProvider defaultTheme="light">
          <ServiceWorkerProvider>
            <QueryProvider>
              <SupabaseAuthProvider>
                <AuthProvider>
                  <ProgressiveLayout>
                    {children}
                  </ProgressiveLayout>
                  <UpdateNotification />
                </AuthProvider>
              </SupabaseAuthProvider>
            </QueryProvider>
          </ServiceWorkerProvider>
        </HeraThemeProvider>
      </body>
    </html>
  );
}
