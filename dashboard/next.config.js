const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Next.js to treat the dashboard folder as the tracing root
  outputFileTracingRoot: path.resolve(__dirname),

  // Remove deprecated options - these are now defaults in Next.js 15
  // swcMinify: true, // ❌ REMOVED - deprecated in Next.js 15
  
  // typedRoutes is now stable, no longer experimental
  typedRoutes: false,

  // Fix Turbopack configuration - remove webpack loaders
  turbopack: {
    // Remove CSS loader rules - let Turbopack handle CSS natively
    // rules: {
    //   "*.css": ["css-loader"] // ❌ REMOVED - causing conflicts
    // }
  },
  
  // Webpack config only runs when NOT using Turbopack
  // This fixes the "Webpack configured while Turbopack is not" warning
  webpack: (config, { dev, isServer, webpack }) => {
    // Only apply webpack optimizations when webpack is actually being used
    if (!process.env.TURBOPACK) {
      if (dev) {
        // Speed up dev builds
        config.optimization = {
          ...config.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        };
        
        // Faster source maps
        config.devtool = 'eval-cheap-module-source-map';
        
        // Reduce bundle analysis overhead
        config.stats = 'errors-warnings';
      }
    }
    
    return config;
  },
  
  // Compiler options (these work with both Webpack and Turbopack)
  compiler: {
    // Remove console logs in production only
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // These options are still valid in Next.js 15
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    unoptimized: true, // Faster dev, optimize in production if needed
  },

  // Suppress the specific warnings
  onDemandEntries: {
    // Extend the timeout for dev
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Experimental features for Next.js 15
  experimental: {
    // Enable if you want to use the latest Turbopack features
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },
};

module.exports = nextConfig;