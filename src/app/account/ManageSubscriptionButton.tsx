'use client';

import { useState } from 'react';

export default function ManageSubscriptionButton({ label = 'Manage subscription' }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-portal-session', { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        alert(data.error ?? 'Failed to open billing portal');
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-white font-medium shadow-sm hover:bg-primary/90 disabled:opacity-60 transition"
    >
      {loading ? 'Loading…' : label}
    </button>
  );
}
