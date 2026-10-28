/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, CacheFirst, NetworkOnly } from 'serwist';
import { isCacheableBuildAsset } from '@/lib/cachePolicy';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Only versioned Next build assets may enter runtime caches. API, public
// documents, navigations and authenticated responses always use the network.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    { matcher: ({ sameOrigin, url }) => isCacheableBuildAsset(sameOrigin, url.pathname), handler: new CacheFirst({ cacheName: 'duqana-build-assets' }) },
    { matcher: () => true, handler: new NetworkOnly() },
  ],
});

serwist.addEventListeners();

// Remove caches populated by the previous broad defaultCache configuration.
self.addEventListener('activate', event => {
  const legacy = new Set(['google-fonts-webfonts', 'google-fonts-stylesheets', 'static-font-assets', 'static-image-assets', 'next-static-js-assets', 'next-image', 'static-audio-assets', 'static-video-assets', 'static-js-assets', 'static-style-assets', 'next-data', 'static-data-assets', 'apis', 'pages-rsc-prefetch', 'pages-rsc', 'pages', 'others', 'cross-origin']);
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => legacy.has(key)).map(key => caches.delete(key)))));
});
