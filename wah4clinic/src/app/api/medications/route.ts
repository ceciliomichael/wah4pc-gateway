import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";
import { v4 as uuidv4 } from "uuid";

interface MedicationResource {
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

		const medicationResource: MedicationResource = {
			resourceType: "Medication",
			id: uuidv4(),
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-medication"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const savedMedication = DataService.create(medicationResource);

		return NextResponse.json(savedMedication, { status: 201 });
	} catch (error) {
		console.error("Medication API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create medication" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const medications = DataService.findAll<MedicationResource>("Medication");

		return NextResponse.json({
			resourceType: "Bundle",
			type: "searchset",
			total: medications.length,
			entry: medications.map((medication) => ({
				resource: medication,
			})),
		});
	} catch (error) {
		console.error("Medication API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch medications" },
			{ status: 500 },
		);
	}
}