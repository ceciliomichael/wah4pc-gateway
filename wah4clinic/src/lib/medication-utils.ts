interface MedicationFormData {
	drugCode: string;
	drugDisplay: string;
	status: string;
	manufacturer: string;
	form: string;
	amountValue: string;
	amountUnit: string;
	batchNumber: string;
	expirationDate: string;
}

interface FHIRMedication {
	resourceType?: string;
	id?: string;
	code: {
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
		text: string;
	};
	status: string;
	manufacturer?: {
		display: string;
	};
	form?: {
		coding: Array<{
			system: string;
			code: string;
			display: string;
		}>;
	};
	amount?: {
		numerator: {
			value: number;
			unit: string;
			system: string;
			code: string;
		};
		denominator: {
			value: number;
			unit: string;
			system: string;
			code: string;
		};
	};
	batch?: {
		lotNumber: string;
		expirationDate: string;
	};
	[key: string]: unknown;
}

interface Drug {
	code: string;
	display: string;
}

const MEDICATION_FORM_MAP: Record<string, string> = {
	CAP: "Capsule",
	TAB: "Tablet",
	SOLVINJ: "Solution for Injection",
	ORALSOL: "Oral Solution",
	SUSP: "Suspension",
	CREAM: "Cream",
	OINT: "Ointment",
};

export function fhirToFormData(medication: FHIRMedication): MedicationFormData {
	const drugCoding = medication.code?.coding?.[0];
	
	return {
		drugCode: drugCoding?.code || "",
		drugDisplay: drugCoding?.display || medication.code?.text || "",
		status: medication.status || "",
		manufacturer: medication.manufacturer?.display || "",
		form: medication.form?.coding?.[0]?.code || "",
		amountValue: medication.amount?.numerator?.value?.toString() || "",
		amountUnit: medication.amount?.numerator?.unit || "",
		batchNumber: medication.batch?.lotNumber || "",
		expirationDate: medication.batch?.expirationDate || "",
	};
}

export function buildFHIRMedication(
	formData: MedicationFormData,
	drugs: Drug[],
): Omit<FHIRMedication, "resourceType" | "id"> {
	const drugData = drugs.find((d) => d.code === formData.drugCode);
	const formDisplay = MEDICATION_FORM_MAP[formData.form] || formData.form;

	const medication: Omit<FHIRMedication, "resourceType" | "id"> = {
		code: {
			coding: [
				{
					system: "urn://example.com/ph-core/fhir/ValueSet/drugs",
					code: formData.drugCode,
					display: drugData?.display || formData.drugDisplay,
				},
			],
			text: drugData?.display || formData.drugDisplay,
		},
		status: formData.status,
	};

	if (formData.manufacturer) {
		medication.manufacturer = {
			display: formData.manufacturer,
		};
	}

	if (formData.form) {
		medication.form = {
			coding: [
				{
					system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
					code: formData.form,
					display: formDisplay,
				},
			],
		};
	}

	if (formData.amountValue && formData.amountUnit) {
		const value = Number.parseFloat(formData.amountValue);
		if (!Number.isNaN(value)) {
			medication.amount = {
				numerator: {
					value,
					unit: formData.amountUnit,
					system: "http://unitsofmeasure.org",
					code: formData.amountUnit,
				},
				denominator: {
					value: 1,
					unit: formData.form ? formDisplay.toLowerCase() : "unit",
					system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
					code: formData.form || "UNIT",
				},
			};
		}
	}

	if (formData.batchNumber || formData.expirationDate) {
		medication.batch = {
			lotNumber: formData.batchNumber,
			expirationDate: formData.expirationDate,
		};
	}

	return medication;
}

export type { MedicationFormData, FHIRMedication, Drug };