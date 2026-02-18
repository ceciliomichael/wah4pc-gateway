import { type NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";
import { triggerGatewayPractitionerSyncWebhook } from "@/lib/server/gateway-practitioner-sync";

interface PractitionerResource {
  resourceType: string;
  id: string;
  meta: {
    profile: string[];
    lastUpdated: string;
  };
  [key: string]: unknown;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const practitioner = DataService.findById<PractitionerResource>(
      "Practitioner",
      id,
    );

    if (!practitioner) {
      return NextResponse.json(
        { error: "Practitioner not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(practitioner);
  } catch (error) {
    console.error("Practitioner API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch practitioner" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const practitionerResource: PractitionerResource = {
      resourceType: "Practitioner",
      id: id,
      meta: {
        profile: [
          "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner",
        ],
        lastUpdated: new Date().toISOString(),
      },
      ...body,
    };

    const updatedPractitioner = DataService.update(practitionerResource);

    if (!updatedPractitioner) {
      return NextResponse.json(
        { error: "Practitioner not found" },
        { status: 404 },
      );
    }

    const webhookResult = await triggerGatewayPractitionerSyncWebhook();
    if (!webhookResult.ok) {
      console.warn(
        `[Practitioner API] Failed to trigger gateway practitioner sync webhook: ${webhookResult.error}`,
      );
    }

    return NextResponse.json(updatedPractitioner);
  } catch (error) {
    console.error("Practitioner API Error:", error);
    return NextResponse.json(
      { error: "Failed to update practitioner" },
      { status: 500 },
    );
  }
}
