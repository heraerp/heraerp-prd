/** @type {import('next').NextConfig} */
const path = require('path');

// Apply polyfills for server-side rendering
require('./scripts/setup-globals.js');

const nextConfig = {
  output: 'standalone',
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
    domains: ['localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
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