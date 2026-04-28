# SaaS Starter

A production-ready Next.js 15 starter with **Clerk** (auth), **Stripe** (subscriptions), and **Supabase** (Postgres database) wired up end-to-end. Use it as the base for any SaaS idea.

## What's included

- **Auth** — Clerk handles sign-in / sign-up / OAuth / sessions. Middleware-protected routes.
- **Subscriptions** — Stripe Checkout for new subs, Customer Portal for self-service billing, webhooks that keep your DB in sync.
- **Database** — Supabase Postgres with `profiles`, `subscriptions`, and example `feedback_entries` tables. Service-role admin client for server-side writes; RLS enabled.
- **Tier-based gating** — `free / basic / pro / enterprise` tiers with reusable `<Gate>`, `<Paywall>`, and `requireTier()` helpers ([live demo at `/premium`](http://localhost:3000/premium)).
- **Account page** — `/account` shows current plan, status, renewal date, and a "Manage subscription" button that opens the Stripe Customer Portal.
- **Webhooks** — `/api/webhooks/stripe` and `/api/webhooks/clerk` with Svix / Stripe signature verification.
- **Health check** — `/api/health/supabase` returns row counts so uptime monitors can verify DB connectivity.
- **MDX blog** — drop `.mdx` files into `src/content/blog/`. Frontmatter-driven. `tier:` in frontmatter auto-paywalls the post. Syntax-highlighted via `rehype-pretty-code`.
- **CI** — GitHub Actions workflow that runs `next build` on every PR (catches the prod-only TypeScript errors that `next dev` silently skips).

## Stack

- Next.js 15 (App Router, Server Components, Server Actions)
- TypeScript (strict)
- Tailwind CSS
- Clerk (`@clerk/nextjs`)
- Stripe (`stripe` SDK + Customer Portal)
- Supabase (`@supabase/supabase-js`, service-role on server only)
- Svix (Clerk webhook signature verification)

---

## 5-minute quickstart

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Provision the three services

You need accounts on **Clerk**, **Supabase**, and **Stripe**. All three have generous free tiers.

#### Clerk (https://dashboard.clerk.com)

1. Create an application.
2. **API Keys** → copy the publishable + secret key into `.env.local` as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. **Webhooks** → create a new endpoint pointed at `https://YOUR-DOMAIN/api/webhooks/clerk` (or use ngrok for local). Subscribe to `user.created`, `user.updated`, `user.deleted`. Copy the signing secret into `CLERK_WEBHOOK_SECRET`.

#### Supabase (https://supabase.com/dashboard)

1. Create a project.
2. **Project Settings → API** → copy URL into `NEXT_PUBLIC_SUPABASE_URL`, copy the **service_role** key (NOT anon) into `SUPABASE_SERVICE_ROLE_KEY`.
3. **SQL editor** → paste the contents of `supabase/migrations/0001_init.sql` and run it. This creates `profiles`, `subscriptions`, and `feedback_entries`.

#### Stripe (https://dashboard.stripe.com)

1. Get your test-mode secret key from **Developers → API keys** → copy into `STRIPE_SECRET_KEY`.
2. Create your products: **Products → Add product** for each plan (Basic, Pro, Enterprise). Each product gets one or more **Prices**. Copy each price's **API ID** (looks like `price_1Q...`).
3. Open `src/app/components/pricing/PricingCards.tsx` and replace the three `price_REPLACE_ME_*` placeholders with your real Price IDs.
4. Webhooks (local dev): install Stripe CLI and run
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   The CLI prints a `whsec_...` signing secret — paste it into `.env.local` as `STRIPE_WEBHOOK_SECRET`.
5. Webhooks (production): **Developers → Webhooks → Add endpoint** pointed at `https://YOUR-DOMAIN/api/webhooks/stripe`, subscribed to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000.

### 4. Sanity-check

```bash
# Verify Supabase is reachable
curl http://localhost:3000/api/health/supabase

# Run the production typecheck (catches errors next dev silently skips)
npm run build
```

---

## Architecture

```
User sign-up
   ↓
Clerk creates user
   ↓
Clerk webhook → /api/webhooks/clerk → upserts row in `profiles`
   ↓
User clicks "Subscribe" on /pricing
   ↓
/api/create-checkout-session creates Stripe Customer + Checkout session
   ↓
User pays on Stripe
   ↓
Stripe webhook → /api/webhooks/stripe → upserts row in `subscriptions`
   ↓
/account, /premium, <Gate> all read from `subscriptions` to gate content
```

### Key files

| File | Purpose |
|---|---|
| `src/middleware.ts` | Clerk middleware. Protects `/account`. Bypasses `/api/webhooks/*`. |
| `src/app/lib/supabase/admin.ts` | Service-role Supabase client. Server-only. |
| `src/app/lib/stripe.ts` | Stripe SDK singleton. |
| `src/app/lib/subscription.ts` | Profile / subscription sync helpers. The heart of the system. |
| `src/app/lib/plans.ts` | Tier definitions + `meetsTier()` comparator. |
| `src/app/lib/access.ts` | `requireTier()` for whole-page guards. |
| `src/app/components/access/Gate.tsx` | Section-level gating. |
| `src/app/components/access/Paywall.tsx` | Soft paywall (preview + locked body). |
| `src/app/api/webhooks/stripe/route.ts` | Stripe webhook handler. |
| `src/app/api/webhooks/clerk/route.ts` | Clerk webhook handler. |
| `src/app/api/create-checkout-session/route.ts` | Starts a subscription. |
| `src/app/api/create-portal-session/route.ts` | Opens the Stripe Customer Portal. |

---

## Common extensions

### Add a new tier

Edit `src/app/lib/plans.ts`:

```typescript
export const TIERS = ['free', 'basic', 'pro', 'team', 'enterprise'] as const;

export const TIER_LEVEL: Record<Tier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  team: 3,         // new
  enterprise: 4,
};
```

Then add the `tier` value to your Stripe Product's `metadata.tier` field — `syncSubscriptionFromStripe` reads it on every webhook.

### Write a blog post

Run the app and open [`/blog/writing-guide`](http://localhost:3000/blog/writing-guide) — it's a self-documenting MDX post that covers everything: frontmatter fields, syntax highlighting, tables, tier-gating with the `<!-- preview-end -->` delimiter, internal vs external link handling, custom components, common gotchas, and the migration path to a CMS.

The 30-second version: drop `.mdx` into `src/content/blog/`, add three required frontmatter fields (`title`, `description`, `date`), and you're done. Add `tier: pro` to auto-paywall the body.

### Replace file-based MDX with a Supabase CMS

The blog is structured so you can swap the source without touching the page
components. Two places to change:

1. Add a `posts` table to Supabase: `slug text primary key, title text, description text, body_mdx text, published_at timestamptz, tier tier_enum`.
2. Replace the implementations of `getAllPosts()` and `getPost()` in `src/app/blog/posts.ts` with Supabase queries that return the same `BlogPost` shape (`{ slug, title, description, date, readTime?, tier?, mdx }`).

The pages (`/blog`, `/blog/[slug]`), the paywall logic, the MDX components
config — none of them need to change. They consume `BlogPost`, not files.

### Protect a whole page

```typescript
// src/app/dashboard/page.tsx
import { requireTier } from '@/app/lib/access';

export default async function Dashboard() {
  await requireTier('pro');  // redirects to /pricing if not Pro+
  return <RealDashboard />;
}
```

### Gate a section

```tsx
import Gate from '@/app/components/access/Gate';

<Gate tier="pro">
  <AdvancedAnalytics />
</Gate>
```

---

## Why some decisions

- **Service-role key on the server only.** Clerk owns auth; Supabase RLS is defense-in-depth. The app never trusts the browser to identify itself to Postgres directly.
- **Webhooks are the source of truth.** Checkout success page does a best-effort sync, but webhooks are what set state authoritatively. If a webhook fails, Stripe retries.
- **Tier as a string, not a number.** Easier to grep for, easier to add new tiers, no off-by-one errors when comparing levels.
- **CI runs `next build`, not `next lint`.** `next dev` skips full type-checking for speed. The build does the real check. We learned this the hard way.

---

## Deploying

The starter is built for Vercel. Required env vars:

- `NEXT_PUBLIC_BASE_URL` — your real domain (`https://...`)
- All `NEXT_PUBLIC_CLERK_*`, `CLERK_*`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

After deploy, point your Clerk + Stripe webhooks at the production URLs.

---

## License

MIT. Do whatever you want.
