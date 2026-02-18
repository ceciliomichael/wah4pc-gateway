import { fromFHIRDateTime, toFHIRDateTime } from "./date-utils";

interface MedicationRequestFormData {
	status: string;
	intent: string;
	priority: string;
	medicationCode: string;
	medicationDisplay: string;
	patientId: string;
	patientDisplay: string;
	encounterId: string;
	authoredOn: string;
	requesterId: string;
	requesterDisplay: string;
	dosageInstruction: string;
	dispenseQuantity: string;
	notes: string;
}

interface FHIRMedicationRequest {
	resourceType?: string;
	id?: string;
	status: string;
	intent: string;
	priority?: string;
	medicationCodeableConcept: {
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
		text: string;
	};
	subject: {
		reference: string;
		display: string;
	};
	encounter?: {
		reference: string;
	};
	authoredOn?: string;
	requester?: {
		reference: string;
		display: string;
	};
	dosageInstruction?: Array<{
		text: string;
	}>;
	dispenseRequest?: {
		quantity: {
			value: number;
			unit: string;
			system: string;
			code: string;
		};
	};
	note?: Array<{
		text: string;
	}>;
	[key: string]: unknown;
}

export function fhirToFormData(
	medicationRequest: FHIRMedicationRequest,
): MedicationRequestFormData {
	const medicationCoding = medicationRequest.medicationCodeableConcept?.coding?.[0];
	const requesterRef = medicationRequest.requester?.reference || "";

	return {
		status: medicationRequest.status || "",
		intent: medicationRequest.intent || "",
		priority: medicationRequest.priority || "",
		medicationCode: medicationCoding?.code || "",
		medicationDisplay:
			medicationCoding?.display || medicationRequest.medicationCodeableConcept?.text || "",
		patientId: medicationRequest.subject?.reference?.split("/")[1] || "",
		patientDisplay: medicationRequest.subject?.display || "",
		encounterId: medicationRequest.encounter?.reference?.split("/")[1] || "",
		authoredOn: fromFHIRDateTime(medicationRequest.authoredOn || ""),
		requesterId: requesterRef.split("/")[1] || "",
		requesterDisplay: medicationRequest.requester?.display || "",
		dosageInstruction: medicationRequest.dosageInstruction?.[0]?.text || "",
		dispenseQuantity:
			medicationRequest.dispenseRequest?.quantity?.value?.toString() || "",
		notes: medicationRequest.note?.[0]?.text || "",
	};
}

export function buildFHIRMedicationRequest(
	formData: MedicationRequestFormData,
	patients: Array<{ code: string; display: string }>,
	practitioners: Array<{ code: string; display: string }>,
): Omit<FHIRMedicationRequest, "resourceType" | "id"> {
	const patientData = patients.find((patient) => patient.code === formData.patientId);
	const requesterData = practitioners.find(
		(practitioner) => practitioner.code === formData.requesterId,
	);

	const medicationRequest: Omit<FHIRMedicationRequest, "resourceType" | "id"> = {
		status: formData.status,
		intent: formData.intent,
		medicationCodeableConcept: {
			coding: [
				{
					system: "http://www.nlm.nih.gov/research/umls/rxnorm",
					code: formData.medicationCode,
					display: formData.medicationDisplay,
				},
			],
			text: formData.medicationDisplay,
		},
		subject: {
			reference: `Patient/${formData.patientId}`,
			display: patientData?.display || formData.patientDisplay,
		},
	};

	if (formData.priority) {
		medicationRequest.priority = formData.priority;
	}

	if (formData.encounterId) {
		medicationRequest.encounter = {
			reference: `Encounter/${formData.encounterId}`,
		};
	}

	if (formData.authoredOn) {
		medicationRequest.authoredOn = toFHIRDateTime(formData.authoredOn);
	}

	if (formData.requesterId) {
		medicationRequest.requester = {
			reference: `Practitioner/${formData.requesterId}`,
			display: requesterData?.display || formData.requesterDisplay,
		};
	}

	if (formData.dosageInstruction) {
		medicationRequest.dosageInstruction = [
			{
				text: formData.dosageInstruction,
			},
		];
	}

	if (formData.dispenseQuantity) {
		const quantityValue = Number.parseFloat(formData.dispenseQuantity);
		if (!Number.isNaN(quantityValue)) {
			medicationRequest.dispenseRequest = {
				quantity: {
					value: quantityValue,
					unit: "tablet",
					system: "http://unitsofmeasure.org",
					code: "{tbl}",
				},
			};
		}
	}

	if (formData.notes) {
		medicationRequest.note = [
			{
				text: formData.notes,
			},
		];
	}

	return medicationRequest;
}

export type { MedicationRequestFormData, FHIRMedicationRequest };
