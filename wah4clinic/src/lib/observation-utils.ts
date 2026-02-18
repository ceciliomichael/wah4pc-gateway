import { toFHIRDateTime, fromFHIRDateTime } from "./date-utils";

interface ObservationFormData {
	status: string;
	categoryCode: string;
	categoryDisplay: string;
	code: string;
	codeDisplay: string;
	patientId: string;
	patientDisplay: string;
	encounterId: string;
	effectiveDateTime: string;
	practitionerId: string;
	practitionerDisplay: string;
	// For simple observations (single value)
	valueQuantity: string;
	valueUnit: string;
	// For component-based observations (e.g., Blood Pressure)
	systolicValue: string;
	diastolicValue: string;
	// Common fields
	interpretation: string;
	interpretationDisplay: string;
	notes: string;
}

interface FHIRObservation {
	resourceType?: string;
	id?: string;
	status: string;
	category: Array<{
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
	}>;
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
	effectiveDateTime: string;
	issued?: string;
	performer?: Array<{
		reference: string;
		display: string;
	}>;
	valueQuantity?: {
		value: number;
		unit: string;
		system: string;
		code: string;
	};
	component?: Array<{
		code: {
			coding: Array<{
				system: string;
				code: string;
				display: string;
			}>;
		};
		valueQuantity: {
			value: number;
			unit: string;
			system: string;
			code: string;
		};
	}>;
	interpretation?: Array<{
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
		text: string;
	}>;
	note?: Array<{
		text: string;
	}>;
	[key: string]: unknown;
}

export function fhirToFormData(observation: FHIRObservation): ObservationFormData {
	const categoryCoding = observation.category?.[0]?.coding?.[0];
	const codeCoding = observation.code?.coding?.[0];
	const interpretationCoding = observation.interpretation?.[0]?.coding?.[0];
	const practitionerRef = observation.performer?.[0]?.reference || "";
	const practitionerId = practitionerRef.split("/")[1] || "";

	// Extract component values for Blood Pressure
	let systolicValue = "";
	let diastolicValue = "";
	if (observation.component && observation.component.length > 0) {
		const systolicComponent = observation.component.find(
			(c) => c.code?.coding?.[0]?.code === "8480-6"
		);
		const diastolicComponent = observation.component.find(
			(c) => c.code?.coding?.[0]?.code === "8462-4"
		);
		systolicValue = systolicComponent?.valueQuantity?.value?.toString() || "";
		diastolicValue = diastolicComponent?.valueQuantity?.value?.toString() || "";
	}

	return {
		status: observation.status || "",
		categoryCode: categoryCoding?.code || categoryCoding?.display || "",
		categoryDisplay: categoryCoding?.display || "",
		code: codeCoding?.code || codeCoding?.display || observation.code?.text || "",
		codeDisplay: codeCoding?.display || observation.code?.text || "",
		patientId: observation.subject?.reference?.split("/")[1] || "",
		patientDisplay: observation.subject?.display || "",
		encounterId: observation.encounter?.reference?.split("/")[1] || "",
		effectiveDateTime: fromFHIRDateTime(observation.effectiveDateTime || ""),
		practitionerId,
		practitionerDisplay: observation.performer?.[0]?.display || "",
		valueQuantity: observation.valueQuantity?.value?.toString() || "",
		valueUnit: observation.valueQuantity?.unit || "",
		systolicValue,
		diastolicValue,
		interpretation: interpretationCoding?.code || interpretationCoding?.display || observation.interpretation?.[0]?.text || "",
		interpretationDisplay: interpretationCoding?.display || observation.interpretation?.[0]?.text || "",
		notes: observation.note?.[0]?.text || "",
	};
}

export function buildFHIRObservation(
	formData: ObservationFormData,
	patients: Array<{ code: string; display: string }>,
	practitioners: Array<{ code: string; display: string }>,
): Omit<FHIRObservation, "resourceType" | "id"> {
	const patientData = patients.find((p) => p.code === formData.patientId);
	const practitionerData = practitioners.find((p) => p.code === formData.practitionerId);

	const effectiveDateTime = toFHIRDateTime(formData.effectiveDateTime);

	const observation: Omit<FHIRObservation, "resourceType" | "id"> = {
		status: formData.status,
		category: [
			{
				coding: [
					{
						system: "http://terminology.hl7.org/CodeSystem/observation-category",
						code: formData.categoryCode,
					},
				],
			},
		],
		code: {
			coding: [
				{
					code: formData.code,
					system: "http://loinc.org",
					display: formData.codeDisplay,
				},
			],
			text: formData.codeDisplay,
		},
		subject: {
			reference: `Patient/${formData.patientId}`,
			display: patientData?.display || formData.patientDisplay,
		},
		effectiveDateTime,
		issued: new Date().toISOString(),
	};

	if (formData.encounterId) {
		observation.encounter = {
			reference: `Encounter/${formData.encounterId}`,
		};
	}

	if (formData.practitionerId) {
		observation.performer = [
			{
				reference: `Practitioner/${formData.practitionerId}`,
				display: practitionerData?.display || formData.practitionerDisplay,
			},
		];
	}

	// Handle Blood Pressure (component-based) vs simple observations
	const isBloodPressure = formData.code === "85354-9";
	
	if (isBloodPressure && formData.systolicValue && formData.diastolicValue) {
		// Blood Pressure uses components
		observation.component = [
			{
				code: {
					coding: [
						{
							code: "8480-6",
							system: "http://loinc.org",
							display: "Systolic blood pressure",
						},
					],
				},
				valueQuantity: {
					value: Number.parseFloat(formData.systolicValue),
					unit: "mmHg",
					system: "http://unitsofmeasure.org",
					code: "mm[Hg]",
				},
			},
			{
				code: {
					coding: [
						{
							code: "8462-4",
							system: "http://loinc.org",
							display: "Diastolic blood pressure",
						},
					],
				},
				valueQuantity: {
					value: Number.parseFloat(formData.diastolicValue),
					unit: "mmHg",
					system: "http://unitsofmeasure.org",
					code: "mm[Hg]",
				},
			},
		];
	} else if (formData.valueQuantity && formData.valueUnit) {
		// Simple observation with single value
		const value = Number.parseFloat(formData.valueQuantity);
		if (!Number.isNaN(value)) {
			observation.valueQuantity = {
				value,
				unit: formData.valueUnit,
				system: "http://unitsofmeasure.org",
				code: formData.valueUnit,
			};
		}
	}

	if (formData.interpretation) {
		observation.interpretation = [
			{
				coding: [
					{
						code: formData.interpretation,
						system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
						display: formData.interpretationDisplay,
					},
				],
				text: formData.interpretationDisplay,
			},
		];
	}

	if (formData.notes) {
		observation.note = [
			{
				text: formData.notes,
			},
		];
	}

	return observation;
}

export type { ObservationFormData, FHIRObservation };
