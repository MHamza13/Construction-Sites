import type { NextConfig } from "next";

// PWA Plugin Initialize
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
    importScripts: ['/custom-sw.js'], 
  // 👇 Yahan change kiya hai taake Dev mode mein bhi files banen
 disable: process.env.NODE_ENV === "development", 
//  disable: false, 
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
    unoptimized: true, 
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

export default withPWA(nextConfig);