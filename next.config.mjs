/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable static optimization for faster builds
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react']
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

export default nextConfig