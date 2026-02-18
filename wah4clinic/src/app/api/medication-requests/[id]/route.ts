import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const medicationRequest = DataService.findById<MedicationRequestResource>("MedicationRequest", id);

		if (!medicationRequest) {
			return NextResponse.json(
				{ error: "Medication request not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(medicationRequest);
	} catch (error) {
		console.error("MedicationRequest API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch medication request" },
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

		const medicationRequestResource: MedicationRequestResource = {
			resourceType: "MedicationRequest",
			id,
			meta: {
				profile: ["http://hl7.org/fhir/StructureDefinition/MedicationRequest"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const updatedMedicationRequest = DataService.update(medicationRequestResource);

		if (!updatedMedicationRequest) {
			return NextResponse.json(
				{ error: "Medication request not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(updatedMedicationRequest);
	} catch (error) {
		console.error("MedicationRequest API Error:", error);
		return NextResponse.json(
			{ error: "Failed to update medication request" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const deleted = DataService.delete("MedicationRequest", id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Medication request not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("MedicationRequest API Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete medication request" },
			{ status: 500 },
		);
	}
}
