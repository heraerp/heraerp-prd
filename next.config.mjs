// next.config.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build Performance Optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Experimental optimizations  
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'recharts',
      'date-fns',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-button',
      '@radix-ui/react-card',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-form',
      '@radix-ui/react-input',
      '@radix-ui/react-label',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-sheet',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-table',
      '@radix-ui/react-tabs',
      '@radix-ui/react-textarea',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-tooltip'
    ],
    webVitalsAttribution: ['CLS', 'LCP'],
    optimizeCss: true,
    scrollRestoration: true
  },
  
  // Production build optimizations for Docker
  
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],

  images: { domains: ['localhost'], formats: ['image/avif', 'image/webp'] },
  reactStrictMode: true,

  // No health rewrites needed - using App Router /api/health
  async rewrites() {
    return { beforeFiles: [], afterFiles: [], fallback: [] }
  },

  // 🔧 Webpack optimizations and alias resolution
  webpack(config, { dev, isServer }) {
    // 🛡️ SSR Polyfill: Inject self-polyfill to prevent SSR crashes
    const originalEntry = config.entry
    config.entry = async () => {
      const entries = await originalEntry()
      const polyfillPath = './src/polyfills/self-polyfill.ts'

      if (entries['main-app'] && !entries['main-app'].includes(polyfillPath)) {
        entries['main-app'].unshift(polyfillPath)
      }

      return entries
    }

    // Alias resolution
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@': path.join(__dirname, 'src'),
    }

    // Production optimizations
    if (!dev) {
      // Enable aggressive chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              chunks: 'all',
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 20
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            },
            lib: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'lib',
              chunks: 'all',
              priority: 30
            },
            ui: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 25
            }
          }
        }
      }

      // Minimize bundles
      if (!isServer) {
        config.optimization.usedExports = true
        config.optimization.sideEffects = false
      }
    }

    // Faster builds
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }

    // Exclude heavy packages from server bundle when possible
    if (isServer) {
      config.externals = [...(config.externals || []), {
        'canvas': 'canvas',
        'jsdom': 'jsdom',
        'puppeteer': 'puppeteer'
      }]
    }

    return config
  },
}

export default nextConfig
