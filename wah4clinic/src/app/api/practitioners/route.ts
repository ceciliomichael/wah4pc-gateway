import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";
import { v4 as uuidv4 } from "uuid";

interface PractitionerResource {
	resourceType: string;
	id: string;
	meta: {
		profile: string[];
		lastUpdated: string;
	};
	[key: string]: unknown;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const practitionerResource: PractitionerResource = {
			resourceType: "Practitioner",
			id: uuidv4(),
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const savedPractitioner = DataService.create(practitionerResource);

		return NextResponse.json(savedPractitioner, { status: 201 });
	} catch (error) {
		console.error("Practitioner API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create practitioner" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const practitioners = DataService.findAll<PractitionerResource>("Practitioner");

		return NextResponse.json({
			resourceType: "Bundle",
			type: "searchset",
			total: practitioners.length,
			entry: practitioners.map((practitioner) => ({
				resource: practitioner,
			})),
		});
	} catch (error) {
		console.error("Practitioner API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch practitioners" },
			{ status: 500 },
		);
	}
}