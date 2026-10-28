/** Bounds both the request and response-body read, with caller cancellation. */
export async function fetchJson<T>(url: string, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) cancel();
  else options.signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 15000);
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(response.status === 404 ? 'Quotation not found.' : [400, 401, 403].includes(response.status) ? 'This quotation link is invalid or unavailable.' : 'Could not load the quotation. Please try again.');
    return await response.json() as T;
  } catch (error) {
    if (timedOut) throw new Error('The quotation is taking too long to respond. Check your connection and try again.');
    if (controller.signal.aborted) throw error;
    if (error instanceof TypeError) throw new Error('Could not connect. Check your internet connection and try again.');
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}
