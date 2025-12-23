import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  // Disable Turbopack to avoid worker retries error
  turbopack: false,  // ✅ Add this line

  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ignore ESLint during build (optional)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // SVG support using @svgr/webpack
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            exportType: "default",
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: "preset-default",
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });

    return config;
  },

  // Critical: Fix sharp & image optimization on Netlify
  images: {
    unoptimized: false, // Keep optimization ON
    loader: "default",
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },
};

export default nextConfig;
