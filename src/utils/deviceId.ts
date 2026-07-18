// Stable per-browser identity, sent on login so the backend can identify and
// display this session in the owner's Staff Management "Current Device"
// panel. Browsers have WebCrypto natively — no Hermes-style fallback needed
// (contrast with the mobile app's utils/deviceId.ts).
const DEVICE_ID_KEY = 'device-id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  const stored = window.localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  const id = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export function getDeviceInfo() {
  return {
    deviceId: getDeviceId(),
    deviceName: 'Web Browser',
    platform: 'web' as const,
  };
}
