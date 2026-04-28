import PricingCards from '@/app/components/pricing/PricingCards';
import NavBar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';
import {
  getCurrentUserSubscription,
  isActiveStatus,
} from '@/app/lib/subscription';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pricing',
};

export default async function PricingPage() {
  const subscription = await getCurrentUserSubscription();
  const active = isActiveStatus(subscription?.status);

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="container py-12">
        <PricingCards
          currentPriceId={active ? (subscription?.price_id ?? null) : null}
          hasActiveSubscription={active}
        />
      </div>
      <Footer />
    </main>
  );
}
