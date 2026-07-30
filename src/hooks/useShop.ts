import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getShopConfig, type Shop } from '@/services/shop';
import { useAuthStore } from '@/store/authStore';

/** The single query key for GET /shop. Import it; don't retype the string. */
export const SHOP_QUERY_KEY = ['shop'] as const;

/**
 * The shop document and its owner-controlled feature flags.
 *
 * Every flag defaults to a safe value while the request is in flight, so a
 * slow network shows a smaller app rather than briefly flashing features the
 * shop has switched off. `shiftManagementEnabled` is the exception callers
 * should know about: the shift gate must key off GET /shifts/active's own
 * `enabled` field instead, because that endpoint failing should not lock the
 * till (see hooks/useShift.ts).
 *
 * This replaced three separate useQuery calls under two different keys plus
 * one raw fetch, which meant toggling AI in one place left the other copies
 * stale until a reload.
 */
export const useShop = () => {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: SHOP_QUERY_KEY,
    queryFn: getShopConfig,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const shop: Shop | undefined = query.data;

  return {
    shop,
    isLoading: query.isLoading,
    refetch: query.refetch,
    // Flags, pre-defaulted so callers don't repeat `?? false` everywhere.
    shiftManagementEnabled: shop?.shiftManagementEnabled ?? false,
    showStaffCommission: shop?.showStaffCommission ?? false,
    purchasingEnabled: shop?.purchasingEnabled ?? false,
    // Opt-out rather than opt-in: the backend defaults aiEnabled to true, so
    // an absent field means "on", and only an explicit false switches it off.
    aiEnabled: shop?.aiEnabled ?? true,
    purchaseCostAllocationMethod: shop?.purchaseCostAllocationMethod ?? 'quantity',
    currency: shop?.currency ?? 'KES',
  };
};

/** Invalidate after any PUT /shop so flags and till buttons update everywhere. */
export const useInvalidateShop = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SHOP_QUERY_KEY });
};
