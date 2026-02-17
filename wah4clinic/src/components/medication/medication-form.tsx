"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import type { MedicationFormData } from "@/lib/medication-utils";

interface MedicationFormProps {
	formData: MedicationFormData;
	onFieldChange: (field: keyof MedicationFormData, value: string) => void;
	drugs: Array<{ code: string; display: string }>;
	drugsLoading?: boolean;
	disabled?: boolean;
}

const STATUS_OPTIONS = [
	{ code: "active", display: "Active" },
	{ code: "inactive", display: "Inactive" },
	{ code: "entered-in-error", display: "Entered in Error" },
];

const FORM_OPTIONS = [
	{ code: "CAP", display: "Capsule" },
	{ code: "TAB", display: "Tablet" },
	{ code: "SOLVINJ", display: "Solution for Injection" },
	{ code: "ORALSOL", display: "Oral Solution" },
	{ code: "SUSP", display: "Suspension" },
	{ code: "CREAM", display: "Cream" },
	{ code: "OINT", display: "Ointment" },
];

const UNIT_OPTIONS = [
	{ code: "mg", display: "mg (milligrams)" },
	{ code: "g", display: "g (grams)" },
	{ code: "mL", display: "mL (milliliters)" },
	{ code: "IU", display: "IU (International Units)" },
	{ code: "mcg", display: "mcg (micrograms)" },
];

export function MedicationForm({
	formData,
	onFieldChange,
	drugs,
	drugsLoading = false,
	disabled = false,
}: MedicationFormProps) {
	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Drug Information
				</h3>
				<div className="grid grid-cols-1 gap-6">
					<FormSelect
						label="Drug Product"
						value={formData.drugCode}
						onChange={(val) => {
							onFieldChange("drugCode", val);
							const selectedDrug = drugs.find((d) => d.code === val);
							if (selectedDrug) {
								onFieldChange("drugDisplay", selectedDrug.display);
							}
						}}
						options={drugs}
						loading={drugsLoading}
						required
						disabled={disabled}
						placeholder={drugsLoading ? "Loading drugs..." : drugs.length === 0 ? "No drugs available" : "Select a drug product"}
					/>
					<FormSelect
						label="Status"
						value={formData.status}
						onChange={(val) => onFieldChange("status", val)}
						options={STATUS_OPTIONS}
						required
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Product Details
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Manufacturer"
						value={formData.manufacturer}
						onChange={(val) => onFieldChange("manufacturer", val)}
						placeholder="Generic Pharma Corp."
						disabled={disabled}
					/>
					<FormSelect
						label="Form"
						value={formData.form}
						onChange={(val) => onFieldChange("form", val)}
						options={FORM_OPTIONS}
						disabled={disabled}
						placeholder="Select dosage form"
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-stone-200">
					Amount/Strength
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Amount Value"
						type="number"
						value={formData.amountValue}
						onChange={(val) => onFieldChange("amountValue", val)}
						placeholder="500"
						disabled={disabled}
					/>
					<FormSelect
						label="Amount Unit"
						value={formData.amountUnit}
						onChange={(val) => onFieldChange("amountUnit", val)}
						options={UNIT_OPTIONS}
						disabled={disabled}
						placeholder="Select unit"
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Batch Information
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Batch/Lot Number"
						value={formData.batchNumber}
						onChange={(val) => onFieldChange("batchNumber", val)}
						placeholder="BATCH-2024-X99"
						disabled={disabled}
					/>
					<FormInput
						label="Expiration Date"
						type="date"
						value={formData.expirationDate}
						onChange={(val) => onFieldChange("expirationDate", val)}
						disabled={disabled}
					/>
				</div>
			</section>
		</div>
	);
}