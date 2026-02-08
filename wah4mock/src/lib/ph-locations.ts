/**
 * Philippine Standard Geographic Code (PSGC) Data Utilities
 * Provides hierarchy for Region -> Province -> City/Municipality -> Barangay
 * 
 * Note: This is a simplified subset for the Mock environment.
 * In a real production app, this should be served via API from a database.
 */

export interface LocationOption {
  code: string;
  name: string;
}

// PSGC System URL
export const PSGC_SYSTEM = "urn://example.com/ph-core/fhir/CodeSystem/PSGC";

// Sample Data (Focusing on Region IV-A / Cavite for the mock)
export const REGIONS: LocationOption[] = [
  { code: '040000000', name: 'REGION IV-A (CALABARZON)' },
  { code: '130000000', name: 'NCR (National Capital Region)' },
  { code: '030000000', name: 'REGION III (CENTRAL LUZON)' },
];

export const PROVINCES: Record<string, LocationOption[]> = {
  '040000000': [ // CALABARZON
    { code: '042100000', name: 'CAVITE' },
    { code: '043400000', name: 'LAGUNA' },
    { code: '041000000', name: 'BATANGAS' },
    { code: '045800000', name: 'RIZAL' },
    { code: '045600000', name: 'QUEZON' },
  ],
  '130000000': [ // NCR
    { code: '133900000', name: 'NCR, FIRST DISTRICT (MANILA)' },
    { code: '137400000', name: 'NCR, SECOND DISTRICT' },
    { code: '137500000', name: 'NCR, THIRD DISTRICT' },
    { code: '137600000', name: 'NCR, FOURTH DISTRICT' },
  ],
};

export const CITIES_MUNICIPALITIES: Record<string, LocationOption[]> = {
  '042100000': [ // Cavite
    { code: '042101000', name: 'ALFONSO' },
    { code: '042102000', name: 'AMADEO' },
    { code: '042103000', name: 'BACOOR CITY' },
    { code: '042104000', name: 'CARMONA' },
    { code: '042105000', name: 'CAVITE CITY' },
    { code: '042106000', name: 'DASMARIÑAS CITY' },
    { code: '042107000', name: 'GENERAL EMILIO AGUINALDO' },
    { code: '042108000', name: 'GENERAL MARIANO ALVAREZ' },
    { code: '042109000', name: 'GENERAL TRIAS CITY' },
    { code: '042111000', name: 'IMUS CITY' },
    { code: '042112000', name: 'INDANG' },
    { code: '042113000', name: 'KAWIT' },
    { code: '042114000', name: 'MAGALLANES' },
    { code: '042115000', name: 'MARAGONDON' },
    { code: '042116000', name: 'MENDEZ (MENDEZ-NUÑEZ)' },
    { code: '042117000', name: 'NAIC' },
    { code: '042118000', name: 'NOVELETA' },
    { code: '042119000', name: 'ROSARIO' },
    { code: '042120000', name: 'SILANG' },
    { code: '042122000', name: 'TAGAYTAY CITY' },
    { code: '042123000', name: 'TANZA' },
    { code: '042124000', name: 'TERNATE' },
    { code: '042125000', name: 'TRECE MARTIRES CITY' },
  ],
  '133900000': [ // Manila
    { code: '133900000', name: 'CITY OF MANILA' },
  ]
};

export const BARANGAYS: Record<string, LocationOption[]> = {
  '042105000': [ // Cavite City
    { code: '042105001', name: 'BARANGAY 1 (HEN. M. ALVAREZ)' },
    { code: '042105002', name: 'BARANGAY 2 (C. TIRONA)' },
    { code: '042105003', name: 'BARANGAY 3 (HEN. E. AGUINALDO)' },
    { code: '042105004', name: 'BARANGAY 4 (HEN. M. TRIAS)' },
    { code: '042105005', name: 'BARANGAY 5 (HEN. E. EVANGELISTA)' },
    // ... simplified list
  ],
  '042106000': [ // Dasmariñas
    { code: '042106001', name: 'BUROL' },
    { code: '042106002', name: 'LANGKAAN I' },
    { code: '042106003', name: 'PALIPARAN I' },
    { code: '042106004', name: 'SABANG' },
    { code: '042106005', name: 'SALAWAG' },
    { code: '042106006', name: 'SAMPALOC I' },
  ]
};

export function getRegions(): LocationOption[] {
  return REGIONS;
}

export function getProvinces(regionCode: string): LocationOption[] {
  return PROVINCES[regionCode] || [];
}

export function getCitiesMunicipalities(provinceCode: string): LocationOption[] {
  return CITIES_MUNICIPALITIES[provinceCode] || [];
}

export function getBarangays(cityCode: string): LocationOption[] {
  return BARANGAYS[cityCode] || [];
}

export function getLocationName(code: string, type: 'region' | 'province' | 'city' | 'barangay'): string {
  // Simple lookup for mock
  const all = [
    ...REGIONS,
    ...Object.values(PROVINCES).flat(),
    ...Object.values(CITIES_MUNICIPALITIES).flat(),
    ...Object.values(BARANGAYS).flat(),
  ];
  return all.find(l => l.code === code)?.name || code;
}