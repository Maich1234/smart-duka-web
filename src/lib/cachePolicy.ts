/** Runtime cache allowlist; never infer cacheability from a file extension. */
export function isCacheableBuildAsset(sameOrigin: boolean, pathname: string): boolean {
  return sameOrigin && pathname.startsWith('/_next/static/');
}
