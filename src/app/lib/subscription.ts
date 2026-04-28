import 'server-only';
import type Stripe from 'stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getStripe } from './stripe';
import { getSupabaseAdmin } from './supabase/admin';
import { coerceTier, type Tier } from './plans';

export type SubscriptionRow = {
  id: string;
  user_id: string;
  status: string;
  price_id: string | null;
  product_id: string | null;
  plan_name: string | null;
  tier: Tier;
  quantity: number | null;
  cancel_at_period_end: boolean | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
};

export const ACTIVE_STATUSES = ['active', 'trialing'] as const;
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

export function isActiveStatus(status: string | null | undefined): status is ActiveStatus {
  return !!status && (ACTIVE_STATUSES as readonly string[]).includes(status);
}

/**
 * Insert/update a `profiles` row, ensuring the Clerk user exists in our DB.
 * Idempotent — safe to call on every privileged request that needs a profile.
 */
export async function upsertProfileFromClerk(params: {
  userId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('profiles').upsert(
    {
      id: params.userId,
      email: params.email ?? null,
      first_name: params.firstName ?? null,
      last_name: params.lastName ?? null,
      image_url: params.imageUrl ?? null,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`upsertProfileFromClerk failed: ${error.message}`);
}

/**
 * Get (or create) the Stripe customer for a Clerk user, persisting the id to `profiles`.
 */
export async function getOrCreateStripeCustomerId(params: {
  userId: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: readErr } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', params.userId)
    .maybeSingle();
  if (readErr) throw new Error(`profiles read failed: ${readErr.message}`);

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name ?? undefined,
    metadata: { clerk_user_id: params.userId },
  });

  const { error: writeErr } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', params.userId);
  if (writeErr) throw new Error(`profiles update failed: ${writeErr.message}`);

  return customer.id;
}

function tsToIso(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

/**
 * Persist a Stripe subscription into `subscriptions`, resolving the user via the customer id.
 */
export async function syncSubscriptionFromStripe(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseAdmin();

  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  const { data: profile, error: lookupErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (lookupErr) throw new Error(`profile lookup failed: ${lookupErr.message}`);
  if (!profile) {
    throw new Error(`No profile found for stripe customer ${customerId}`);
  }

  const item = subscription.items.data[0];
  const productId = typeof item?.price.product === 'string' ? item.price.product : null;

  // Resolve human-readable plan name + tier from the Stripe Product. The product's
  // `metadata.tier` ('basic' | 'pro' | 'enterprise') is the source of truth for gating.
  let planName: string | null = null;
  let tier: Tier = 'basic';
  if (productId) {
    try {
      const stripe = getStripe();
      const product = await stripe.products.retrieve(productId);
      planName = product.name ?? null;
      tier = coerceTier(product.metadata?.tier);
    } catch (err) {
      console.error(`Failed to retrieve Stripe product ${productId}:`, err);
    }
  }

  const row = {
    id: subscription.id,
    user_id: profile.id,
    status: subscription.status,
    price_id: item?.price.id ?? null,
    product_id: productId,
    plan_name: planName,
    tier,
    quantity: item?.quantity ?? 1,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: tsToIso(subscription.current_period_start),
    current_period_end: tsToIso(subscription.current_period_end),
    cancel_at: tsToIso(subscription.cancel_at),
    canceled_at: tsToIso(subscription.canceled_at),
    trial_start: tsToIso(subscription.trial_start),
    trial_end: tsToIso(subscription.trial_end),
  };

  const { error } = await supabase.from('subscriptions').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);
}

/**
 * Get the most relevant subscription row for a user (prefer active/trialing, then most recent).
 *
 * Resilient by design: if Supabase isn't reachable / configured (e.g. missing env vars
 * in a preview deploy), we log and return null instead of crashing the page.
 */
export async function getSubscriptionForUser(userId: string): Promise<SubscriptionRow | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('current_period_end', { ascending: false })
      .limit(10);

    if (error) {
      console.error('getSubscriptionForUser:', error);
      return null;
    }
    if (!data || data.length === 0) return null;

    const active = data.find((row) => isActiveStatus(row.status));
    return (active ?? data[0]) as SubscriptionRow;
  } catch (err) {
    console.error('getSubscriptionForUser threw:', err);
    return null;
  }
}

/**
 * Convenience helper for server components / route handlers.
 * Returns the subscription row of the *currently signed-in* user, or null.
 *
 * Resilient: never throws — page rendering shouldn't depend on Supabase being healthy.
 */
export async function getCurrentUserSubscription(): Promise<SubscriptionRow | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    return await getSubscriptionForUser(userId);
  } catch (err) {
    console.error('getCurrentUserSubscription threw:', err);
    return null;
  }
}

/**
 * Boolean shortcut: is the current Clerk user on an active or trialing subscription?
 * Returns false on any failure (mis-configured deploy, network blip, etc.) — caller
 * decides whether to gate features. Never throws.
 */
export async function currentUserHasActiveSubscription(): Promise<boolean> {
  try {
    const sub = await getCurrentUserSubscription();
    return isActiveStatus(sub?.status);
  } catch {
    return false;
  }
}

/**
 * Returns the current user's effective tier:
 *   - `null`         — anonymous (not signed in)
 *   - `'free'`       — signed in, no active subscription
 *   - `'basic' | 'pro' | 'enterprise'` — signed in with an active/trialing sub
 *
 * Callers who want to treat anonymous == free can write `(await getCurrentUserTier()) ?? 'free'`.
 */
export async function getCurrentUserTier(): Promise<Tier | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const sub = await getSubscriptionForUser(userId);
    if (!sub || !isActiveStatus(sub.status)) return 'free';
    return sub.tier ?? 'basic';
  } catch (err) {
    console.error('getCurrentUserTier threw:', err);
    return null;
  }
}

/**
 * Pull the Clerk user's primary email + display name. Used during checkout.
 */
export async function getClerkUserContact(): Promise<{
  userId: string;
  email: string;
  name: string | null;
} | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if (!user) return null;
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;
  if (!email) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
  return { userId, email, name };
}
