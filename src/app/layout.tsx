import { Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import ClientLayout from '@/layout/ClientLayout';
import { ReduxProvider } from '@/redux/providers';
import type { Metadata, Viewport } from "next";
import PushNotificationInit from '@/layout/PushNotificationInit';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RBS",
  description: "RBS - construction management system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RBS",
  },
  formatDetection: {
    telephone: false,
  },
};

// --- YAHAN CHANGES HAIN ---
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
  return (
    <html lang="en" suppressHydrationWarning>
   
      <body className={`${outfit.className} dark:bg-gray-900 antialiased`}>
        <ReduxProvider>
          <ThemeProvider>
            <PushNotificationInit/>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}