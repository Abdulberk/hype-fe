import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal configuration for Vercel compatibility
  
  // Enable compression for better performance
  compress: true,
  
  // Ensure proper routing for Vercel
  trailingSlash: false,
  
  // Simplified webpack configuration for Vercel compatibility
  webpack: (config, { dev, isServer }) => {
    // Only apply optimizations in production and avoid complex chunk splitting on Vercel
    if (!dev && !isServer) {
      // Simple optimization that works well with Vercel
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
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
  
  // Ensure proper output for Vercel
  output: 'standalone',
};

export default nextConfig;
