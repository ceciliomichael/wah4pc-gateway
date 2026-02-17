import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";

interface PatientResource {
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
		const patient = DataService.findById<PatientResource>("Patient", id);

		if (!patient) {
			return NextResponse.json(
				{ error: "Patient not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(patient);
	} catch (error) {
		console.error("Patient API Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
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

		const patientResource: PatientResource = {
			resourceType: "Patient",
			id,
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const updatedPatient = DataService.update(patientResource);

		if (!updatedPatient) {
			return NextResponse.json(
				{ error: "Patient not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(updatedPatient);
	} catch (error) {
		console.error("Patient API Error:", error);
		return NextResponse.json(
			{ error: "Failed to update patient" },
			{ status: 500 },
		);
	}
}