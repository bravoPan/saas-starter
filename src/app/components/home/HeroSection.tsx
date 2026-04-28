import Link from 'next/link';
import { FiArrowRight, FiGithub } from 'react-icons/fi';

export default function HeroSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-3xl" />
      </div>

      <div className="container text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Production-ready in 5 minutes
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Ship your SaaS{' '}
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            without rebuilding the boring parts
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          A Next.js 15 starter with auth (Clerk), subscriptions (Stripe), and database (Supabase) wired up
          end-to-end — including webhooks, customer portal, and tier-based content gating.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-700 transition shadow-sm"
          >
            View pricing <FiArrowRight className="ml-2" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <FiGithub className="mr-2" />
            View source
          </a>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          MIT licensed · Use it as a base for any SaaS idea
        </p>
      </div>
    </section>
  );
}
