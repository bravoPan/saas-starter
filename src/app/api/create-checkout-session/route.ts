import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripe } from '@/app/lib/stripe';
import {
  getClerkUserContact,
  getOrCreateStripeCustomerId,
  upsertProfileFromClerk,
} from '@/app/lib/subscription';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = (await request.json()) as { priceId?: string };
    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const contact = await getClerkUserContact();
    if (!contact) {
      return NextResponse.json({ error: 'Could not load user profile' }, { status: 400 });
    }

    // Make sure we have a profile row before linking a Stripe customer to it.
    await upsertProfileFromClerk({
      userId: contact.userId,
      email: contact.email,
      firstName: contact.name?.split(' ')[0] ?? null,
      lastName: contact.name?.split(' ').slice(1).join(' ') || null,
    });

    const customerId = await getOrCreateStripeCustomerId({
      userId: contact.userId,
      email: contact.email,
      name: contact.name,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      client_reference_id: contact.userId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { clerk_user_id: contact.userId },
      },
      metadata: { clerk_user_id: contact.userId },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('create-checkout-session error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
