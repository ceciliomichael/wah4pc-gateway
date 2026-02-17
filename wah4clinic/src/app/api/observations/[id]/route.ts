import { NextResponse } from "next/server";
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

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const observation = DataService.findById<ObservationResource>("Observation", id);

		if (!observation) {
			return NextResponse.json(
				{ error: "Observation not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(observation);
	} catch (error) {
		console.error("Observation API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch observation" },
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

		const observationResource: ObservationResource = {
			resourceType: "Observation",
			id,
			meta: {
				profile: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const updatedObservation = DataService.update(observationResource);

		if (!updatedObservation) {
			return NextResponse.json(
				{ error: "Observation not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(updatedObservation);
	} catch (error) {
		console.error("Observation API Error:", error);
		return NextResponse.json(
			{ error: "Failed to update observation" },
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
		const deleted = DataService.delete("Observation", id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Observation not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Observation API Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete observation" },
			{ status: 500 },
		);
	}
}