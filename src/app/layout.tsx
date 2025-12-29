import { Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import ClientLayout from '@/layout/ClientLayout';
import { ReduxProvider } from '@/redux/providers';
import type { Metadata, Viewport } from "next";

const outfit = Outfit({
  subsets: ["latin"],
});

// PWA Metadata and Manifest
export const metadata: Metadata = {
  title: "My App Name",
  description: "My App Description",
  manifest: "/manifest.json", // PWA File Link
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My App Name",
  },
  formatDetection: {
    telephone: false,
  },
};

// Mobile Viewport Settings (Zoom disable etc)
export const viewport: Viewport = {
  themeColor: "#000000", // Status bar color
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ReduxProvider>
          <ThemeProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}