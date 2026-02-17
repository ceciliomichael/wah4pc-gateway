import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";

interface EncounterResource {
	resourceType: string;
	id: string;
	meta: {
		profile: string[];
		lastUpdated: string;
	};
	[key: string]: unknown;
}

interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const encounter = DataService.findById<EncounterResource>("Encounter", id);

		if (!encounter) {
			return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
		}

		return NextResponse.json(encounter);
	} catch (error) {
		console.error("Encounter API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch encounter" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const body = await request.json();

		const encounterResource: EncounterResource = {
			resourceType: "Encounter",
			id,
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const updatedEncounter = DataService.update(encounterResource);

		if (!updatedEncounter) {
			return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
		}

		return NextResponse.json(updatedEncounter);
	} catch (error) {
		console.error("Encounter API Error:", error);
		return NextResponse.json(
			{ error: "Failed to update encounter" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const deleted = DataService.delete("Encounter", id);

		if (!deleted) {
			return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Encounter API Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete encounter" },
			{ status: 500 },
		);
	}
}