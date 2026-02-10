import { NextRequest, NextResponse } from 'next/server';
import { readJsonResource } from '@/lib/server/resources';

interface PsgcProperty {
  code: string;
  valueString?: string;
  valueCode?: string;
}

interface PsgcConcept {
  code: string;
  display: string;
  property?: PsgcProperty[];
}

interface PsgcCodeSystem {
  concept?: PsgcConcept[];
}

// Cache the PSGC data in memory to avoid reading 12MB file on every request
let psgcCache: PsgcCodeSystem | null = null;

function getPsgcData(): PsgcCodeSystem | null {
  if (!psgcCache) {
    psgcCache = readJsonResource('CodeSystem-PSGC.json') as PsgcCodeSystem;
  }
  return psgcCache;
}

function getLevel(item: PsgcConcept): string | undefined {
  return item.property?.find((p) => p.code === 'level')?.valueString;
}

function getParent(item: PsgcConcept): string | undefined {
  return item.property?.find((p) => p.code === 'parent')?.valueCode;
}

function filterByParent(concepts: PsgcConcept[], parentCode: string): PsgcConcept[] {
  return concepts.filter((item) => getParent(item) === parentCode);
}

function filterByLevel(concepts: PsgcConcept[], level: string): PsgcConcept[] {
  return concepts.filter((item) => getLevel(item) === level);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const level = searchParams.get('level');
  const parent = searchParams.get('parent');

  const data = getPsgcData();

  if (!data?.concept) {
    return NextResponse.json({ error: 'Failed to load PSGC data' }, { status: 500 });
  }

  const allConcepts = data.concept;
  let results: PsgcConcept[];

  if (parent && level === 'province') {
    // Special handling: some regions (e.g. NCR) have no province-level children,
    // their children are cities directly under the region.
    // Try province first; if empty, fall back to direct children (cities).
    const children = filterByParent(allConcepts, parent);
    const provinces = children.filter((c) => getLevel(c) === 'province');
    results = provinces.length > 0 ? provinces : children;
  } else if (parent && level) {
    results = filterByLevel(filterByParent(allConcepts, parent), level);
  } else if (parent) {
    results = filterByParent(allConcepts, parent);
  } else if (level) {
    results = filterByLevel(allConcepts, level);
  } else {
    // No filters — return only regions to prevent dumping 40k+ records
    results = filterByLevel(allConcepts, 'region');
  }

  const simplified = results.map((item) => ({
    code: item.code,
    name: item.display,
    level: getLevel(item),
  }));

  simplified.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json(simplified);
}