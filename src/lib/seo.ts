import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from './site';

export const SOCIAL_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'DuQana: sales, stock and M-Pesa for Kenyan shops' };

export function publicMetadata(title: string, description: string, path: string, type: 'website' | 'article' = 'website'): Metadata {
  return {
    title,
    description,
    robots: process.env.VERCEL_ENV === 'preview'
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: { canonical: path },
    openGraph: { title, description, url: `${SITE_URL}${path === '/' ? '' : path}`, siteName: SITE_NAME, type, locale: 'en_KE', images: [SOCIAL_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [SOCIAL_IMAGE.url] },
  };
}
