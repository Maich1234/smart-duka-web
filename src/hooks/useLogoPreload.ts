import { useEffect, useState } from 'react';

/**
 * Fetches the shop's logo once, while there's a connection, and keeps it as
 * a data: URI — in memory and in localStorage, keyed by URL so a changed
 * logo naturally invalidates the old entry.
 *
 * Printing a receipt embeds this logo as an <img src>. Without preloading,
 * that fetch happens live inside the popup window at print time, which is
 * exactly when a shop is most likely to be offline (the till doesn't need
 * internet to ring up a cash sale). Falls back to the live URL — today's
 * behaviour — until the preload finishes or if it fails.
 */
const CACHE_PREFIX = 'sd-logo-cache:';
const memoryCache = new Map<string, string>();
/** De-dupes concurrent fetches of the same URL — the preloader mounted once
 * at the dashboard layout and any sales page's own call would otherwise both
 * fire a request the instant the logo is known. */
const inFlight = new Map<string, Promise<string>>();

function readCached(url: string): string | null {
  if (memoryCache.has(url)) return memoryCache.get(url)!;
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(CACHE_PREFIX + url);
  } catch {
    return null;
  }
}

function writeCached(url: string, dataUrl: string) {
  memoryCache.set(url, dataUrl);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_PREFIX + url, dataUrl);
  } catch {
    // Storage full or disabled — the in-memory cache still covers this tab
    // for the rest of the session.
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Fetches + caches `url`, sharing one in-flight request across every caller. */
function preload(url: string): Promise<string> {
  const cached = readCached(url);
  if (cached) return Promise.resolve(cached);

  const existing = inFlight.get(url);
  if (existing) return existing;

  const promise = fetch(url)
    .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('logo fetch failed'))))
    .then(blobToDataUrl)
    .then((result) => {
      writeCached(url, result);
      return result;
    })
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, promise);
  return promise;
}

/**
 * Kicks off the fetch-and-cache without needing a data URI back — for
 * mounting once high up the tree (see LogoPreloader) so the logo is already
 * cached by the time a receipt actually needs printing, wherever the user
 * happens to have navigated first.
 */
export function preloadLogo(logoUrl?: string): void {
  if (!logoUrl || readCached(logoUrl)) return;
  preload(logoUrl).catch(() => {
    // Offline, or the URL is dead — receipts fall back to the live URL.
  });
}

export function usePreloadedLogo(logoUrl?: string): string | undefined {
  const [dataUrl, setDataUrl] = useState<string | null>(() => (logoUrl ? readCached(logoUrl) : null));

  useEffect(() => {
    if (!logoUrl) {
      setDataUrl(null);
      return;
    }
    const cached = readCached(logoUrl);
    if (cached) {
      setDataUrl(cached);
      return;
    }

    let cancelled = false;
    preload(logoUrl).then(
      (result) => {
        if (!cancelled) setDataUrl(result);
      },
      () => {
        // Offline, or the URL is dead — receipts print with the live URL,
        // same as before preloading existed.
      },
    );

    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  return dataUrl ?? logoUrl;
}
