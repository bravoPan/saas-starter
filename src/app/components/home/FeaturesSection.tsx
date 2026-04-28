import { FiLock, FiCreditCard, FiDatabase, FiShield, FiCode, FiZap } from 'react-icons/fi';

const FEATURES = [
  {
    icon: FiLock,
    title: 'Clerk Authentication',
    description:
      'Email/password, OAuth (Google, GitHub, etc), magic links, and a polished UserButton — all wired up.',
  },
  {
    icon: FiCreditCard,
    title: 'Stripe Subscriptions',
    description:
      'Checkout sessions, customer portal for self-service billing, and webhooks that sync state to your DB.',
  },
  {
    icon: FiDatabase,
    title: 'Supabase + Postgres',
    description:
      'Service-role admin client, RLS-friendly schema, and Clerk → Supabase user sync via webhooks.',
  },
  {
    icon: FiShield,
    title: 'Tier-based Gating',
    description:
      'Free / Basic / Pro / Enterprise tiers with reusable <Gate>, <Paywall>, and requireTier helpers.',
  },
  {
    icon: FiCode,
    title: 'Next.js 15 + App Router',
    description:
      'Server components, server actions, streaming SSR, and TypeScript strict mode out of the box.',
  },
  {
    icon: FiZap,
    title: 'CI Build Check',
    description:
      'GitHub Actions workflow runs `next build` on every PR so type errors never reach main.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-24 bg-gray-50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="text-lg text-gray-600">
            We&apos;ve already wired up the integrations that take a week to get right.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
