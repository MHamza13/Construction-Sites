import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript errors ignore karne ke liye
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint errors ignore karne ke liye
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Next.js 16 mein 'serverComponentsExternalPackages' ab bahar aa gaya hai
  serverExternalPackages: ["sharp"],

  // Turbopack ke liye SVG support (Naya tarika)
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Webpack support (Jab aap build --webpack use karein)
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
    unoptimized: false,
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

export default nextConfig;