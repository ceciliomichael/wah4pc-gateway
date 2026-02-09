import { NextRequest, NextResponse } from 'next/server';
import { readJsonResource } from '@/lib/server/resources';

// Cache the Zip Code data in memory
let zipCache: any = null;

function getZipData() {
  if (!zipCache) {
    zipCache = readJsonResource('CodeSystem-zip-codes.json');
  }
  return zipCache;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');

  const data = getZipData();
  
  if (!data || !data.concept) {
    return NextResponse.json({ error: 'Failed to load Zip Code data' }, { status: 500 });
  }

  let results = data.concept;

  // Filter by City/Municipality
  if (city) {
    results = results.filter((item: any) => {
      const cityProp = item.property?.find((p: any) => p.code === 'city');
      return cityProp?.valueCode === city;
    });
  }

  // Map to simplified format for UI
  const simplified = results.map((item: any) => ({
    code: item.code, // The zip code itself
    name: `${item.code} - ${item.display}`, // Display format for dropdown
    display: item.display
  }));

  // Sort by code
  simplified.sort((a: any, b: any) => a.code.localeCompare(b.code));

  return NextResponse.json(simplified);
}