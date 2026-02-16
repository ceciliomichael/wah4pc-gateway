/**
 * FHIR API Route Handler - Instance Operations
 * GET: Read a specific resource
 * PUT: Update a specific resource
 * DELETE: Remove a specific resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
  params: Promise<{ resourceType: string; id: string }>;
}

/**
 * GET /api/fhir/[resourceType]/[id]
 * Returns a specific resource by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { resourceType, id } = await params;

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

    const resource = await db.getById(resourceType, id);

    if (!resource) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'not-found',
              diagnostics: `${resourceType}/${id} not found`,
            },
          ],
        },
        { status: 404 }
      );
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.error('FHIR GET by ID error:', error);
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
 * PUT /api/fhir/[resourceType]/[id]
 * Updates a specific resource
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { resourceType, id } = await params;

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

    // Validate ID matches URL
    if (body.id && body.id !== id) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: `Resource ID in body '${body.id}' does not match URL '${id}'`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Ensure ID and resourceType are set
    body.id = id;
    body.resourceType = resourceType;

    const updated = await db.update(resourceType, id, body);

    if (!updated) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'not-found',
              diagnostics: `${resourceType}/${id} not found`,
            },
          ],
        },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('FHIR PUT error:', error);
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
 * DELETE /api/fhir/[resourceType]/[id]
 * Deletes a specific resource
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { resourceType, id } = await params;

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

    const deleted = await db.remove(resourceType, id);

    if (!deleted) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'not-found',
              diagnostics: `${resourceType}/${id} not found`,
            },
          ],
        },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('FHIR DELETE error:', error);
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
