import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import NavBar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';
import Gate from '@/app/components/access/Gate';
import Paywall from '@/app/components/access/Paywall';
import { TIERS, TIER_ICON, TIER_LABEL, type Tier, meetsTier } from '@/app/lib/plans';
import {
  getCurrentUserSubscription,
  isActiveStatus,
} from '@/app/lib/subscription';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Premium',
};

type Section = {
  tier: Tier;
  title: string;
  description: string;
  body: string[];
};

const SECTIONS: Section[] = [
  {
    tier: 'free',
    title: 'Free starter pack',
    description: 'Available to every signed-in user.',
    body: [
      '✓ Weekly product digest',
      '✓ Public community access',
      '✓ Basic templates',
    ],
  },
  {
    tier: 'basic',
    title: 'Basic features',
    description: 'Available on every paid plan.',
    body: [
      '✓ Core feature library',
      '✓ Email support',
      '✓ Up to 1,000 records',
    ],
  },
  {
    tier: 'pro',
    title: 'Pro features',
    description: 'Pro and Enterprise members only.',
    body: [
      '✓ Advanced analytics dashboard',
      '✓ Team collaboration tools',
      '✓ Priority support',
    ],
  },
  {
    tier: 'enterprise',
    title: 'Enterprise features',
    description: 'Enterprise tier exclusive.',
    body: [
      '✓ SSO & audit logs',
      '✓ Dedicated success manager',
      '✓ SLA-backed uptime',
    ],
  },
];

