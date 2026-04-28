'use server';

import { revalidatePath } from 'next/cache';
import { submitFeedback, type SubmitResult } from '@/app/lib/feedback';

export async function submitFeedbackAction(
  _prevState: SubmitResult | null,
  formData: FormData
): Promise<SubmitResult> {
  const message = formData.get('message');
  if (typeof message !== 'string') {
    return { ok: false, error: 'Invalid form payload.' };
  }
  const result = await submitFeedback(message);
  if (result.ok) revalidatePath('/feedback');
  return result;
}
