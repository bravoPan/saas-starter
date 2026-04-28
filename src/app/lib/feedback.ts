import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/app/lib/supabase/admin';
import { upsertProfileFromClerk } from '@/app/lib/subscription';

export type FeedbackEntry = {
  id: string;
  user_id: string;
  display_name: string | null;
  message: string;
  created_at: string;
};

/** Public read — used by the server-rendered `/feedback` page. */
export async function listRecentFeedback(limit = 20): Promise<FeedbackEntry[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('feedback_entries')
      .select('id, user_id, display_name, message, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('listRecentFeedback:', error);
      return [];
    }
    return (data ?? []) as FeedbackEntry[];
  } catch (err) {
    console.error('listRecentFeedback threw:', err);
    return [];
  }
}

export type SubmitResult =
  | { ok: true; entry: FeedbackEntry }
  | { ok: false; error: string };

const MIN_INTERVAL_MS = 60_000;
const MAX_LEN = 280;

/**
 * Insert a feedback entry on behalf of the currently signed-in Clerk user.
 *
 * Auth happens at the application layer (Clerk), so writes go through the service-role
 * client and bypass RLS. The function:
 *   1. confirms the user is signed in,
 *   2. trims + length-checks the message,
 *   3. enforces a 1-minute rate limit per user,
 *   4. snapshots the user's display name from Clerk so the feed survives renames,
 *   5. ensures the FK to `profiles` is satisfied (upserts the profile if missing).
 */
export async function submitFeedback(rawMessage: string): Promise<SubmitResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'You must be signed in to post feedback.' };

  const message = (rawMessage ?? '').trim();
  if (message.length === 0) return { ok: false, error: 'Message cannot be empty.' };
  if (message.length > MAX_LEN) {
    return { ok: false, error: `Message is too long (max ${MAX_LEN} characters).` };
  }

  const supabase = getSupabaseAdmin();

  const { data: latest, error: latestErr } = await supabase
    .from('feedback_entries')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr) {
    console.error('submitFeedback rate-limit lookup:', latestErr);
    return { ok: false, error: 'Could not verify your last post. Try again in a moment.' };
  }
  if (latest) {
    const elapsed = Date.now() - new Date(latest.created_at).getTime();
    if (elapsed < MIN_INTERVAL_MS) {
      const wait = Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000);
      return { ok: false, error: `Please wait ${wait}s before posting again.` };
    }
  }

  const user = await currentUser().catch(() => null);
  const email =
    user?.emailAddresses.find((e) => e.id === user?.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    null;
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    email?.split('@')[0] ||
    'Anonymous';

  try {
    await upsertProfileFromClerk({
      userId,
      email,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      imageUrl: user?.imageUrl ?? null,
    });
  } catch (err) {
    console.error('submitFeedback profile upsert:', err);
    return { ok: false, error: 'Could not link your profile. Please try again.' };
  }

  const { data, error } = await supabase
    .from('feedback_entries')
    .insert({ user_id: userId, display_name: displayName, message })
    .select('id, user_id, display_name, message, created_at')
    .single();

  if (error || !data) {
    console.error('submitFeedback insert:', error);
    return { ok: false, error: 'Could not save your feedback. Please try again.' };
  }

  return { ok: true, entry: data as FeedbackEntry };
}
