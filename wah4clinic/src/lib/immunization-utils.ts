import { toFHIRDateTime, fromFHIRDateTime } from "./date-utils";

interface ImmunizationFormData {
	status: string;
	vaccineCode: string;
	vaccineDisplay: string;
	patientId: string;
	patientDisplay: string;
	encounterId: string;
	occurrenceDateTime: string;
	practitionerId: string;
	practitionerDisplay: string;
	site: string;
	siteDisplay: string;
	route: string;
	routeDisplay: string;
	doseValue: string;
	doseUnit: string;
	lotNumber: string;
	expirationDate: string;
	manufacturer: string;
	location: string;
	notes: string;
}

interface FHIRImmunization {
	resourceType?: string;
	id?: string;
	status: string;
	vaccineCode: {
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
		text: string;
	};
	patient: {
		reference: string;
		display: string;
	};
	encounter?: {
		reference: string;
	};
	occurrenceDateTime: string;
	primarySource?: boolean;
	location?: {
		display: string;
	};
	manufacturer?: {
		display: string;
	};
	lotNumber?: string;
	expirationDate?: string;
	site?: {
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
	};
	route?: {
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
	};
	doseQuantity?: {
		value: number;
		unit: string;
		system: string;
		code: string;
	};
	performer?: Array<{
		function?: {
			coding: Array<{
				system: string;
				code: string;
				display: string;
			}>;
		};
		actor: {
			reference: string;
			display: string;
		};
	}>;
	note?: Array<{
		text: string;
	}>;
	[key: string]: unknown;
}

export function fhirToFormData(immunization: FHIRImmunization): ImmunizationFormData {
	const vaccineCoding = immunization.vaccineCode?.coding?.[0];
	const siteCoding = immunization.site?.coding?.[0];
	const routeCoding = immunization.route?.coding?.[0];
	const practitionerRef = immunization.performer?.[0]?.actor?.reference || "";
	const practitionerId = practitionerRef.split("/")[1] || "";

	return {
		status: immunization.status || "",
		vaccineCode: vaccineCoding?.code || vaccineCoding?.display || immunization.vaccineCode?.text || "",
		vaccineDisplay: vaccineCoding?.display || immunization.vaccineCode?.text || "",
		patientId: immunization.patient?.reference?.split("/")[1] || "",
		patientDisplay: immunization.patient?.display || "",
		encounterId: immunization.encounter?.reference?.split("/")[1] || "",
		occurrenceDateTime: fromFHIRDateTime(immunization.occurrenceDateTime || ""),
		practitionerId,
		practitionerDisplay: immunization.performer?.[0]?.actor?.display || "",
		site: siteCoding?.code || siteCoding?.display || "",
		siteDisplay: siteCoding?.display || "",
		route: routeCoding?.code || routeCoding?.display || "",
		routeDisplay: routeCoding?.display || "",
		doseValue: immunization.doseQuantity?.value?.toString() || "",
		doseUnit: immunization.doseQuantity?.unit || "",
		lotNumber: immunization.lotNumber || "",
		expirationDate: immunization.expirationDate || "",
		manufacturer: immunization.manufacturer?.display || "",
		location: immunization.location?.display || "",
		notes: immunization.note?.[0]?.text || "",
	};
}

export function buildFHIRImmunization(
	formData: ImmunizationFormData,
	patients: Array<{ code: string; display: string }>,
	practitioners: Array<{ code: string; display: string }>,
): Omit<FHIRImmunization, "resourceType" | "id"> {
	const patientData = patients.find((p) => p.code === formData.patientId);
	const practitionerData = practitioners.find((p) => p.code === formData.practitionerId);

	const occurrenceDateTime = toFHIRDateTime(formData.occurrenceDateTime);

	const immunization: Omit<FHIRImmunization, "resourceType" | "id"> = {
		status: formData.status,
		vaccineCode: {
			coding: [
				{
					system: "http://hl7.org/fhir/sid/cvx",
					code: formData.vaccineCode,
					display: formData.vaccineDisplay,
				},
			],
			text: formData.vaccineDisplay,
		},
		patient: {
			reference: `Patient/${formData.patientId}`,
			display: patientData?.display || formData.patientDisplay,
		},
		occurrenceDateTime,
		primarySource: true,
	};

	if (formData.encounterId) {
		immunization.encounter = {
			reference: `Encounter/${formData.encounterId}`,
		};
	}

	if (formData.site) {
		immunization.site = {
			coding: [
				{
					system: "http://terminology.hl7.org/CodeSystem/v3-ActSite",
					code: formData.site,
					display: formData.siteDisplay,
				},
			],
		};
	}

	if (formData.route) {
		immunization.route = {
			coding: [
				{
					system: "http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration",
					code: formData.route,
					display: formData.routeDisplay,
				},
			],
		};
	}

	if (formData.doseValue && formData.doseUnit) {
		const value = Number.parseFloat(formData.doseValue);
		if (!Number.isNaN(value)) {
			immunization.doseQuantity = {
				value,
				unit: formData.doseUnit,
				system: "http://unitsofmeasure.org",
				code: formData.doseUnit,
			};
		}
	}

	if (formData.practitionerId) {
		immunization.performer = [
			{
				function: {
					coding: [
						{
							system: "http://terminology.hl7.org/CodeSystem/v2-0443",
							code: "AP",
							display: "Administering Provider",
						},
					],
				},
				actor: {
					reference: `Practitioner/${formData.practitionerId}`,
					display: practitionerData?.display || formData.practitionerDisplay,
				},
			},
		];
	}

	if (formData.manufacturer) {
		immunization.manufacturer = {
			display: formData.manufacturer,
		};
	}

	if (formData.lotNumber) {
		immunization.lotNumber = formData.lotNumber;
	}

	if (formData.expirationDate) {
		immunization.expirationDate = formData.expirationDate;
	}

	if (formData.location) {
		immunization.location = {
			display: formData.location,
		};
	}

	if (formData.notes) {
		immunization.note = [
			{
				text: formData.notes,
			},
		];
	}

	return immunization;
}

export type { ImmunizationFormData, FHIRImmunization };
