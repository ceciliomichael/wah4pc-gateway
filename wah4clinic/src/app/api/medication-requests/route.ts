import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { DataService } from "@/lib/server/data-service";

interface MedicationRequestResource {
	resourceType: string;
	id: string;
	meta: {
		profile: string[];
		lastUpdated: string;
	};
	[key: string]: unknown;
}

export async function GET() {
	try {
		const medicationRequests = DataService.findAll<MedicationRequestResource>("MedicationRequest");

		const bundle = {
			resourceType: "Bundle",
			type: "searchset",
			total: medicationRequests.length,
			entry: medicationRequests.map((medicationRequest) => ({
				resource: medicationRequest,
			})),
		};

		return NextResponse.json(bundle);
	} catch (error) {
		console.error("MedicationRequest API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch medication requests" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const medicationRequestResource: MedicationRequestResource = {
			resourceType: "MedicationRequest",
			id: randomUUID(),
			meta: {
				profile: ["http://hl7.org/fhir/StructureDefinition/MedicationRequest"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const createdMedicationRequest = DataService.create(medicationRequestResource);

		return NextResponse.json(createdMedicationRequest, { status: 201 });
	} catch (error) {
		console.error("MedicationRequest API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create medication request" },
			{ status: 500 },
		);
	}
}
