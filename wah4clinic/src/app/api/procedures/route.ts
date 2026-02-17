import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { DataService } from "@/lib/server/data-service";

interface ProcedureResource {
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
		const procedures = DataService.findAll<ProcedureResource>("Procedure");

		const bundle = {
			resourceType: "Bundle",
			type: "searchset",
			total: procedures.length,
			entry: procedures.map((procedure) => ({
				resource: procedure,
			})),
		};

		return NextResponse.json(bundle);
	} catch (error) {
		console.error("Procedure API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch procedures" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const procedureResource: ProcedureResource = {
			resourceType: "Procedure",
			id: randomUUID(),
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-procedure"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const createdProcedure = DataService.create(procedureResource);

		return NextResponse.json(createdProcedure, { status: 201 });
	} catch (error) {
		console.error("Procedure API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create procedure" },
			{ status: 500 },
		);
	}
}