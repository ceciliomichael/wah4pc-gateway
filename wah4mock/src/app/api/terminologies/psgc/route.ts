import { NextRequest, NextResponse } from 'next/server';
import { readJsonResource } from '@/lib/server/resources';

// Cache the PSGC data in memory to avoid reading 12MB file on every request
// In a real serverless environment, this might be evicted, but works for persistent instances
let psgcCache: any = null;

function getPsgcData() {
  if (!psgcCache) {
    psgcCache = readJsonResource('CodeSystem-PSGC.json');
  }
  return psgcCache;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const level = searchParams.get('level'); // region, province, city-municipality, barangay
  const parent = searchParams.get('parent');

  const data = getPsgcData();
  
  if (!data || !data.concept) {
    return NextResponse.json({ error: 'Failed to load PSGC data' }, { status: 500 });
  }

  let results = data.concept;

  // Filter by Parent
  if (parent) {
    results = results.filter((item: any) => {
      const parentProp = item.property?.find((p: any) => p.code === 'parent');
      return parentProp?.valueCode === parent;
    });
  }

  // Filter by Level (optional, but good for validation)
  if (level) {
    results = results.filter((item: any) => {
      const levelProp = item.property?.find((p: any) => p.code === 'level');
      // Map 'city' or 'municipality' to 'city-municipality' if needed, or matches exactly
      // In the file we saw 'region', 'province'. Need to check strict values for others.
      // Based on typical PSGC, it might be 'city', 'municipality', or 'sub-municipality'.
      // For now, simple string matching.
      return levelProp?.valueString === level;
    });
  }

  // If no filters, return only regions to prevent dumping 40k records
  if (!parent && !level) {
     results = results.filter((item: any) => {
      const levelProp = item.property?.find((p: any) => p.code === 'level');
      return levelProp?.valueString === 'region';
    });
  }

  // Map to simplified format for UI
  const simplified = results.map((item: any) => ({
    code: item.code,
    name: item.display,
  }));

  // Sort alphabetically
  simplified.sort((a: any, b: any) => a.name.localeCompare(b.name));

  return NextResponse.json(simplified);
}