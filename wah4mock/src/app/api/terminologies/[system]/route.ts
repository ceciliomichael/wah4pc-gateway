import { NextRequest, NextResponse } from 'next/server';
import { readJsonResource } from '@/lib/server/resources';

const SYSTEM_FILE_MAP: Record<string, string> = {
  'educational-attainment': 'CodeSystem-educational-attainment.json',
  'indigenous-groups': 'CodeSystem-indigenous-groups.json',
  'race': 'CodeSystem-race.json',
  'religion': 'CodeSystem-religion.json', // Assuming this exists or will exist
  'drugs': 'CodeSystem-drugs.json',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ system: string }> }
) {
  const system = (await params).system;
  const filename = SYSTEM_FILE_MAP[system];

  if (!filename) {
    return NextResponse.json({ error: 'Unknown terminology system' }, { status: 404 });
  }

  const data = readJsonResource(filename);
  
  if (!data || !data.concept) {
    return NextResponse.json({ error: `Failed to load data for ${system}` }, { status: 500 });
  }

  const simplified = data.concept.map((item: any) => ({
    code: item.code,
    display: item.display,
  }));

  return NextResponse.json(simplified);
}