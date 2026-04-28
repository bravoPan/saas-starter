import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/app/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 });
  }

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(secret);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Clerk webhook verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const data = event.data;
        const email =
          data.email_addresses.find((e) => e.id === data.primary_email_address_id)?.email_address ??
          data.email_addresses[0]?.email_address ??
          null;

        const { error } = await supabase.from('profiles').upsert(
          {
            id: data.id,
            email,
            first_name: data.first_name ?? null,
            last_name: data.last_name ?? null,
            image_url: data.image_url ?? null,
          },
          { onConflict: 'id' }
        );
        if (error) throw error;
        break;
      }
      case 'user.deleted': {
        if (!event.data.id) break;
        const { error } = await supabase.from('profiles').delete().eq('id', event.data.id);
        if (error) throw error;
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Clerk webhook handler failed for ${event.type}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
