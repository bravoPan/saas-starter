import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import Navbar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';
import {
  getSubscriptionForUser,
  isActiveStatus,
} from '@/app/lib/subscription';
import { TIER_ICON, TIER_LABEL, type Tier } from '@/app/lib/plans';
import ManageSubscriptionButton from './ManageSubscriptionButton';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const active = isActiveStatus(status);
  const tone = active
    ? 'bg-green-100 text-green-700 border-green-200'
    : status === 'past_due' || status === 'unpaid'
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tone}`}>
      {status}
    </span>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const tone =
    tier === 'enterprise'
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : tier === 'pro'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${tone}`}>
      <span>{TIER_ICON[tier]}</span>
      {TIER_LABEL[tier]}
    </span>
  );
}

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const [user, subscription] = await Promise.all([
    currentUser().catch((err) => {
      console.error('currentUser() failed:', err);
      return null;
    }),
    getSubscriptionForUser(userId),
  ]);
  const active = isActiveStatus(subscription?.status);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900">Account</h1>
        <p className="text-gray-600 mt-1">Manage your profile and subscription.</p>

        {/* Profile */}
        <section className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-4 text-sm">
            <dt className="text-gray-500">Name</dt>
            <dd className="sm:col-span-2 text-gray-900">
              {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'}
            </dd>
            <dt className="text-gray-500">Email</dt>
            <dd className="sm:col-span-2 text-gray-900">
              {user?.emailAddresses.find((e) => e.id === user?.primaryEmailAddressId)?.emailAddress ?? '—'}
            </dd>
            <dt className="text-gray-500">User ID</dt>
            <dd className="sm:col-span-2 font-mono text-gray-600 break-all">{userId}</dd>
          </dl>
        </section>

        {/* Subscription */}
        <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
            {subscription && <StatusBadge status={subscription.status} />}
          </div>

          {!subscription ? (
            <div className="mt-4">
              <p className="text-gray-600">You don&apos;t have an active subscription yet.</p>
              <Link
                href="/pricing"
                className="mt-4 inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-white font-medium shadow-sm hover:bg-primary/90 transition"
              >
                View plans
              </Link>
            </div>
          ) : (
            <>
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-4 text-sm">
                <dt className="text-gray-500">Plan</dt>
                <dd className="sm:col-span-2 text-gray-900 flex items-center gap-2 flex-wrap">
                  <span className="font-medium">
                    {subscription.plan_name || TIER_LABEL[subscription.tier] || 'Subscription'}
                  </span>
                  <TierBadge tier={subscription.tier} />
                </dd>
                <dt className="text-gray-500">Renews</dt>
                <dd className="sm:col-span-2 text-gray-900">
                  {subscription.cancel_at_period_end ? 'Cancels on ' : 'Renews on '}
                  {formatDate(subscription.current_period_end)}
                </dd>
                {subscription.canceled_at && (
                  <>
                    <dt className="text-gray-500">Canceled at</dt>
                    <dd className="sm:col-span-2 text-gray-900">{formatDate(subscription.canceled_at)}</dd>
                  </>
                )}
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <ManageSubscriptionButton />
                <Link
                  href="/premium"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition"
                >
                  Try premium content
                </Link>
                {!active && (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition"
                  >
                    See plans
                  </Link>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}
