import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const procedure = DataService.findById<ProcedureResource>("Procedure", id);

		if (!procedure) {
			return NextResponse.json(
				{ error: "Procedure not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(procedure);
	} catch (error) {
		console.error("Procedure API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch procedure" },
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

		const procedureResource: ProcedureResource = {
			resourceType: "Procedure",
			id,
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-procedure"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const updatedProcedure = DataService.update(procedureResource);

		if (!updatedProcedure) {
			return NextResponse.json(
				{ error: "Procedure not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(updatedProcedure);
	} catch (error) {
		console.error("Procedure API Error:", error);
		return NextResponse.json(
			{ error: "Failed to update procedure" },
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
		const deleted = DataService.delete("Procedure", id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Procedure not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Procedure API Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete procedure" },
			{ status: 500 },
		);
	}
}