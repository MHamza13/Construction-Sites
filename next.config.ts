import type { NextConfig } from "next";

// PWA Plugin Initialize
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Dev mode me disable rahe
});

const nextConfig: NextConfig = {
  // TypeScript errors ignore karne ke liye
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint errors ignore karne ke liye
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Next.js 15+ ke liye top-level config (Experimental se bahar)
  serverExternalPackages: ["sharp"],

  // Webpack config for SVGR
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

  images: {
    unoptimized: true, // PWA/Static export ke liye zaroori
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/api/**",
      },
    ],
  },
};

// PWA wrapper ke sath config export
export default withPWA(nextConfig);