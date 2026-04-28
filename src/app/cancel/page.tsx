import Link from 'next/link';

export const metadata = { title: 'Payment canceled' };

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-3xl">
          ×
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment canceled</h1>
        <p className="text-gray-600 mt-2">
          No charge was made. You can come back any time.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-700 transition"
          >
            Back to pricing
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
