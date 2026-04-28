import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'SaaS Starter',
    template: '%s — SaaS Starter',
  },
  description:
    'Production-ready Next.js starter with Clerk auth, Stripe subscriptions, and Supabase.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="font-sans antialiased bg-white text-gray-900">
          <div suppressHydrationWarning>{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
