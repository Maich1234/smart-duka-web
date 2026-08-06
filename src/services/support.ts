import api from '@/lib/api';

export interface ContactFormPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/** The marketing site's contact form — public, unauthenticated. */
export async function submitContactForm(payload: ContactFormPayload): Promise<{ success: boolean; message: string }> {
  const res = await api.post('/public/contact', payload);
  return res.data;
}
