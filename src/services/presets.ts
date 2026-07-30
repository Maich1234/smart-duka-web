import api from '@/lib/api';

/**
 * Lookup tables for dropdowns, served from GET /presets and friends. All
 * three endpoints are public — no auth header required.
 *
 * These replaced hardcoded COUNTRIES/CURRENCIES/unit arrays that had drifted
 * from the backend's own validation lists, so a shop could pick a currency
 * the server would then reject.
 */

export interface CountryPreset {
  code: string;
  name: string;
  currency: string;
  currencyName: string;
  symbol: string;
  phonePrefix: string;
  flag: string;
}

export interface CurrencyPreset {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface UnitOfMeasurePreset {
  value: string;
  label: string;
  abbreviation: string;
}

export interface Presets {
  countries: CountryPreset[];
  currencies: CurrencyPreset[];
  unitsOfMeasure: UnitOfMeasurePreset[];
}

/** County/sub-county come from the Location collection, not the static table. */
export interface County {
  _id: string;
  name: string;
  code: string | null;
}

export interface SubCounty {
  _id: string;
  name: string;
}

export async function getPresets(): Promise<Presets> {
  const res = await api.get<{ success: boolean; data: Presets }>('/presets');
  return res.data.data;
}

export async function getCounties(country: string): Promise<County[]> {
  const res = await api.get<{ success: boolean; data: County[] }>('/presets/counties', {
    params: { country },
  });
  return res.data.data;
}

/** `countyId` is a Location _id, not a name. */
export async function getSubcounties(countyId: string): Promise<SubCounty[]> {
  const res = await api.get<{ success: boolean; data: SubCounty[] }>('/presets/subcounties', {
    params: { county: countyId },
  });
  return res.data.data;
}
