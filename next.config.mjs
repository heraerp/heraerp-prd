import { withContentlayer } from 'next-contentlayer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable static optimization for faster builds
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react']
  },
  // Skip type checking during build (temporary for debugging)
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Headers for caching and partner assets
  async headers() {
    return [
      {
        // Cache partner images for 1 year
        source: '/images/partners/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // Cache optimized partner images for 1 year
        source: '/images/partners/:path*-:size(128|256|512).webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Vary',
            value: 'Accept'
          }
        ]
      },
      {
        // API routes - no cache for dynamic content
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          }
        ]
      },
      {
        // Partner pages - cache for 5 minutes with revalidation
        source: '/partners/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400'
          }
        ]
      }
    ]
  },
  // Reduce build complexity
  webpack: (config, { isServer }) => {
    // Disable source maps in production for faster builds
    if (!isServer) {
      config.devtool = false;
    }
    return config;
  }
}

export default withContentlayer(nextConfig)