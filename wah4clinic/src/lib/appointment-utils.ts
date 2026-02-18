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
			reference?: string;
			type?: string;
			display?: string;
			identifier?: {
				system?: string;
				value?: string;
			};
		};
		required?: string;
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
	identifier?: Array<{
		system?: string;
		value?: string;
	}>;
}

interface Practitioner {
	id: string;
	name: Array<{
		prefix?: string[];
		family: string;
		given: string[];
	}>;
	identifier?: Array<{
		system?: string;
		value?: string;
	}>;
}

interface ParticipantLookupData {
	patients: Patient[];
	practitioners: Practitioner[];
}

interface ParticipantActor {
	reference?: string;
	display?: string;
	identifier?: {
		system?: string;
		value?: string;
	};
}

const APPOINTMENT_TYPE_MAP: Record<string, string> = {
	ROUTINE: "Routine appointment - default if not valued",
	WALKIN: "A previously unscheduled walk-in visit",
	CHECKUP: "A routine check-up, such as an annual physical",
	FOLLOWUP: "A follow up visit from a previous appointment",
	EMERGENCY: "Emergency appointment",
};

function normalizeText(value: string): string {
	return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractReferenceId(reference?: string): string {
	if (!reference) return "";
	const segments = reference.split("/");
	return segments.length > 1 ? segments[1] : "";
}

function getPatientDisplay(patient: Patient): string {
	const firstName = patient.name?.[0]?.given?.join(" ") || "";
	const lastName = patient.name?.[0]?.family || "";
	return `${firstName} ${lastName}`.trim();
}

function getPractitionerDisplay(practitioner: Practitioner): string {
	const prefix = practitioner.name?.[0]?.prefix?.[0] || "";
	const given = practitioner.name?.[0]?.given?.join(" ") || "";
	const family = practitioner.name?.[0]?.family || "";
	return `${prefix} ${given} ${family}`.trim();
}

function matchByIdentifier<T extends { id: string; identifier?: Array<{ system?: string; value?: string }> }>(
	resources: T[],
	actorIdentifier?: { system?: string; value?: string },
): string {
	if (!actorIdentifier?.value) return "";

	if (actorIdentifier.system) {
		const exactMatch = resources.find((resource) =>
			resource.identifier?.some(
				(identifier) =>
					identifier.system === actorIdentifier.system &&
					identifier.value === actorIdentifier.value,
			),
		);
		if (exactMatch) return exactMatch.id;
	}

	const idValueMatch = resources.find((resource) => resource.id === actorIdentifier.value);
	return idValueMatch?.id || "";
}

function matchByDisplay<T extends { id: string }>(
	resources: T[],
	actorDisplay: string | undefined,
	toDisplay: (resource: T) => string,
): string {
	if (!actorDisplay) return "";
	const normalizedActorDisplay = normalizeText(actorDisplay);
	if (!normalizedActorDisplay) return "";

	const matches = resources.filter(
		(resource) => normalizeText(toDisplay(resource)) === normalizedActorDisplay,
	);

	return matches.length === 1 ? matches[0].id : "";
}

function resolveParticipantId<T extends { id: string; identifier?: Array<{ system?: string; value?: string }> }>(
	actor: ParticipantActor | undefined,
	resources: T[],
	toDisplay: (resource: T) => string,
): string {
	const referenceId = extractReferenceId(actor?.reference);

	if (referenceId && resources.some((resource) => resource.id === referenceId)) {
		return referenceId;
	}

	const identifierMatch = matchByIdentifier(resources, actor?.identifier);
	if (identifierMatch) {
		return identifierMatch;
	}

	const displayMatch = matchByDisplay(resources, actor?.display, toDisplay);
	if (displayMatch) {
		return displayMatch;
	}

	return referenceId;
}

function isPatientParticipant(
	participant: FHIRAppointment["participant"][number],
): boolean {
	if (participant.actor?.type === "Patient") return true;
	return participant.actor?.reference?.startsWith("Patient/") || false;
}

function isPractitionerParticipant(
	participant: FHIRAppointment["participant"][number],
): boolean {
	if (participant.actor?.type === "Practitioner") return true;
	if (participant.actor?.reference?.startsWith("Practitioner/")) return true;
	return participant.type?.some((entry) =>
		entry.coding?.some((coding) => coding.code === "PPRF"),
	) || false;
}

export function fhirToFormData(
	appointment: FHIRAppointment,
	lookupData?: ParticipantLookupData,
): AppointmentFormData {
	const patientParticipant = appointment.participant?.find(
		(p) => isPatientParticipant(p),
	);
	const practitionerParticipant = appointment.participant?.find(
		(p) => isPractitionerParticipant(p),
	);

	const patientId = lookupData
		? resolveParticipantId(
				patientParticipant?.actor,
				lookupData.patients,
				getPatientDisplay,
		  )
		: extractReferenceId(patientParticipant?.actor?.reference);

	const practitionerId = lookupData
		? resolveParticipantId(
				practitionerParticipant?.actor,
				lookupData.practitioners,
				getPractitionerDisplay,
		  )
		: extractReferenceId(practitionerParticipant?.actor?.reference);

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
