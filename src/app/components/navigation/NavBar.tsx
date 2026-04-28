'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';

const NAV_LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Premium', href: '/premium' },
  { label: 'Feedback', href: '/feedback' },
];

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-700" />
            {/* TODO: replace with your brand */}
            <span className="text-lg font-bold tracking-tight">SaaS Starter</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-primary bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium px-3 py-2 rounded-md text-gray-700 hover:text-gray-900">
                  Sign in
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-700 transition-colors">
                  Get started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/account"
                className={`hidden sm:inline-flex text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                  pathname === '/account'
                    ? 'text-primary bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Account
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 text-sm ${
                  pathname === item.href
                    ? 'text-primary bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
