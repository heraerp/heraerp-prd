// next.config.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone for Railway healthcheck compatibility
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

  // 🔧 Force @ to resolve to ./src (works regardless of tsconfig during CI)
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@': path.join(__dirname, 'src'),
    }
    return config
  },
}

export default nextConfig
