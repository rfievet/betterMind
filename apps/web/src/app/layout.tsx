/**
 * Root layout component
 * Wraps all pages with common providers and styles
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Load Inter font from Google Fonts
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'betterMind - AI Mental Wellness Platform',
  description: 'Non-clinical, AI-assisted mental wellness platform for guided reflection and journaling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Main content */}
        {children}
      </body>
    </html>
  );
}
