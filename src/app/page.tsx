import HeroSection from '@/app/components/home/HeroSection';
import FeaturesSection from '@/app/components/home/FeaturesSection';
import CTASection from '@/app/components/home/CTASection';
import NavBar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