function TierPill({ tier, active }: { tier: Tier; active: boolean }) {
  const tone = active
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-0.5 ${tone}`}>
      {TIER_ICON[tier]} Requires {TIER_LABEL[tier]}
    </span>
  );
}

function InlineUpgrade({ tier }: { tier: Tier }) {
  return (
    <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
      <p className="text-sm text-gray-600">
        Upgrade to {TIER_LABEL[tier]} to unlock this content.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700"
      >
        Upgrade
      </Link>
    </div>
  );
}

export default async function PremiumPage() {
  const { userId } = await auth();
  const subscription = await getCurrentUserSubscription();
  const isActive = isActiveStatus(subscription?.status);
  const userTier: Tier | null = !userId ? null : isActive ? subscription?.tier ?? 'basic' : 'free';

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Premium content showcase</h1>
          <p className="text-gray-600 mt-1">
            Living demo of the three gating patterns in this starter:{' '}
            <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">&lt;Gate&gt;</code>,{' '}
            <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">&lt;Paywall&gt;</code>, and{' '}
            <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">&lt;Gate fallback={'{null}'}&gt;</code>.
          </p>
        </div>

        {/* Current state banner */}
        <div className="mb-8 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
          {!userId ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-gray-900">You&apos;re signed out</p>
                <p className="text-sm text-gray-600">Sign in to see Free-tier content and beyond.</p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-700"
              >
                See plans
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  Your tier: {TIER_ICON[userTier!]} {TIER_LABEL[userTier!]}
                </p>
                <p className="text-sm text-gray-600">
                  {userTier === 'enterprise'
                    ? 'You have access to everything below.'
                    : userTier === 'pro'
                      ? 'You can access Free, Basic, and Pro content. Upgrade to Enterprise for the rest.'
                      : userTier === 'basic'
                        ? 'You can access Free and Basic content. Upgrade to Pro for advanced features.'
                        : "You're on the Free tier. Subscribe to unlock paid features."}
                </p>
              </div>
              <Link
                href={userTier === 'free' ? '/pricing' : '/account'}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200"
              >
                {userTier === 'free' ? 'Subscribe' : 'Manage subscription'}
              </Link>
            </div>
          )}
        </div>

        {/* Pattern 1 — Section gates */}
        <section className="mb-12">
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-xl font-bold text-gray-900">Pattern 1 · Section gates</h2>
            <code className="text-xs text-gray-500">&lt;Gate tier=&quot;...&quot;&gt;</code>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Each section&apos;s body is wrapped in <code>&lt;Gate&gt;</code>. Locked sections render an
            inline upgrade row instead of the bullet list.
          </p>

          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const unlocked = meetsTier(userTier, section.tier);
              return (
                <article
                  key={section.tier}
                  className={`rounded-xl border shadow-sm p-6 transition ${
                    unlocked ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-300'
                  }`}
                >
                  <header className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div>
                      <h3 className={`text-lg font-semibold ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {unlocked ? '🔓' : '🔒'} {section.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
                    </div>
                    <TierPill tier={section.tier} active={unlocked} />
                  </header>

                  <Gate
                    tier={section.tier}
                    userTier={userTier}
                    fallback={<InlineUpgrade tier={section.tier} />}
                  >
                    <ul className="mt-3 space-y-1.5 text-gray-800">
                      {section.body.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </Gate>
                </article>
              );
            })}
          </div>
        </section>

        {/* Pattern 2 — Soft paywall */}
        <section className="mb-12">
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-xl font-bold text-gray-900">Pattern 2 · Soft paywall</h2>
            <code className="text-xs text-gray-500">&lt;Paywall tier=&quot;pro&quot; preview={'{...}'}&gt;</code>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Long-form content with a public preview. Below the fold is paid-only. This is the
            classic NYT pattern.
          </p>

          <article className="rounded-xl border border-gray-200 bg-white shadow-sm p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              The four phases of shipping a feature
            </h3>
            <p className="text-xs text-gray-500 mb-6">5 min read · Pro members</p>

            <Paywall
              tier="pro"
              userTier={userTier}
              preview={
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    Every feature you ship goes through four phases. Most teams compress them into
                    one chaotic blob and wonder why deadlines slip.
                  </p>
                  <p>
                    The four phases are: <em>clarify, sketch, build, tighten</em>. Each has a
                    different goal and a different failure mode. Skipping any one of them is the
                    single most common reason features ship late or wrong.
                  </p>
                </div>
              }
            >
              <div className="prose prose-sm max-w-none text-gray-700 mt-4">
                <h4>Phase 1 · Clarify</h4>
                <p>
                  Spend the first day asking what problem you&apos;re actually solving. Don&apos;t
                  write code. Don&apos;t draw mocks. Just write the smallest description of the
                  user pain that would tell you the feature shipped.
                </p>
                <h4>Phase 2 · Sketch</h4>
                <p>
                  Draw the simplest version that could plausibly work. Skeleton routes, fake data,
                  empty UI states. Resist the urge to optimize before you can see the full path…
                </p>
                <p className="text-gray-500 italic">
                  (Full article continues for Pro members. Replace this demo content with your
                  real article body.)
                </p>
              </div>
            </Paywall>
          </article>
        </section>

        {/* Pattern 3 — Silent feature gating */}
        <section className="mb-12">
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-xl font-bold text-gray-900">Pattern 3 · Silent feature gating</h2>
            <code className="text-xs text-gray-500">&lt;Gate fallback={'{null}'}&gt;</code>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            For buttons / menu items that should be invisible (not just disabled) when locked. Free
            users won&apos;t even see them in the page source.
          </p>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <p className="text-sm font-medium text-gray-900 mb-3">Available actions</p>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-900 text-sm font-medium hover:bg-gray-200">
                Export CSV (everyone)
              </button>
              <Gate tier="pro" userTier={userTier} fallback={null}>
                <button className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200">
                  ⭐ Bulk import (Pro)
                </button>
              </Gate>
              <Gate tier="enterprise" userTier={userTier} fallback={null}>
                <button className="px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200">
                  🏆 SSO settings (Enterprise)
                </button>
              </Gate>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Tip: silent gating still requires server-side enforcement on the corresponding action.
            </p>
          </div>
        </section>

        {/* Debug panel */}
        <details className="mt-10 p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-700">
          <summary className="cursor-pointer font-medium text-gray-900">Debug: subscription state</summary>
          <pre className="mt-3 bg-gray-50 p-3 rounded overflow-x-auto text-xs">
{JSON.stringify(
  {
    signedIn: !!userId,
    userId,
    activeSubscription: isActive,
    userTier,
    tierOrder: TIERS,
    plan_name: subscription?.plan_name,
    price_id: subscription?.price_id,
    product_id: subscription?.product_id,
    status: subscription?.status,
  },
  null,
  2
)}
          </pre>
        </details>
      </div>

      <Footer />
    </main>
  );
}
