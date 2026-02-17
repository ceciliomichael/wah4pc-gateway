import { NextRequest, NextResponse } from "next/server";
import { FhirService } from "@/lib/server/fhir-service";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const level = searchParams.get("level");
		const parent = searchParams.get("parent");

		if (!level) {
			return NextResponse.json(
				{ error: "Missing required parameter: level" },
				{ status: 400 },
			);
		}

		const validLevels = ["region", "province", "city", "municipality", "barangay"];
		if (!validLevels.includes(level)) {
			return NextResponse.json(
				{ error: `Invalid level. Must be one of: ${validLevels.join(", ")}` },
				{ status: 400 },
			);
		}

		const results = FhirService.getPSGC(level, parent || undefined);

		return NextResponse.json({
			level,
			parent: parent || null,
			count: results.length,
			data: results,
		});
	} catch (error) {
		console.error("PSGC API Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}