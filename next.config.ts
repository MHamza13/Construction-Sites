import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack completely to avoid WorkerError
  turbopack: false, // ✅ critical fix

  reactStrictMode: true, // Always recommended

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

  // Image optimization for external sources
  images: {
    unoptimized: false,
    loader: "default",
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
      { protocol: "https", hostname: "salmanfarooq1-001-site1.jtempurl.com", pathname: "/**" },
      { protocol: "https", hostname: "tile.openstreetmap.org", pathname: "/**" },
      { protocol: "https", hostname: "*.tile.openstreetmap.org", pathname: "/**" },
      { protocol: "https", hostname: "unpkg.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.jsdelivr.net", pathname: "/**" },
      { protocol: "https", hostname: "cdnjs.cloudflare.com", pathname: "/**" }
    ],
  },

  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },
};

export default nextConfig;
