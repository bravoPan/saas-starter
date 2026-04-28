import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Navbar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';
import { listRecentFeedback, type FeedbackEntry } from '@/app/lib/feedback';
import FeedbackForm from './FeedbackForm';

export const dynamic = 'force-dynamic';

function timeAgo(iso: string): string {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function FeedbackItem({ entry }: { entry: FeedbackEntry }) {
  const initial = (entry.display_name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {entry.display_name ?? 'Anonymous'}
          </span>
          <span className="text-xs text-gray-500">{timeAgo(entry.created_at)}</span>
        </div>
        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
          {entry.message}
        </p>
      </div>
    </li>
  );
}

export default async function FeedbackPage() {
  const entries = await listRecentFeedback(20);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
        <p className="text-gray-600 mt-1">
          Share what you&apos;d like to see next. Recent posts are public.
        </p>

        <section className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SignedIn>
            <FeedbackForm />
          </SignedIn>
          <SignedOut>
            <div className="text-center py-2">
              <p className="text-sm text-gray-600 mb-3">Sign in to post feedback.</p>
              <SignInButton mode="modal">
                <button className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </SignedOut>
        </section>

        <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Recent posts</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">No posts yet — be the first.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <FeedbackItem key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-xs text-gray-400 mt-8">
          Looking for billing?{' '}
          <Link href="/account" className="underline hover:text-gray-600">
            Manage your subscription
          </Link>
          .
        </p>
      </div>

      <Footer />
    </main>
  );
}
