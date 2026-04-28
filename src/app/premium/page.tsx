import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import NavBar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';
import Gate from '@/app/components/access/Gate';
import Paywall from '@/app/components/access/Paywall';
import { TIERS, TIER_ICON, TIER_LABEL, type Tier, meetsTier } from '@/app/lib/plans';
import {
  getCurrentUserSubscription,
  isActiveStatus,
} from '@/app/lib/subscription';
import { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Premium — Access patterns showcase',
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable doc UI primitives
// ─────────────────────────────────────────────────────────────────────────────

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs leading-relaxed overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

function PatternCard({
  index,
  title,
  api,
  oneLiner,
  useWhen,
  dontUseWhen,
  code,
  liveDemo,
  visibility,
}: {
  index: number;
  title: string;
  api: string;
  oneLiner: string;
  useWhen: string[];
  dontUseWhen: string[];
  code: string;
  liveDemo: ReactNode;
  visibility: Record<'Anonymous' | 'Free' | 'Basic' | 'Pro' | 'Enterprise', string>;
}) {
  return (
    <section className="mb-16 scroll-mt-20" id={`pattern-${index}`}>
      <header className="mb-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-900">
            Pattern {index} · {title}
          </h2>
          <code className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">{api}</code>
        </div>
        <p className="text-gray-600 mt-2">{oneLiner}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-green-100 bg-green-50/50 p-4">
          <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">
            ✓ Use when
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            {useWhen.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
            ✗ Don&apos;t use when
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            {dontUseWhen.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Code</p>
        <CodeBlock>{code}</CodeBlock>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Live demo (you&apos;re viewing this as: <TierTag />)
        </p>
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-1">
          {liveDemo}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          What each viewer sees
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Viewer</th>
                <th className="text-left px-3 py-2 font-medium">Renders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(Object.keys(visibility) as Array<keyof typeof visibility>).map((viewer) => (
                <tr key={viewer}>
                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                    {viewer}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{visibility[viewer]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// Server component that just renders the current viewer's tier as a small tag.
async function TierTag() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        Anonymous
      </span>
    );
  }
  const subscription = await getCurrentUserSubscription();
  const tier: Tier = isActiveStatus(subscription?.status)
    ? subscription?.tier ?? 'basic'
    : 'free';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
      {TIER_ICON[tier]} {TIER_LABEL[tier]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo content for each pattern (kept tiny on purpose)
// ─────────────────────────────────────────────────────────────────────────────

function InlineUpgrade({ tier }: { tier: Tier }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <p className="text-sm text-gray-600">
        Upgrade to {TIER_LABEL[tier]} to unlock this content.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700"
      >
        Upgrade
      </Link>
    </div>
  );
}

function describeAccess(userTier: Tier | null): string {
  if (userTier === null) return 'Sign in to flip into Free, then subscribe to test paid tiers.';
  switch (userTier) {
    case 'free':
      return 'You see Free content. Subscribe to unlock Basic / Pro / Enterprise.';
    case 'basic':
      return 'You see Free + Basic content. Upgrade to Pro for advanced sections.';
    case 'pro':
      return 'You see Free + Basic + Pro content. Upgrade to Enterprise for the rest.';
    case 'enterprise':
      return 'You see everything below — try signing out to compare.';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function PremiumPage() {
  const { userId } = await auth();
  const subscription = await getCurrentUserSubscription();
  const isActive = isActiveStatus(subscription?.status);
  const userTier: Tier | null = !userId ? null : isActive ? subscription?.tier ?? 'basic' : 'free';

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container py-12 max-w-4xl">
        <header className="mb-10">
          <p className="text-sm font-medium text-primary-700 mb-2">Showcase</p>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Access control patterns
          </h1>
          <p className="text-lg text-gray-600 mt-3 max-w-2xl">
            Four patterns ship with this starter for restricting content by tier. This page is the
            living spec: each pattern includes when to reach for it, the code, a live demo, and
            what every viewer ends up seeing.
          </p>
        </header>

        {/* Current viewer banner */}
        <section className="mb-10 p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                You&apos;re viewing this as
              </p>
              <p className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {!userId ? (
                  <>
                    <span className="text-2xl">🌐</span>
                    Anonymous (signed out)
                  </>
                ) : (
                  <>
                    <span className="text-2xl">{TIER_ICON[userTier!]}</span>
                    {TIER_LABEL[userTier!]}
                  </>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">{describeAccess(userTier)}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={userTier === 'free' || !userId ? '/pricing' : '/account'}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 text-sm"
              >
                {userTier === 'free' || !userId ? 'See plans' : 'Manage subscription'}
              </Link>
            </div>
          </div>
        </section>

        {/* Decision tree */}
        <section className="mb-12 p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Quick decision tree</h2>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Is the entire page paid?</strong> → Use{' '}
              <a href="#pattern-4" className="text-primary-700 underline hover:text-primary">
                <code>requireTier()</code>
              </a>{' '}
              at the top of the page. Redirects unauthorized users to <code>/pricing</code>.
            </li>
            <li>
              <strong>Is one section of the page paid (but the rest is public)?</strong> → Use{' '}
              <a href="#pattern-1" className="text-primary-700 underline hover:text-primary">
                <code>&lt;Gate&gt;</code>
              </a>
              . Shows an upsell card in place of the locked content.
            </li>
            <li>
              <strong>Is it long-form content with a free preview + locked rest?</strong> → Use{' '}
              <a href="#pattern-2" className="text-primary-700 underline hover:text-primary">
                <code>&lt;Paywall&gt;</code>
              </a>
              . The classic newspaper paywall.
            </li>
            <li>
              <strong>
                Is it a button / menu item that should be invisible (not just disabled)?
              </strong>{' '}
              → Use{' '}
              <a href="#pattern-3" className="text-primary-700 underline hover:text-primary">
                <code>&lt;Gate fallback=&#123;null&#125;&gt;</code>
              </a>
              . Renders nothing when locked.
            </li>
          </ol>
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Always remember:</strong> these components hide UI. They are <em>not</em> a
            substitute for server-side authorization on the action they gate. Mutations and data
            fetches still need their own tier checks (see{' '}
            <code>currentUserHasActiveSubscription()</code> and friends in{' '}
            <code>lib/subscription.ts</code>).
          </div>
        </section>

        {/* ───────── Pattern 1: <Gate> ───────── */}
        <PatternCard
          index={1}
          title="Section gate"
          api="<Gate tier=...>"
          oneLiner="Wrap a block of content; show an upsell card when the viewer doesn't qualify."
          useWhen={[
            'A page mixes free and paid sections',
            'You want a clear upsell prompt instead of an empty gap',
            'The locked content is a discrete block (a card, a list, a hero)',
          ]}
          dontUseWhen={[
            'Whole page is paid → use requireTier() instead (Pattern 4)',
            'Locked content is interleaved paragraph-by-paragraph → use <Paywall> (Pattern 2)',
            'It must be invisible when locked (e.g. menu items) → use fallback={null} (Pattern 3)',
          ]}
          code={`import Gate from '@/app/components/access/Gate';

<Gate tier="pro">
  <AdvancedAnalytics />
</Gate>

// Custom fallback (e.g. inline upgrade row instead of full card):
<Gate
  tier="pro"
  fallback={<InlineUpgradeRow />}
>
  <AdvancedAnalytics />
</Gate>`}
          liveDemo={
            <div className="space-y-4 p-4">
              {(['free', 'basic', 'pro', 'enterprise'] as Tier[]).map((tier) => {
                const unlocked = meetsTier(userTier, tier);
                return (
                  <div
                    key={tier}
                    className={`rounded-lg border p-4 ${
                      unlocked
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-dashed border-gray-300'
                    }`}
                  >
                    <header className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {unlocked ? '🔓' : '🔒'} {TIER_LABEL[tier]}-only feature
                      </h3>
                      <code className="text-xs text-gray-500">tier=&quot;{tier}&quot;</code>
                    </header>
                    <Gate
                      tier={tier}
                      userTier={userTier}
                      fallback={<InlineUpgrade tier={tier} />}
                    >
                      <p className="text-sm text-gray-700">
                        ✨ This is the {TIER_LABEL[tier].toLowerCase()}-only payload. Real apps
                        would render charts / videos / data here.
                      </p>
                    </Gate>
                  </div>
                );
              })}
            </div>
          }
          visibility={{
            Anonymous: 'Upsell card on every section (no tier qualifies)',
            Free: 'Free section unlocked, Basic+/Pro/Enterprise show upsell',
            Basic: 'Free + Basic unlocked, Pro/Enterprise show upsell',
            Pro: 'Free + Basic + Pro unlocked, Enterprise shows upsell',
            Enterprise: 'Everything unlocked',
          }}
        />

        {/* ───────── Pattern 2: <Paywall> ───────── */}
        <PatternCard
          index={2}
          title="Soft paywall"
          api="<Paywall tier=... preview=...>"
          oneLiner="Show a free preview, then either the rest of the article or an upgrade CTA — the classic NYT pattern."
          useWhen={[
            'Long-form content where the first few paragraphs hook the reader',
            'You want SEO-friendly preview text crawlable by search engines',
            'The locked portion is contiguous (everything after a fold)',
          ]}
          dontUseWhen={[
            'There is no meaningful preview to show (use <Gate> instead)',
            'You need fine-grained per-paragraph gating (split into multiple <Gate>s)',
          ]}
          code={`import Paywall from '@/app/components/access/Paywall';

<Paywall
  tier="pro"
  preview={
    <>
      <p>First two paragraphs everyone can read…</p>
      <p>This hooks them in.</p>
    </>
  }
>
  <p>Locked: rest of the article.</p>
  <p>Pro members read this.</p>
</Paywall>`}
          liveDemo={
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                The four phases of shipping a feature
              </h3>
              <p className="text-xs text-gray-500 mb-4">5 min read · Pro members</p>
              <Paywall
                tier="pro"
                userTier={userTier}
                preview={
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p>
                      Every feature you ship goes through four phases. Most teams compress them
                      into one chaotic blob and wonder why deadlines slip.
                    </p>
                    <p>
                      The four phases are: <em>clarify, sketch, build, tighten</em>. Each has a
                      different goal and a different failure mode.
                    </p>
                  </div>
                }
              >
                <div className="prose prose-sm max-w-none text-gray-700 mt-2">
                  <h4>Phase 1 · Clarify</h4>
                  <p>
                    Spend the first day asking what problem you&apos;re actually solving. Don&apos;t
                    write code. Don&apos;t draw mocks. Just write the smallest description of the
                    user pain that would tell you the feature shipped.
                  </p>
                  <h4>Phase 2 · Sketch</h4>
                  <p>
                    Draw the simplest version that could plausibly work. Skeleton routes, fake
                    data, empty UI states.
                  </p>
                  <p className="text-gray-500 italic">
                    (Demo content — replace with your real article body.)
                  </p>
                </div>
              </Paywall>
            </div>
          }
          visibility={{
            Anonymous: 'Preview + paywall block with "Sign in & subscribe" CTA',
            Free: 'Preview + paywall block with "Upgrade to Pro" CTA',
            Basic: 'Preview + paywall block with "Upgrade to Pro" CTA',
            Pro: 'Preview + full article body',
            Enterprise: 'Preview + full article body',
          }}
        />

        {/* ───────── Pattern 3: <Gate fallback={null}> ───────── */}
        <PatternCard
          index={3}
          title="Silent feature gating"
          api="<Gate fallback={null}>"
          oneLiner="When the gated thing should be completely invisible (not even rendered) for non-qualifying viewers."
          useWhen={[
            'Buttons, menu items, action chips that don\u2019t belong in the UI for free users',
            'You want to keep the UI uncluttered (no ghosted "Upgrade to use" buttons)',
            'Search engines / non-paying users should not see the feature at all',
          ]}
          dontUseWhen={[
            'You want to advertise the feature to drive upgrades (use <Gate> with default fallback)',
            'The button has critical context the viewer needs (consider showing it disabled instead)',
          ]}
          code={`<div className="flex gap-2">
  <button>Export CSV (everyone)</button>

  <Gate tier="pro" fallback={null}>
    <button>Bulk import (Pro only)</button>
  </Gate>

  <Gate tier="enterprise" fallback={null}>
    <button>SSO settings (Enterprise)</button>
  </Gate>
</div>

// Free users only see "Export CSV" — the other buttons aren't even
// in the rendered HTML.`}
          liveDemo={
            <div className="p-6">
              <p className="text-sm font-medium text-gray-900 mb-3">Available actions</p>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-900 text-sm font-medium hover:bg-gray-200">
                  Export CSV (everyone)
                </button>
                <Gate tier="pro" userTier={userTier} fallback={null}>
                  <button className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200">
                    ⭐ Bulk import (Pro)
                  </button>
                </Gate>
                <Gate tier="enterprise" userTier={userTier} fallback={null}>
                  <button className="px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200">
                    🏆 SSO settings (Enterprise)
                  </button>
                </Gate>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Tip: silent gating still requires server-side enforcement on the corresponding
                action — never trust the client.
              </p>
            </div>
          }
          visibility={{
            Anonymous: 'Only "Export CSV" — Pro/Enterprise buttons not in the DOM',
            Free: 'Only "Export CSV" — Pro/Enterprise buttons not in the DOM',
            Basic: 'Only "Export CSV" — Pro/Enterprise buttons not in the DOM',
            Pro: '"Export CSV" + "Bulk import"',
            Enterprise: 'All three buttons',
          }}
        />

        {/* ───────── Pattern 4: requireTier() ───────── */}
        <section className="mb-16 scroll-mt-20" id="pattern-4">
          <header className="mb-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">
                Pattern 4 · Whole-page guard
              </h2>
              <code className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                requireTier()
              </code>
            </div>
            <p className="text-gray-600 mt-2">
              Server-side helper that redirects the viewer if they don&apos;t qualify. No fallback
              UI — they never see the page.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg border border-green-100 bg-green-50/50 p-4">
              <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">
                ✓ Use when
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• The entire page is paid (e.g. <code>/admin</code>, <code>/dashboard/team</code>)</li>
                <li>• You don&apos;t want a teaser of the page leaking to non-subscribers</li>
                <li>• The page would crash anyway without the data only paid users have access to</li>
              </ul>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                ✗ Don&apos;t use when
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• You want non-subscribers to see <em>something</em> (use Pattern 1 or 2)</li>
                <li>• The page is mostly public (gate just the parts that aren&apos;t)</li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Code</p>
            <CodeBlock>{`// src/app/dashboard/page.tsx
import { requireTier } from '@/app/lib/access';

export default async function Dashboard() {
  // Redirects to /pricing?need=pro if not qualified.
  // Returns the resolved tier so you can use it in the page.
  const tier = await requireTier('pro');

  return <RealDashboard tier={tier} />;
}

// Customize redirects:
await requireTier('pro', {
  redirectTo: '/upgrade',           // for signed-in but underprivileged
  signedOutRedirect: '/sign-in',    // for anonymous viewers
});`}</CodeBlock>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Live demo
            </p>
            <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-700">
              <p>
                Can&apos;t demo a redirect inline (you&apos;d disappear from this page!). To see it
                live: imagine a fictional <code>/admin</code> page that calls{' '}
                <code>requireTier(&apos;enterprise&apos;)</code>. Visiting it as Free / Basic / Pro
                instantly redirects to <code>/pricing?need=enterprise</code>.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              What each viewer sees
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Viewer</th>
                    <th className="text-left px-3 py-2 font-medium">
                      Behavior (page calls requireTier(&apos;pro&apos;))
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">Anonymous</td>
                    <td className="px-3 py-2 text-gray-700">Redirected to /pricing</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">Free</td>
                    <td className="px-3 py-2 text-gray-700">Redirected to /pricing?need=pro</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">Basic</td>
                    <td className="px-3 py-2 text-gray-700">Redirected to /pricing?need=pro</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">Pro</td>
                    <td className="px-3 py-2 text-gray-700">Page renders</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">Enterprise</td>
                    <td className="px-3 py-2 text-gray-700">Page renders</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ───────── Tier hierarchy explainer ───────── */}
        <section className="mb-12 p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2">How tier comparison works</h2>
          <p className="text-sm text-gray-600 mb-4">
            All four patterns delegate to <code>meetsTier()</code> in <code>lib/plans.ts</code>.
            Tiers are ordered: a higher tier always satisfies a lower-tier requirement.
          </p>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            {TIERS.map((t, i) => (
              <span key={t} className="contents">
                <code className="px-2.5 py-1 rounded bg-gray-100 text-gray-800">
                  {TIER_ICON[t]} {t}
                </code>
                {i < TIERS.length - 1 && <span className="text-gray-400">&lt;</span>}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Anonymous viewers (signed out) are <code>null</code> — they don&apos;t qualify for any
            tier, including <code>free</code>. Add a 5th tier? Edit{' '}
            <code>TIERS</code> and <code>TIER_LEVEL</code> in <code>lib/plans.ts</code>.
          </p>
        </section>

        {/* ───────── Debug panel ───────── */}
        <details className="mt-10 p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-700">
          <summary className="cursor-pointer font-medium text-gray-900">
            Debug · current subscription state
          </summary>
          <pre className="mt-3 bg-gray-50 p-3 rounded overflow-x-auto text-xs">
{JSON.stringify(
  {
    signedIn: !!userId,
    userId,
    activeSubscription: isActive,
    userTier,
    tierOrder: TIERS,
    plan_name: subscription?.plan_name,
    price_id: subscription?.price_id,
    product_id: subscription?.product_id,
    status: subscription?.status,
  },
  null,
  2
)}
          </pre>
        </details>
      </div>

      <Footer />
    </main>
  );
}
