import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/server/data-service";
import { v4 as uuidv4 } from "uuid";

interface AppointmentResource {
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

		const appointmentResource: AppointmentResource = {
			resourceType: "Appointment",
			id: uuidv4(),
			meta: {
				profile: ["http://hl7.org/fhir/StructureDefinition/Appointment"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const savedAppointment = DataService.create(appointmentResource);

		return NextResponse.json(savedAppointment, { status: 201 });
	} catch (error) {
		console.error("Appointment API Error:", error);
		return NextResponse.json(
			{ error: "Failed to create appointment" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const appointments = DataService.findAll<AppointmentResource>("Appointment");

		return NextResponse.json({
			resourceType: "Bundle",
			type: "searchset",
			total: appointments.length,
			entry: appointments.map((appointment) => ({
				resource: appointment,
			})),
		});
	} catch (error) {
		console.error("Appointment API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch appointments" },
			{ status: 500 },
		);
	}
}