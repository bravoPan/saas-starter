import 'server-only';
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';
import { getCurrentUserTier } from '@/app/lib/subscription';
import { meetsTier, TIER_ICON, TIER_LABEL, type Tier } from '@/app/lib/plans';

type GateProps = {
  /** Minimum tier required to render `children`. */
  tier: Tier;
  /** The protected content. */
  children: ReactNode;
  /**
   * What to render when access is denied. Defaults to a built-in upsell card.
   * Pass `null` to render nothing (silent hide).
   */
  fallback?: ReactNode;
  /** Pre-resolved tier — pass when the parent already fetched it to avoid a second DB roundtrip. */
  userTier?: Tier | null;
};

/**
 * Server component that conditionally renders its children based on the viewer's tier.
 *
 *   <Gate tier="pro">
 *     <SystemDesignVideo />
 *   </Gate>
 *
 * Anonymous viewers (`null`) are always denied. To treat anon == free, pass `userTier={tier ?? 'free'}`.
 *
 * Return type is explicitly `ReactElement | null` — wider types like `ReactNode` cause
 * the async-component / `AwaitedReactNode` mismatch that breaks `next build`.
 */
export default async function Gate({
  tier,
  children,
  fallback,
  userTier,
}: GateProps): Promise<ReactElement | null> {
  const resolved = userTier === undefined ? await getCurrentUserTier() : userTier;
  if (meetsTier(resolved, tier)) return <>{children}</>;
  if (fallback === null) return null;
  return <>{fallback ?? <UpsellCard requiredTier={tier} userTier={resolved} />}</>;
}

function UpsellCard({
  requiredTier,
  userTier,
}: {
  requiredTier: Tier;
  userTier: Tier | null;
}) {
  const isAnon = userTier === null;
  return (
    <div className="not-prose my-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <div className="text-3xl mb-2">{TIER_ICON[requiredTier]} 🔒</div>
      <p className="font-semibold text-gray-900">
        Requires {TIER_LABEL[requiredTier]}
      </p>
      <p className="mt-1 text-sm text-gray-600">
        {isAnon
          ? 'Sign in and subscribe to unlock this content.'
          : `Upgrade your plan to view ${TIER_LABEL[requiredTier]} content.`}
      </p>
      <Link
        href="/pricing"
        className="mt-4 inline-flex items-center px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition"
      >
        See plans
      </Link>
    </div>
  );
}
