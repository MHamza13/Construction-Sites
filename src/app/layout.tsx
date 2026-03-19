"use client";

import { useEffect } from 'react';
import { Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import ClientLayout from '@/layout/ClientLayout';
import { ReduxProvider } from '@/redux/providers';
import { Viewport } from "next";
import { Capacitor } from "@capacitor/core";
import PushNotificationInit from '@/layout/PushNotificationInit';

const outfit = Outfit({
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    // 🛑 AGAR NATIVE APP HAI TO SERVICE WORKER UNREGISTER KAREIN
    if (Capacitor.isNativePlatform()) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
            console.log("RBS_DEBUG: Web Service Worker Unregistered for Native App");
          }
        });
      }
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Manifest sirf web par load ho, mobile par Capacitor handle karega */}
        {!Capacitor.isNativePlatform() && <link rel="manifest" href="/manifest.json" />}
      </head>
      <body className={`${outfit.className} dark:bg-gray-900 antialiased`}>
        <ReduxProvider>
          <ThemeProvider>
            <PushNotificationInit />
            <ClientLayout>
              {children}
            </ClientLayout>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}