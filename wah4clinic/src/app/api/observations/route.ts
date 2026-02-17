import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { DataService } from "@/lib/server/data-service";

interface ObservationResource {
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
		const observations = DataService.findAll<ObservationResource>("Observation");

		const bundle = {
			resourceType: "Bundle",
			type: "searchset",
			total: observations.length,
			entry: observations.map((observation) => ({
				resource: observation,
			})),
		};

		return NextResponse.json(bundle);
	} catch (error) {
		console.error("Observation API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch observations" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const observationResource: ObservationResource = {
			resourceType: "Observation",
			id: randomUUID(),
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const createdObservation = DataService.create(observationResource);

		return NextResponse.json(createdObservation, { status: 201 });
	} catch (error) {
		console.error("Observation API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create observation" },
			{ status: 500 },
		);
	}
}