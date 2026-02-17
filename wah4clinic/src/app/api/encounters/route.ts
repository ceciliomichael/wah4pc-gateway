import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";
import { v4 as uuidv4 } from "uuid";

interface EncounterResource {
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

		const encounterResource: EncounterResource = {
			resourceType: "Encounter",
			id: uuidv4(),
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const savedEncounter = DataService.create(encounterResource);

		return NextResponse.json(savedEncounter, { status: 201 });
	} catch (error) {
		console.error("Encounter API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create encounter" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const encounters = DataService.findAll<EncounterResource>("Encounter");

		return NextResponse.json({
			resourceType: "Bundle",
			type: "searchset",
			total: encounters.length,
			entry: encounters.map((encounter) => ({
				resource: encounter,
			})),
		});
	} catch (error) {
		console.error("Encounter API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch encounters" },
			{ status: 500 },
		);
	}
}