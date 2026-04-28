import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Lightweight connectivity probe. Returns 200 with row counts when Supabase is reachable
 * and the service-role key is valid. Returns 500 with the error message otherwise.
 *
 * Usage:
 *   curl -s http://localhost:3000/api/health/supabase | jq
 */
export async function GET() {
  const start = Date.now();
  try {
    const supabase = getSupabaseAdmin();

    const [profiles, subscriptions, feedback] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
      supabase.from('feedback_entries').select('id', { count: 'exact', head: true }),
    ]);

    const firstError = profiles.error ?? subscriptions.error ?? feedback.error;
    if (firstError) {
      return NextResponse.json(
        { ok: false, error: firstError.message, latency_ms: Date.now() - start },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      latency_ms: Date.now() - start,
      counts: {
        profiles: profiles.count ?? 0,
        subscriptions: subscriptions.count ?? 0,
        feedback_entries: feedback.count ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json(
      { ok: false, error: message, latency_ms: Date.now() - start },
      { status: 500 }
    );
  }
}
