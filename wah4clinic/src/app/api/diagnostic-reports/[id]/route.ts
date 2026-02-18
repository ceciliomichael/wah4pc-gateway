import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";

interface DiagnosticReportResource {
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
		const diagnosticReport = DataService.findById<DiagnosticReportResource>("DiagnosticReport", id);

		if (!diagnosticReport) {
			return NextResponse.json(
				{ error: "Diagnostic report not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(diagnosticReport);
	} catch (error) {
		console.error("DiagnosticReport API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch diagnostic report" },
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

		const diagnosticReportResource: DiagnosticReportResource = {
			resourceType: "DiagnosticReport",
			id,
			meta: {
				profile: ["http://hl7.org/fhir/StructureDefinition/DiagnosticReport"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const updatedDiagnosticReport = DataService.update(diagnosticReportResource);

		if (!updatedDiagnosticReport) {
			return NextResponse.json(
				{ error: "Diagnostic report not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(updatedDiagnosticReport);
	} catch (error) {
		console.error("DiagnosticReport API Error:", error);
		return NextResponse.json(
			{ error: "Failed to update diagnostic report" },
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
		const deleted = DataService.delete("DiagnosticReport", id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Diagnostic report not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("DiagnosticReport API Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete diagnostic report" },
			{ status: 500 },
		);
	}
}
