/**
 * Plan tiers — single source of truth for subscription gating.
 *
 * The tier of a subscription comes from the Stripe Product's `metadata.tier`
 * field (set in the Stripe Dashboard). Allowed values: 'basic' | 'pro' | 'enterprise'.
 * If a product has no `tier` metadata, we default to 'basic'.
 */

/**
 * 'free'  — signed-in user without an active subscription. Default for any logged-in user.
 * 'basic' — paid plan, lowest paid tier. Default fallback for paid subs missing metadata.
 * 'pro'
 * 'enterprise'
 *
 * Anonymous (signed-out) users are represented as `null`, NOT 'free' — they have no
 * identity to attach role/preferences to. If a caller wants to treat anon == free, do
 * `userTier ?? 'free'` at the call site.
 */
export const TIERS = ['free', 'basic', 'pro', 'enterprise'] as const;
export type Tier = (typeof TIERS)[number];

/** Paid tiers only. Useful when validating values that came from a Stripe Product. */
export const PAID_TIERS = ['basic', 'pro', 'enterprise'] as const;
export type PaidTier = (typeof PAID_TIERS)[number];

export const TIER_LEVEL: Record<Tier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};

export const TIER_LABEL: Record<Tier, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export const TIER_ICON: Record<Tier, string> = {
  free: '🐾',
  basic: '🚀',
  pro: '⭐',
  enterprise: '🏆',
};

export function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIERS as readonly string[]).includes(value);
}

export function isPaidTier(value: unknown): value is PaidTier {
  return typeof value === 'string' && (PAID_TIERS as readonly string[]).includes(value);
}

/**
 * Best-effort cast for tier values coming out of Stripe Product metadata. Stripe products
 * should never be 'free' (free users have no subscription row), so unknown/missing values
 * fall back to 'basic' — the safest minimum for a paid customer.
 */
export function coerceTier(value: unknown): PaidTier {
  return isPaidTier(value) ? value : 'basic';
}

/**
 * Does `userTier` meet the requirement of at least `requiredTier`?
 * e.g. enterprise user passes a `pro` gate; basic user does not.
 */
export function meetsTier(userTier: Tier | null | undefined, requiredTier: Tier): boolean {
  if (!userTier) return false;
  return TIER_LEVEL[userTier] >= TIER_LEVEL[requiredTier];
}
