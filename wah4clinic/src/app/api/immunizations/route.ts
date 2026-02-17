import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { DataService } from "@/lib/server/data-service";

interface ImmunizationResource {
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
		const immunizations = DataService.findAll<ImmunizationResource>("Immunization");

		const bundle = {
			resourceType: "Bundle",
			type: "searchset",
			total: immunizations.length,
			entry: immunizations.map((immunization) => ({
				resource: immunization,
			})),
		};

		return NextResponse.json(bundle);
	} catch (error) {
		console.error("Immunization API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch immunizations" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const immunizationResource: ImmunizationResource = {
			resourceType: "Immunization",
			id: randomUUID(),
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-immunization"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const createdImmunization = DataService.create(immunizationResource);

		return NextResponse.json(createdImmunization, { status: 201 });
	} catch (error) {
		console.error("Immunization API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create immunization" },
			{ status: 500 },
		);
	}
}