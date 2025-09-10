/** @type {import('next').NextConfig} */
const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Apply polyfills for server-side rendering
// Temporarily disabled to fix document is not defined error
// require('./scripts/setup-globals.js');

const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'images.unsplash.com'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Skip static optimization for API routes
  outputFileTracingExcludes: {
    '/api/*': ['*'],
  },
  // Webpack configuration to handle DNA SDK issues
  webpack: (config, { isServer, dev }) => {
    // Treat DNA SDK warnings as non-fatal
    config.infrastructureLogging = {
      level: 'error',
    };

    // Performance optimizations
    if (!dev) {
      // Tree shake unused exports
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Better module concatenation
      config.optimization.concatenateModules = true;
      
      // Reduce bundle size
      config.resolve.alias = {
        ...config.resolve.alias,
        // Replace date-fns with dayjs for smaller bundle
        'date-fns': 'dayjs',
        // Optimize lucide imports
        'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react/dist/esm/icons'),
      };
    }

    // Ensure proper module resolution for local packages
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Optimize for Railway's container environment
    if (process.env.RAILWAY_ENVIRONMENT) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 30,
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig)