import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack to fix WorkerError
  turbopack: false,  // ✅ Add this line

  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ignore ESLint during build
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

  // Image optimization
  images: {
    unoptimized: false,
    loader: "default",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },
};

export default nextConfig;
