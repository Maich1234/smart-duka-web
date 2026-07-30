import { useQuery } from '@tanstack/react-query';
import { getCounties, getPresets, getSubcounties } from '@/services/presets';

/**
 * Static lookup tables. They change only when the backend is redeployed, so
 * they're cached for the lifetime of the tab rather than refetched per screen.
 */
export const usePresets = () => {
  const query = useQuery({
    queryKey: ['presets'],
    queryFn: getPresets,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    countries: query.data?.countries ?? [],
    currencies: query.data?.currencies ?? [],
    unitsOfMeasure: query.data?.unitsOfMeasure ?? [],
    isLoading: query.isLoading,
  };
};

/** Counties for a country code. Skipped until a country is chosen. */
export const useCounties = (country: string | undefined) =>
  useQuery({
    queryKey: ['counties', country],
    queryFn: () => getCounties(country as string),
    enabled: !!country,
    staleTime: Infinity,
  });

/** Sub-counties for a county. `countyId` is a Location _id, not a name. */
export const useSubcounties = (countyId: string | undefined) =>
  useQuery({
    queryKey: ['subcounties', countyId],
    queryFn: () => getSubcounties(countyId as string),
    enabled: !!countyId,
    staleTime: Infinity,
  });
