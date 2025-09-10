/** @type {import('next').NextConfig} */
const path = require('path');

// Apply polyfills for server-side rendering
// Temporarily disabled to fix document is not defined error
// require('./scripts/setup-globals.js');

const isCI = process.env.CI === 'true';

const nextConfig = {
  output: 'standalone', // Smaller, simpler runtime
  typescript: {
    // !! WARN !!
    // In CI, we want to catch type errors. In production, we prioritize uptime.
    // !! WARN !!
    ignoreBuildErrors: !isCI,
  },
  eslint: {
    // Warning: In CI, we want to catch lint errors. In production, we prioritize uptime.
    ignoreDuringBuilds: !isCI,
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
  webpack: (config, { isServer }) => {
    // Treat DNA SDK warnings as non-fatal
    config.infrastructureLogging = {
      level: 'error',
    };

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

module.exports = nextConfig