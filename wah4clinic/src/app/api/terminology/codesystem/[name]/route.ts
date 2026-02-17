import { NextRequest, NextResponse } from "next/server";
import { FhirService } from "@/lib/server/fhir-service";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ name: string }> },
) {
	try {
		const { name } = await params;
		const searchParams = request.nextUrl.searchParams;
		const limit = Number.parseInt(searchParams.get("limit") || "1000", 10);
		const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

		const concepts = FhirService.getCodeSystem(name);

		const slicedConcepts = concepts.slice(offset, offset + limit);

		return NextResponse.json({
			name,
			count: concepts.length,
			returned: slicedConcepts.length,
			offset,
			limit,
			data: slicedConcepts,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error("CodeSystem API Error:", errorMessage);

		if (errorMessage.includes("Unknown CodeSystem")) {
			return NextResponse.json(
				{ error: errorMessage },
				{ status: 404 },
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}