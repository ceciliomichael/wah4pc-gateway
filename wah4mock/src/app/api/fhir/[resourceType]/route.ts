/**
 * FHIR API Route Handler - Collection Operations
 * GET: List all resources of a type
 * POST: Create a new resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Resource } from '@/lib/types/fhir';

const VALID_RESOURCE_TYPES: string[] = [
  'Patient',
  'Practitioner',
  'Organization',
  'Encounter',
  'Condition',
  'Observation',
  'AllergyIntolerance',
  'Medication',
  'Immunization',
  'Appointment',
  'Procedure',
  'Location',
  'Account',
  'Claim',
  'ClaimResponse',
  'ChargeItem',
  'ChargeItemDefinition',
  'Invoice',
  'PaymentNotice',
  'PaymentReconciliation',
  'DiagnosticReport',
  'MedicationAdministration',
  'MedicationRequest',
  'NutritionOrder',
  'PractitionerRole',
];

function isValidResourceType(type: string): boolean {
  return VALID_RESOURCE_TYPES.includes(type);
}

interface RouteParams {
  params: Promise<{ resourceType: string }>;
}

/**
 * GET /api/fhir/[resourceType]
 * Returns all resources of the specified type
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { resourceType } = await params;

    if (!isValidResourceType(resourceType)) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'not-supported',
              diagnostics: `Resource type '${resourceType}' is not supported`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Handle search parameters
    const searchParams = request.nextUrl.searchParams;
    const searchFilters: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      if (key !== '_count' && key !== '_offset') {
        searchFilters[key] = value;
      }
    });

    let resources: Resource[];
    
    if (Object.keys(searchFilters).length > 0) {
      resources = await db.search(resourceType, searchFilters);
    } else {
      resources = await db.getAll(resourceType);
    }

    // Return as FHIR Bundle
    return NextResponse.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: resources.length,
      entry: resources.map((resource) => ({
        fullUrl: `${request.nextUrl.origin}/api/fhir/${resourceType}/${resource.id}`,
        resource,
      })),
    });
  } catch (error) {
    console.error('FHIR GET error:', error);
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'exception',
            diagnostics: 'Internal server error',
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fhir/[resourceType]
 * Creates a new resource
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { resourceType } = await params;

    if (!isValidResourceType(resourceType)) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'not-supported',
              diagnostics: `Resource type '${resourceType}' is not supported`,
            },
          ],
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate resource type matches URL
    if (body.resourceType && body.resourceType !== resourceType) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: `Resource type in body '${body.resourceType}' does not match URL '${resourceType}'`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Ensure resourceType is set
    body.resourceType = resourceType;

    const created = await db.create(resourceType, body);

    return NextResponse.json(created, {
      status: 201,
      headers: {
        Location: `/api/fhir/${resourceType}/${created.id}`,
      },
    });
  } catch (error) {
    console.error('[FHIR POST] Error creating resource:', error);
    console.error('[FHIR POST] Error stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('[FHIR POST] Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'exception',
            diagnostics: error instanceof Error ? error.message : 'Internal server error',
          },
        ],
      },
      { status: 500 }
    );
  }
}
