import { NextRequest, NextResponse } from "next/server";
import type { SourceTrackedResource } from "@/lib/integration-types";
import { syncUpdatedAppointmentToOrigin } from "@/lib/server/appointment-origin-sync";
import { DataService } from "@/lib/server/data-service";

type AppointmentResource = SourceTrackedResource & {
	id: string;
	meta: {
		profile: string[];
		lastUpdated: string;
	};
};

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const appointment = DataService.findById<AppointmentResource>("Appointment", id);

		if (!appointment) {
			return NextResponse.json(
				{ error: "Appointment not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(appointment);
	} catch (error) {
		console.error("Appointment API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch appointment" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();

		const appointmentResource: AppointmentResource = {
			resourceType: "Appointment",
			id,
			meta: {
				profile: ["http://hl7.org/fhir/StructureDefinition/Appointment"],
				lastUpdated: new Date().toISOString(),
			},
			...body,
		};

		const updatedAppointment = DataService.update(appointmentResource);

		if (!updatedAppointment) {
			return NextResponse.json(
				{ error: "Appointment not found" },
				{ status: 404 }
			);
		}

		const integrationSync = await syncUpdatedAppointmentToOrigin(
			updatedAppointment,
		);

		return NextResponse.json({
			...updatedAppointment,
			integrationSync,
		});
	} catch (error) {
		console.error("Appointment API Error:", error);
		return NextResponse.json(
			{ error: "Failed to update appointment" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const deleted = DataService.delete("Appointment", id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Appointment not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Appointment API Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete appointment" },
			{ status: 500 }
		);
	}
}
