import { NextRequest, NextResponse } from 'next/server';
import { readJsonResource } from '@/lib/server/resources';

let psocCache: any = null;

function getPsocData() {
  if (!psocCache) {
    psocCache = readJsonResource('CodeSystem-PSOC.json');
  }
  return psocCache;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search')?.toLowerCase();
  
  const data = getPsocData();
  
  if (!data || !data.concept) {
    return NextResponse.json({ error: 'Failed to load PSOC data' }, { status: 500 });
  }

  let results = data.concept;

  if (search) {
    results = results.filter((item: any) => 
      item.display.toLowerCase().includes(search) || 
      item.code.includes(search)
    );
  }

  // Limit results if no specific search to prevent huge payload
  if (!search) {
    // maybe just return major groups?
    // "level": "major"
    results = results.filter((item: any) => {
       const levelProp = item.property?.find((p: any) => p.code === 'level');
       return levelProp?.valueString === 'major'; // Sub-major, minor, unit exist too
    });
  } else {
    // Cap results for search
    results = results.slice(0, 50);
  }

  const simplified = results.map((item: any) => ({
    code: item.code,
    display: item.display,
    definition: item.definition
  }));

  return NextResponse.json(simplified);
}