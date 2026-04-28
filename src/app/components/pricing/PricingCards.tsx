'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';
import { FiCheck, FiArrowRight } from 'react-icons/fi';

type Plan = {
  id: 'basic' | 'pro' | 'enterprise';
  name: string;
  price: string;
  description: string;
  features: string[];
  isRecommended?: boolean;
  /**
   * Stripe Price ID. Replace these placeholders with the IDs from your
   * Stripe dashboard (Products → click product → copy "API ID" of a price).
   * See README "Stripe setup" for full walkthrough.
   */
  priceId: string;
};

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9',
    description: 'For solo founders getting started.',
    features: ['Core features', 'Up to 1,000 records', 'Email support', 'Community access'],
    // TODO: replace with your Stripe Price ID
    priceId: 'price_REPLACE_ME_BASIC',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    description: 'For growing teams that need more.',
    features: [
      'Everything in Basic',
      'Up to 50,000 records',
      'Priority support',
      'Advanced analytics',
      'Team collaboration',
    ],
    isRecommended: true,
    // TODO: replace with your Stripe Price ID
    priceId: 'price_REPLACE_ME_PRO',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    description: 'For organizations that need scale.',
    features: [
      'Everything in Pro',
      'Unlimited records',
      '24/7 dedicated support',
      'SSO & audit logs',
      'Custom integrations',
      'SLA',
    ],
    // TODO: replace with your Stripe Price ID
    priceId: 'price_REPLACE_ME_ENTERPRISE',
  },
];

type PricingCardsProps = {
  /** Stripe price id of the user's current active/trialing subscription, if any. */
  currentPriceId?: string | null;
  /** Whether the visitor has an active subscription (any plan). */
  hasActiveSubscription?: boolean;
};

export default function PricingCards({
  currentPriceId = null,
  hasActiveSubscription = false,
}: PricingCardsProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const isPlaceholder = (priceId: string) => priceId.startsWith('price_REPLACE_ME');

  const handleCheckout = async (priceId: string) => {
    if (!isLoaded) return;
    if (isPlaceholder(priceId)) {
      alert(
        'Stripe Price ID is still a placeholder. Open src/app/components/pricing/PricingCards.tsx and paste your real Price IDs from the Stripe dashboard. (See README → Stripe setup.)'
      );
      return;
    }
    if (!isSignedIn) {
      openSignIn({ redirectUrl: '/pricing' });
      return;
    }

    if (hasActiveSubscription) {
      setLoadingPlanId(priceId);
      try {
        const res = await fetch('/api/create-portal-session', { method: 'POST' });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          alert(data.error ?? 'Failed to open billing portal');
          return;
        }
        window.location.href = data.url;
      } finally {
        setLoadingPlanId(null);
      }
      return;
    }

    setLoadingPlanId(priceId);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Failed to create checkout');
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const ctaLabel = (planPriceId: string) => {
    if (isPlaceholder(planPriceId)) return 'Set Stripe Price ID';
    if (loadingPlanId === planPriceId) return 'Loading...';
    if (currentPriceId === planPriceId) return 'Current plan';
    if (hasActiveSubscription) return 'Switch plan';
    if (!isSignedIn) return 'Sign in to subscribe';
    return 'Subscribe';
  };

  return (
    <div className="my-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple pricing</h1>
        <p className="text-lg text-gray-600">Pick the plan that fits. Change or cancel anytime.</p>
        {hasActiveSubscription && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            You have an active subscription —{' '}
            <button
              onClick={() => router.push('/account')}
              className="underline font-medium hover:text-green-800"
            >
              manage it
            </button>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPriceId === plan.priceId;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-white rounded-2xl border transition-all duration-300 ${
                plan.isRecommended
                  ? 'border-primary shadow-xl md:scale-105 z-10'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.isRecommended && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Your Plan
                </div>
              )}

              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-gray-500 ml-1">/ month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm">
                      <FiCheck className="text-primary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={loadingPlanId !== null || !isLoaded}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition ${
                    isCurrent
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : plan.isRecommended
                        ? 'bg-primary text-white hover:bg-primary-700 shadow-sm'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } ${loadingPlanId === plan.priceId ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {ctaLabel(plan.priceId)}
                  {!isPlaceholder(plan.priceId) && <FiArrowRight className="ml-2" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">
        30-day money-back guarantee. No questions asked.
      </p>
    </div>
  );
}
