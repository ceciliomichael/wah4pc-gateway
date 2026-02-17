import { NextResponse } from "next/server";
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

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const immunization = DataService.findById<ImmunizationResource>("Immunization", id);

		if (!immunization) {
			return NextResponse.json(
				{ error: "Immunization not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(immunization);
	} catch (error) {
		console.error("Immunization API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch immunization" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();

		const immunizationResource: ImmunizationResource = {
			resourceType: "Immunization",
			id,
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-immunization"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const updatedImmunization = DataService.update(immunizationResource);

		if (!updatedImmunization) {
			return NextResponse.json(
				{ error: "Immunization not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(updatedImmunization);
	} catch (error) {
		console.error("Immunization API Error:", error);
		return NextResponse.json(
			{ error: "Failed to update immunization" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const deleted = DataService.delete("Immunization", id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Immunization not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Immunization API Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete immunization" },
			{ status: 500 },
		);
	}
}