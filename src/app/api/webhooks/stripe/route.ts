import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/app/lib/stripe';
import { syncSubscriptionFromStripe } from '@/app/lib/subscription';

export const runtime = 'nodejs';
// Stripe needs the raw body for signature verification — opt out of any caching/parsing.
export const dynamic = 'force-dynamic';

const RELEVANT_EVENTS = new Set<Stripe.Event['type']>([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing stripe-signature or STRIPE_WEBHOOK_SECRET' },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Stripe webhook signature failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subId =
            typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          await syncSubscriptionFromStripe(subscription);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subId =
            typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          await syncSubscriptionFromStripe(subscription);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, err);
    return NextResponse.json(
      { error: 'Webhook handler failed. Stripe will retry.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
