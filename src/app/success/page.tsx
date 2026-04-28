import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { getStripe } from '@/app/lib/stripe';
import { syncSubscriptionFromStripe } from '@/app/lib/subscription';

export const dynamic = 'force-dynamic';

type SearchParams = { session_id?: string };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await auth();
  const { session_id } = await searchParams;

  // Best-effort sync — webhooks are the source of truth, but this gives the user
  // immediate confirmation if they land here before the webhook fires.
  if (userId && session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription'],
      });
      const sub = session.subscription;
      if (sub && typeof sub !== 'string') {
        await syncSubscriptionFromStripe(sub);
      }
    } catch (err) {
      console.error('success page sync failed (will rely on webhook):', err);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment successful</h1>
        <p className="text-gray-600 mt-2">
          Thank you for subscribing! Your subscription is being activated and a confirmation email is on its way.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-white font-medium shadow-sm hover:bg-primary/90 transition"
          >
            Go to my account
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
