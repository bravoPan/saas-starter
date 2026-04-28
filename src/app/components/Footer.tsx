import Link from 'next/link';
import { FiGithub, FiTwitter } from 'react-icons/fi';

const PRODUCT_LINKS = [
  { name: 'Pricing', href: '/pricing' },
  { name: 'Premium', href: '/premium' },
  { name: 'Account', href: '/account' },
];

const RESOURCE_LINKS = [
  { name: 'Blog', href: '/blog' },
  { name: 'Feedback', href: '/feedback' },
];

const LEGAL_LINKS = [
  { name: 'Privacy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8 mt-24">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-700 mr-2" />
              {/* TODO: replace with your brand */}
              <span className="text-lg font-bold">SaaS Starter</span>
            </div>
            <p className="text-sm text-gray-600 max-w-xs">
              Production-ready Next.js starter with Clerk, Stripe, and Supabase.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-gray-900">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-gray-900">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-gray-900">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© {currentYear} SaaS Starter. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-700"
              aria-label="GitHub"
            >
              <FiGithub size={18} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-700"
              aria-label="Twitter"
            >
              <FiTwitter size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
