import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
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

export async function GET() {
	try {
		const diagnosticReports = DataService.findAll<DiagnosticReportResource>("DiagnosticReport");

		const bundle = {
			resourceType: "Bundle",
			type: "searchset",
			total: diagnosticReports.length,
			entry: diagnosticReports.map((diagnosticReport) => ({
				resource: diagnosticReport,
			})),
		};

		return NextResponse.json(bundle);
	} catch (error) {
		console.error("DiagnosticReport API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch diagnostic reports" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const diagnosticReportResource: DiagnosticReportResource = {
			resourceType: "DiagnosticReport",
			id: randomUUID(),
			meta: {
				profile: ["http://hl7.org/fhir/StructureDefinition/DiagnosticReport"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const createdDiagnosticReport = DataService.create(diagnosticReportResource);

		return NextResponse.json(createdDiagnosticReport, { status: 201 });
	} catch (error) {
		console.error("DiagnosticReport API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create diagnostic report" },
			{ status: 500 },
		);
	}
}
