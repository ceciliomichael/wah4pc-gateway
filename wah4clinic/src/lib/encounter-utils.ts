import { toFHIRDateTime, fromFHIRDateTime } from "./date-utils";

interface EncounterFormData {
	status: string;
	class: string;
	type: string;
	patientId: string;
	practitionerId: string;
	periodStart: string;
	periodEnd: string;
	reasonCode: string;
	location: string;
}

interface FHIREncounter {
	resourceType?: string;
	id?: string;
	status: string;
	class: {
		system: string;
		code: string;
		display: string;
	};
	type?: Array<{
		text: string;
	}>;
	subject: {
		reference: string;
		type: string;
		display: string;
	};
	participant?: Array<{
		type: Array<{
			coding: Array<{
				system: string;
				code: string;
				display: string;
			}>;
		}>;
		individual: {
			reference: string;
			type: string;
			display: string;
		};
	}>;
	period?: {
		start: string;
		end?: string;
	};
	reasonCode?: Array<{
		text: string;
	}>;
	location?: Array<{
		location: {
			display: string;
		};
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

const ENCOUNTER_CLASS_MAP: Record<string, string> = {
	AMB: "ambulatory",
	EMER: "emergency",
	IMP: "inpatient",
	VR: "virtual",
};

export function fhirToFormData(encounter: FHIREncounter): EncounterFormData {
	const patientRef = encounter.subject?.reference || "";
	const patientId = patientRef.split("/")[1] || "";

	const practitionerRef = encounter.participant?.[0]?.individual?.reference || "";
	const practitionerId = practitionerRef.split("/")[1] || "";

	return {
		status: encounter.status || "",
		class: encounter.class?.code || encounter.class?.display || "",
		type: encounter.type?.[0]?.text || "",
		patientId,
		practitionerId,
		periodStart: fromFHIRDateTime(encounter.period?.start || ""),
		periodEnd: fromFHIRDateTime(encounter.period?.end || ""),
		reasonCode: encounter.reasonCode?.[0]?.text || "",
		location: encounter.location?.[0]?.location?.display || "",
	};
}

export function buildFHIREncounter(
	formData: EncounterFormData,
	patients: Patient[],
	practitioners: Practitioner[],
): Omit<FHIREncounter, "resourceType" | "id"> {
	const patient = patients.find((p) => p.id === formData.patientId);
	const practitioner = practitioners.find((p) => p.id === formData.practitionerId);

	const patientName = patient
		? `${patient.name[0].given.join(" ")} ${patient.name[0].family}`
		: "Unknown Patient";

	const practitionerName = practitioner
		? `${practitioner.name[0].prefix?.[0] || ""} ${practitioner.name[0].given.join(" ")} ${practitioner.name[0].family}`.trim()
		: "Unknown Practitioner";

	const encounter: Omit<FHIREncounter, "resourceType" | "id"> = {
		status: formData.status,
		class: {
			system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
			code: formData.class,
			display: ENCOUNTER_CLASS_MAP[formData.class] || formData.class,
		},
		subject: {
			reference: `Patient/${formData.patientId}`,
			type: "Patient",
			display: patientName,
		},
	};

	if (formData.type) {
		encounter.type = [{ text: formData.type }];
	}

	if (formData.practitionerId) {
		encounter.participant = [
			{
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
				individual: {
					reference: `Practitioner/${formData.practitionerId}`,
					type: "Practitioner",
					display: practitionerName,
				},
			},
		];
	}

	if (formData.periodStart) {
		const startDateTime = toFHIRDateTime(formData.periodStart);
		const endDateTime = formData.periodEnd ? toFHIRDateTime(formData.periodEnd) : undefined;
		
		if (startDateTime) {
			encounter.period = {
				start: startDateTime,
				...(endDateTime && { end: endDateTime }),
			};
		}
	}

	if (formData.reasonCode) {
		encounter.reasonCode = [{ text: formData.reasonCode }];
	}

	if (formData.location) {
		encounter.location = [
			{
				location: {
					display: formData.location,
				},
			},
		];
	}

	return encounter;
}

export type { EncounterFormData, FHIREncounter, Patient, Practitioner };
