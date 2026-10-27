type SessionUser = { _id: string; shop: { _id: string }; role: string; permissions?: string[] } | null;
/** Token rotation preserves identity; account, shop or permission changes do not. */
export function sameSessionIdentity(a: SessionUser, b: SessionUser): boolean {
  if (!a || !b) return a === b;
  return a._id === b._id && a.shop._id === b.shop._id && a.role === b.role &&
    JSON.stringify([...new Set(a.permissions ?? [])].sort()) === JSON.stringify([...new Set(b.permissions ?? [])].sort());
}
