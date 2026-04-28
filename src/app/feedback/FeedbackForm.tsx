'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { submitFeedbackAction } from './actions';
import type { SubmitResult } from '@/app/lib/feedback';

const MAX_LEN = 280;

export default function FeedbackForm() {
  const [state, formAction, pending] = useActionState<SubmitResult | null, FormData>(
    submitFeedbackAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setLength(0);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <label htmlFor="message" className="block text-sm font-medium text-gray-700">
        Leave a message or feature request
      </label>
      <textarea
        id="message"
        name="message"
        required
        maxLength={MAX_LEN}
        rows={3}
        disabled={pending}
        onChange={(e) => setLength(e.target.value.length)}
        placeholder="What would you like to see next?"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-60"
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            length > MAX_LEN - 20 ? 'text-amber-600' : 'text-gray-500'
          }`}
        >
          {length} / {MAX_LEN}
        </span>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {pending ? 'Posting…' : 'Post'}
        </button>
      </div>

      {state && !state.ok && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
          Thanks — your message is live below.
        </p>
      )}
    </form>
  );
}
