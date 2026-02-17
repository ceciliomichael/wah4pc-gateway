import { toFHIRDateTime, fromFHIRDateTime } from "./date-utils";

interface ProcedureFormData {
	status: string;
	category: string;
	categoryDisplay: string;
	code: string;
	codeDisplay: string;
	patientId: string;
	patientDisplay: string;
	encounterId: string;
	performedDateTime: string;
	practitionerId: string;
	practitionerDisplay: string;
	location: string;
	reasonCode: string;
	outcome: string;
	notes: string;
}

interface FHIRProcedure {
	resourceType?: string;
	id?: string;
	status: string;
	category?: {
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
		text: string;
	};
	code: {
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
	performedDateTime: string;
	recorder?: {
		reference: string;
		display: string;
	};
	performer?: Array<{
		actor: {
			reference: string;
			display: string;
		};
	}>;
	location?: {
		display: string;
	};
	reasonCode?: Array<{
		text: string;
	}>;
	outcome?: {
		text: string;
	};
	note?: Array<{
		text: string;
	}>;
	[key: string]: unknown;
}

export function fhirToFormData(procedure: FHIRProcedure): ProcedureFormData {
	const categoryCoding = procedure.category?.coding?.[0];
	const codeCoding = procedure.code?.coding?.[0];
	const practitionerRef = procedure.performer?.[0]?.actor?.reference || procedure.recorder?.reference || "";
	const practitionerId = practitionerRef.split("/")[1] || "";

	return {
		status: procedure.status || "",
		category: categoryCoding?.code || "",
		categoryDisplay: categoryCoding?.display || procedure.category?.text || "",
		code: codeCoding?.code || "",
		codeDisplay: codeCoding?.display || procedure.code?.text || "",
		patientId: procedure.subject?.reference?.split("/")[1] || "",
		patientDisplay: procedure.subject?.display || "",
		encounterId: procedure.encounter?.reference?.split("/")[1] || "",
		performedDateTime: fromFHIRDateTime(procedure.performedDateTime || ""),
		practitionerId,
		practitionerDisplay: procedure.performer?.[0]?.actor?.display || procedure.recorder?.display || "",
		location: procedure.location?.display || "",
		reasonCode: procedure.reasonCode?.[0]?.text || "",
		outcome: procedure.outcome?.text || "",
		notes: procedure.note?.[0]?.text || "",
	};
}

export function buildFHIRProcedure(
	formData: ProcedureFormData,
	patients: Array<{ code: string; display: string }>,
	practitioners: Array<{ code: string; display: string }>,
): Omit<FHIRProcedure, "resourceType" | "id"> {
	const patientData = patients.find((p) => p.code === formData.patientId);
	const practitionerData = practitioners.find((p) => p.code === formData.practitionerId);

	const performedDateTime = toFHIRDateTime(formData.performedDateTime);
	
	const procedure: Omit<FHIRProcedure, "resourceType" | "id"> = {
		status: formData.status,
		code: {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: formData.code,
					display: formData.codeDisplay,
				},
			],
			text: formData.codeDisplay,
		},
		subject: {
			reference: `Patient/${formData.patientId}`,
			display: patientData?.display || formData.patientDisplay,
		},
		performedDateTime,
	};

	if (formData.category) {
		procedure.category = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: formData.category,
					display: formData.categoryDisplay,
				},
			],
			text: formData.categoryDisplay,
		};
	}

	if (formData.encounterId) {
		procedure.encounter = {
			reference: `Encounter/${formData.encounterId}`,
		};
	}

	if (formData.practitionerId) {
		procedure.recorder = {
			reference: `Practitioner/${formData.practitionerId}`,
			display: practitionerData?.display || formData.practitionerDisplay,
		};

		procedure.performer = [
			{
				actor: {
					reference: `Practitioner/${formData.practitionerId}`,
					display: practitionerData?.display || formData.practitionerDisplay,
				},
			},
		];
	}

	if (formData.location) {
		procedure.location = {
			display: formData.location,
		};
	}

	if (formData.reasonCode) {
		procedure.reasonCode = [
			{
				text: formData.reasonCode,
			},
		];
	}

	if (formData.outcome) {
		procedure.outcome = {
			text: formData.outcome,
		};
	}

	if (formData.notes) {
		procedure.note = [
			{
				text: formData.notes,
			},
		];
	}

	return procedure;
}

export type { ProcedureFormData, FHIRProcedure };