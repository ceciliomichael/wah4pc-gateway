import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";
import { v4 as uuidv4 } from "uuid";

interface PatientResource {
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

		const patientResource: PatientResource = {
			resourceType: "Patient",
			id: uuidv4(),
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const savedPatient = DataService.create(patientResource);

		return NextResponse.json(savedPatient, { status: 201 });
	} catch (error) {
		console.error("Patient API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create patient" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const patients = DataService.findAll<PatientResource>("Patient");

		return NextResponse.json({
			resourceType: "Bundle",
			type: "searchset",
			total: patients.length,
			entry: patients.map((patient) => ({
				resource: patient,
			})),
		});
	} catch (error) {
		console.error("Patient API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch patients" },
			{ status: 500 },
		);
	}
}