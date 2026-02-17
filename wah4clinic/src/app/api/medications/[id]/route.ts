import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";

interface MedicationResource {
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
		const medication = DataService.findById<MedicationResource>("Medication", id);

		if (!medication) {
			return NextResponse.json(
				{ error: "Medication not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(medication);
	} catch (error) {
		console.error("Medication API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch medication" },
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

		const medicationResource: MedicationResource = {
			resourceType: "Medication",
			id,
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-medication"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const updatedMedication = DataService.update(medicationResource);

		if (!updatedMedication) {
			return NextResponse.json(
				{ error: "Medication not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(updatedMedication);
	} catch (error) {
		console.error("Medication API Error:", error);
		return NextResponse.json(
			{ error: "Failed to update medication" },
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
		const deleted = DataService.delete("Medication", id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Medication not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Medication API Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete medication" },
			{ status: 500 },
		);
	}
}