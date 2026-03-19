import { Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import ClientLayout from '@/layout/ClientLayout';
import { ReduxProvider } from '@/redux/providers';
import { Metadata, Viewport } from "next";
import dynamic from 'next/dynamic';
import PushWrapper from '@/layout/PushWrapper';


const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RBS",
  description: "RBS - construction management system",
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
            <PushWrapper /> 
            <ClientLayout>{children}</ClientLayout>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}