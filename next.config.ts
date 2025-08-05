import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression for better performance
  compress: true,
  
  // Optimize static file handling
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    resolveAlias: {
      // Optimize module resolution
      '@': './src',
      '~': './public',
    },
  },
  
  // Webpack optimization for build performance
  webpack: (config, { dev, isServer }) => {
    // Build performance optimizations for React Query app
    if (!dev) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        maxSize: 250000, // 250KB chunks max
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          default: false,
          vendors: false,
          // Separate React Query from main bundle
          reactQuery: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query/,
            name: 'react-query',
            chunks: 'all',
            priority: 10,
          },
          // Separate axios from main bundle
          axios: {
            test: /[\\/]node_modules[\\/]axios/,
            name: 'axios',
            chunks: 'all',
            priority: 9,
          },
        },
      };
    }
    
    return config;
  },
  
  // Enable static optimization
  trailingSlash: false,
  
  // Headers for API optimization
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
