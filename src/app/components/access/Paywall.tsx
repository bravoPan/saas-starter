import 'server-only';
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';
import { getCurrentUserTier } from '@/app/lib/subscription';
import { meetsTier, TIER_ICON, TIER_LABEL, type Tier } from '@/app/lib/plans';

type PaywallProps = {
  /** Minimum tier required to read the locked body. */
  tier: Tier;
  /** Always-visible preview shown above the paywall. */
  preview: ReactNode;
  /** Locked body — only rendered when the viewer meets `tier`. */
  children: ReactNode;
  /** Pre-resolved tier; pass when the parent already fetched it. */
  userTier?: Tier | null;
};

/**
 * "Soft paywall" pattern for long-form content. Renders `preview` to everyone, and
 * either the full `children` (when access granted) or an upsell card (when not).
 *
 *   <Paywall tier="pro" preview={<FreeIntro />}>
 *     <FullArticle />
 *   </Paywall>
 */
export default async function Paywall({
  tier,
  preview,
  children,
  userTier,
}: PaywallProps): Promise<ReactElement> {
  const resolved = userTier === undefined ? await getCurrentUserTier() : userTier;
  const allowed = meetsTier(resolved, tier);

  return (
    <>
      {preview}
      {allowed ? children : <PaywallBlock requiredTier={tier} userTier={resolved} />}
    </>
  );
}

function PaywallBlock({ requiredTier, userTier }: { requiredTier: Tier; userTier: Tier | null }) {
  const isAnon = userTier === null;
  return (
    <div className="not-prose relative my-8">
      <div className="pointer-events-none h-24 -mt-24 bg-gradient-to-b from-transparent to-white" />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center">
        <div className="text-4xl mb-3">{TIER_ICON[requiredTier]}</div>
        <h3 className="text-xl font-bold text-gray-900">
          Continue reading with {TIER_LABEL[requiredTier]}
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          {isAnon
            ? 'Sign in and subscribe to unlock the rest of this article and the entire premium library.'
            : `Upgrade to ${TIER_LABEL[requiredTier]} to finish this article and unlock all ${TIER_LABEL[requiredTier]} content.`}
        </p>
        <Link
          href="/pricing"
          className="mt-5 inline-flex items-center px-6 py-2.5 rounded-lg bg-primary text-white font-medium shadow-sm hover:bg-primary/90 transition"
        >
          {isAnon ? 'View plans' : `Upgrade to ${TIER_LABEL[requiredTier]}`}
        </Link>
        <p className="mt-3 text-xs text-gray-400">Cancel anytime.</p>
      </div>
    </div>
  );
}
