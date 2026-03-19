import { Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import ClientLayout from '@/layout/ClientLayout';
import { ReduxProvider } from '@/redux/providers';
import { Metadata, Viewport } from "next";
// import dynamic from 'next/dynamic'; // Agar use nahi ho raha to remove kar dein
import PushWrapper from '@/layout/PushWrapper';

const outfit = Outfit({
  subsets: ["latin"],
});

// --- FIXED METADATA ---
export const metadata: Metadata = {
  title: "RBS",
  description: "RBS - construction management system",
  manifest: "/manifest.json", // Ye line browser ko manifest se connect karegi
  icons: {
    icon: "/images/icon-192.png",
    apple: "/images/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} dark:bg-gray-900 antialiased`}>
        <ReduxProvider>
          <ThemeProvider>
            {/* PushWrapper notification initialization handle karega */}
            <PushWrapper /> 
            <ClientLayout>{children}</ClientLayout>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}