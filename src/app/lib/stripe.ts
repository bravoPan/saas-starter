import Stripe from 'stripe';

let cached: Stripe | null = null;

/**
 * Server-only Stripe singleton.
 *
 * We intentionally don't pin `apiVersion` — letting the installed SDK pick its
 * default avoids the "Type ... not assignable to ..." error every time Stripe
 * publishes a new API version and bumps the SDK. If you need to pin for
 * deterministic billing behavior, set it here AND keep it in lockstep with the
 * `stripe` package version.
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing env STRIPE_SECRET_KEY');
  cached = new Stripe(key, { typescript: true });
  return cached;
}
