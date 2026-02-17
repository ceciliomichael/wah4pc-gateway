import { toFHIRDateTime, fromFHIRDateTime } from "./date-utils";

interface AppointmentFormData {
	status: string;
	appointmentType: string;
	patientId: string;
	practitionerId: string;
	start: string;
	end: string;
	description: string;
	comment: string;
}

interface FHIRAppointment {
	resourceType?: string;
	id?: string;
	status: string;
	appointmentType?: {
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
	};
	description?: string;
	start?: string;
	end?: string;
	minutesDuration?: number;
	comment?: string;
	participant: Array<{
		type?: Array<{
			coding: Array<{
				system: string;
				code: string;
				display: string;
			}>;
		}>;
		actor: {
			reference: string;
			type: string;
			display: string;
		};
		required: string;
		status: string;
	}>;
	[key: string]: unknown;
}

interface Patient {
	id: string;
	name: Array<{
		family: string;
		given: string[];
	}>;
}

interface Practitioner {
	id: string;
	name: Array<{
		prefix?: string[];
		family: string;
		given: string[];
	}>;
}

const APPOINTMENT_TYPE_MAP: Record<string, string> = {
	ROUTINE: "Routine appointment - default if not valued",
	WALKIN: "A previously unscheduled walk-in visit",
	CHECKUP: "A routine check-up, such as an annual physical",
	FOLLOWUP: "A follow up visit from a previous appointment",
	EMERGENCY: "Emergency appointment",
};

export function fhirToFormData(appointment: FHIRAppointment): AppointmentFormData {
	const patientParticipant = appointment.participant?.find(
		(p) => p.actor?.type === "Patient"
	);
	const practitionerParticipant = appointment.participant?.find(
		(p) => p.actor?.type === "Practitioner" && p.type?.[0]?.coding?.[0]?.code === "PPRF"
	);

	const patientRef = patientParticipant?.actor?.reference || "";
	const patientId = patientRef.split("/")[1] || "";

	const practitionerRef = practitionerParticipant?.actor?.reference || "";
	const practitionerId = practitionerRef.split("/")[1] || "";

	return {
		status: appointment.status || "",
		appointmentType: appointment.appointmentType?.coding?.[0]?.code || "",
		patientId,
		practitionerId,
		start: fromFHIRDateTime(appointment.start || ""),
		end: fromFHIRDateTime(appointment.end || ""),
		description: appointment.description || "",
		comment: appointment.comment || "",
	};
}

export function buildFHIRAppointment(
	formData: AppointmentFormData,
	patients: Patient[],
	practitioners: Practitioner[],
): Omit<FHIRAppointment, "resourceType" | "id"> {
	const patient = patients.find((p) => p.id === formData.patientId);
	const practitioner = practitioners.find((p) => p.id === formData.practitionerId);

	const patientName = patient
		? `${patient.name[0].given.join(" ")} ${patient.name[0].family}`
		: "Unknown Patient";

	const practitionerName = practitioner
		? `${practitioner.name[0].prefix?.[0] || ""} ${practitioner.name[0].given.join(" ")} ${practitioner.name[0].family}`.trim()
		: "Unknown Practitioner";

	const participant: FHIRAppointment["participant"] = [];

	if (formData.patientId) {
		participant.push({
			actor: {
				reference: `Patient/${formData.patientId}`,
				type: "Patient",
				display: patientName,
			},
			required: "required",
			status: "accepted",
		});
	}

	if (formData.practitionerId) {
		participant.push({
			type: [
				{
					coding: [
						{
							system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
							code: "PPRF",
							display: "primary performer",
						},
					],
				},
			],
			actor: {
				reference: `Practitioner/${formData.practitionerId}`,
				type: "Practitioner",
				display: practitionerName,
			},
			required: "required",
			status: "accepted",
		});
	}

	const appointment: Omit<FHIRAppointment, "resourceType" | "id"> = {
		status: formData.status,
		participant,
	};

	if (formData.appointmentType) {
		appointment.appointmentType = {
			coding: [
				{
					system: "http://terminology.hl7.org/CodeSystem/v2-0276",
					code: formData.appointmentType,
					display: APPOINTMENT_TYPE_MAP[formData.appointmentType] || formData.appointmentType,
				},
			],
		};
	}

	if (formData.description) {
		appointment.description = formData.description;
	}

	if (formData.start) {
		const startDateTime = toFHIRDateTime(formData.start);
		if (startDateTime) {
			appointment.start = startDateTime;
		}
	}

	if (formData.end) {
		const endDateTime = toFHIRDateTime(formData.end);
		if (endDateTime) {
			appointment.end = endDateTime;
		}
	}

	if (formData.start && formData.end) {
		const startDate = new Date(formData.start);
		const endDate = new Date(formData.end);
		const durationMs = endDate.getTime() - startDate.getTime();
		const durationMinutes = Math.round(durationMs / 60000);
		if (durationMinutes > 0) {
			appointment.minutesDuration = durationMinutes;
		}
	}

	if (formData.comment) {
		appointment.comment = formData.comment;
	}

	return appointment;
}

export type { AppointmentFormData, FHIRAppointment, Patient, Practitioner };