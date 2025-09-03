const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Next.js to treat the dashboard folder as the tracing root
  outputFileTracingRoot: path.resolve(__dirname),

  // typedRoutes is now stable, no longer experimental
  typedRoutes: false,

  // Webpack config - only runs when webpack is used (not Turbopack)
  webpack: (config, { dev, isServer, webpack }) => {
    // Webpack-specific optimizations
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };

      // The problematic line has been removed here.
      config.stats = "errors-warnings";
    }
    
    return config;
  },

  // Single Turbopack configuration
  turbopack: {
    rules: {
      // Add any Turbopack-specific rules here if needed
    },
  },

  // Compiler options (these work with both Webpack and Turbopack)
  compiler: {
    // Remove console logs in production only
    removeConsole: process.env.NODE_ENV === "production",
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
    optimizePackageImports: ["lucide-react", "react-icons"],
  },
  // Permanent redirect from root to /home
async redirects() {
  return [
    {
      source: "/",
      destination: "/home",
      permanent: true,
    },
  ];
},
};

module.exports = nextConfig;