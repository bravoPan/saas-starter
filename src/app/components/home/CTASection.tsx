import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function CTASection() {
  return (
    <section className="py-20 md:py-24">
      <div className="container">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary to-primary-700 p-10 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/30 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Stop wiring auth + payments. Start building.
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Clone the repo, set 9 environment variables, and you&apos;re live.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white text-primary-700 font-semibold hover:bg-gray-50 transition shadow-md"
            >
              See the pricing demo <FiArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
