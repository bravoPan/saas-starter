import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUserTier } from '@/app/lib/subscription';
import { meetsTier, type Tier } from '@/app/lib/plans';

type RequireTierOptions = {
  /**
   * Where to send users who don't meet the tier. Defaults to '/pricing' with a
   * `?from=...` query param so the destination page can show context.
   */
  redirectTo?: string;
  /** Where to send anonymous (signed-out) users. Defaults to '/pricing'. */
  signedOutRedirect?: string;
};

/**
 * Server-side guard for protecting an entire page. Throws via `redirect()` if the
 * current viewer doesn't meet the required tier; returns the resolved tier on success
 * so the page can use it without a second roundtrip.
 *
 *   export default async function Page() {
 *     const tier = await requireTier('pro');
 *     return <SystemDesignArticle />;
 *   }
 */
export async function requireTier(
  required: Tier,
  options: RequireTierOptions = {}
): Promise<Tier> {
  const tier = await getCurrentUserTier();
  if (meetsTier(tier, required)) return tier!;
  const target = tier === null ? (options.signedOutRedirect ?? '/pricing') : (options.redirectTo ?? `/pricing?need=${required}`);
  redirect(target);
}
