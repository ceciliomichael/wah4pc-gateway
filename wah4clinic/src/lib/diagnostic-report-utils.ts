import { fromFHIRDateTime, toFHIRDateTime } from "./date-utils";

interface DiagnosticReportFormData {
	status: string;
	categoryCode: string;
	categoryDisplay: string;
	code: string;
	codeDisplay: string;
	patientId: string;
	patientDisplay: string;
	encounterId: string;
	effectiveDateTime: string;
	issuedDateTime: string;
	performerId: string;
	performerDisplay: string;
	resultObservationIds: string;
	conclusion: string;
}

interface FHIRDiagnosticReport {
	resourceType?: string;
	id?: string;
	status: string;
	category?: Array<{
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
		text?: string;
	}>;
	code: {
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
		text: string;
	};
	subject?: {
		reference: string;
		display: string;
	};
	encounter?: {
		reference: string;
	};
	effectiveDateTime?: string;
	issued?: string;
	performer?: Array<{
		reference: string;
		display: string;
	}>;
	result?: Array<{
		reference: string;
	}>;
	conclusion?: string;
	[key: string]: unknown;
}

export function fhirToFormData(
	diagnosticReport: FHIRDiagnosticReport,
): DiagnosticReportFormData {
	const categoryCoding = diagnosticReport.category?.[0]?.coding?.[0];
	const codeCoding = diagnosticReport.code?.coding?.[0];
	const performerRef = diagnosticReport.performer?.[0]?.reference || "";
	const resultObservationIds = (diagnosticReport.result || [])
		.map((result) => result.reference.replace("Observation/", ""))
		.join(", ");

	return {
		status: diagnosticReport.status || "",
		categoryCode: categoryCoding?.code || "",
		categoryDisplay: categoryCoding?.display || diagnosticReport.category?.[0]?.text || "",
		code: codeCoding?.code || "",
		codeDisplay: codeCoding?.display || diagnosticReport.code?.text || "",
		patientId: diagnosticReport.subject?.reference?.split("/")[1] || "",
		patientDisplay: diagnosticReport.subject?.display || "",
		encounterId: diagnosticReport.encounter?.reference?.split("/")[1] || "",
		effectiveDateTime: fromFHIRDateTime(diagnosticReport.effectiveDateTime || ""),
		issuedDateTime: fromFHIRDateTime(diagnosticReport.issued || ""),
		performerId: performerRef.split("/")[1] || "",
		performerDisplay: diagnosticReport.performer?.[0]?.display || "",
		resultObservationIds,
		conclusion: diagnosticReport.conclusion || "",
	};
}

export function buildFHIRDiagnosticReport(
	formData: DiagnosticReportFormData,
	patients: Array<{ code: string; display: string }>,
	practitioners: Array<{ code: string; display: string }>,
): Omit<FHIRDiagnosticReport, "resourceType" | "id"> {
	const patientData = patients.find((patient) => patient.code === formData.patientId);
	const performerData = practitioners.find(
		(practitioner) => practitioner.code === formData.performerId,
	);

	const diagnosticReport: Omit<FHIRDiagnosticReport, "resourceType" | "id"> = {
		status: formData.status,
		code: {
			coding: [
				{
					system: "http://loinc.org",
					code: formData.code,
					display: formData.codeDisplay,
				},
			],
			text: formData.codeDisplay,
		},
	};

	if (formData.categoryCode) {
		diagnosticReport.category = [
			{
				coding: [
					{
						system: "http://terminology.hl7.org/CodeSystem/v2-0074",
						code: formData.categoryCode,
						display: formData.categoryDisplay,
					},
				],
				text: formData.categoryDisplay,
			},
		];
	}

	if (formData.patientId) {
		diagnosticReport.subject = {
			reference: `Patient/${formData.patientId}`,
			display: patientData?.display || formData.patientDisplay,
		};
	}

	if (formData.encounterId) {
		diagnosticReport.encounter = {
			reference: `Encounter/${formData.encounterId}`,
		};
	}

	if (formData.effectiveDateTime) {
		diagnosticReport.effectiveDateTime = toFHIRDateTime(formData.effectiveDateTime);
	}

	if (formData.issuedDateTime) {
		diagnosticReport.issued = toFHIRDateTime(formData.issuedDateTime);
	}

	if (formData.performerId) {
		diagnosticReport.performer = [
			{
				reference: `Practitioner/${formData.performerId}`,
				display: performerData?.display || formData.performerDisplay,
			},
		];
	}

	if (formData.resultObservationIds) {
		const references = formData.resultObservationIds
			.split(",")
			.map((value) => value.trim())
			.filter((value) => value.length > 0);

		if (references.length > 0) {
			diagnosticReport.result = references.map((observationId) => ({
				reference: `Observation/${observationId}`,
			}));
		}
	}

	if (formData.conclusion) {
		diagnosticReport.conclusion = formData.conclusion;
	}

	return diagnosticReport;
}

export type { DiagnosticReportFormData, FHIRDiagnosticReport };
