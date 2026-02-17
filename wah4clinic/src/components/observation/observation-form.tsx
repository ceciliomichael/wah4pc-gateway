"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import type { ObservationFormData } from "@/lib/observation-utils";

interface ObservationFormProps {
	formData: ObservationFormData;
	onFieldChange: (field: keyof ObservationFormData, value: string) => void;
	patients: Array<{ code: string; display: string }>;
	practitioners: Array<{ code: string; display: string }>;
	disabled?: boolean;
}

const STATUS_OPTIONS = [
	{ code: "registered", display: "Registered" },
	{ code: "preliminary", display: "Preliminary" },
	{ code: "final", display: "Final" },
	{ code: "amended", display: "Amended" },
	{ code: "corrected", display: "Corrected" },
	{ code: "cancelled", display: "Cancelled" },
	{ code: "entered-in-error", display: "Entered in Error" },
];

const CATEGORY_OPTIONS = [
	{ code: "vital-signs", display: "Vital Signs" },
	{ code: "laboratory", display: "Laboratory" },
	{ code: "imaging", display: "Imaging" },
	{ code: "exam", display: "Exam" },
	{ code: "procedure", display: "Procedure" },
	{ code: "survey", display: "Survey" },
];

const OBSERVATION_CODE_OPTIONS = [
	{ code: "85354-9", display: "Blood Pressure (Panel)" },
	{ code: "8867-4", display: "Heart Rate" },
	{ code: "8310-5", display: "Body Temperature" },
	{ code: "9279-1", display: "Respiratory Rate" },
	{ code: "2708-6", display: "Oxygen Saturation" },
	{ code: "29463-7", display: "Body Weight" },
	{ code: "8302-2", display: "Body Height" },
	{ code: "39156-5", display: "Body Mass Index" },
];

// FHIR-compliant unit mappings for each observation type
const OBSERVATION_UNIT_MAP: Record<string, Array<{ code: string; display: string; ucumCode: string }>> = {
	"8867-4": [ // Heart Rate
		{ code: "/min", display: "beats/minute", ucumCode: "/min" },
	],
	"8310-5": [ // Body Temperature
		{ code: "Cel", display: "°C (Celsius)", ucumCode: "Cel" },
		{ code: "[degF]", display: "°F (Fahrenheit)", ucumCode: "[degF]" },
	],
	"9279-1": [ // Respiratory Rate
		{ code: "/min", display: "breaths/minute", ucumCode: "/min" },
	],
	"2708-6": [ // Oxygen Saturation
		{ code: "%", display: "% (Percent)", ucumCode: "%" },
	],
	"29463-7": [ // Body Weight
		{ code: "kg", display: "kg (Kilograms)", ucumCode: "kg" },
		{ code: "lb_av", display: "lb (Pounds)", ucumCode: "[lb_av]" },
	],
	"8302-2": [ // Body Height
		{ code: "cm", display: "cm (Centimeters)", ucumCode: "cm" },
		{ code: "[in_i]", display: "in (Inches)", ucumCode: "[in_i]" },
	],
	"39156-5": [ // Body Mass Index
		{ code: "kg/m2", display: "kg/m² (BMI)", ucumCode: "kg/m2" },
	],
};

const INTERPRETATION_OPTIONS = [
	{ code: "N", display: "Normal" },
	{ code: "L", display: "Low" },
	{ code: "H", display: "High" },
	{ code: "A", display: "Abnormal" },
	{ code: "AA", display: "Critical Abnormal" },
];

export function ObservationForm({
	formData,
	onFieldChange,
	patients,
	practitioners,
	disabled = false,
}: ObservationFormProps) {
	const isBloodPressure = formData.code === "85354-9";
	const availableUnits = OBSERVATION_UNIT_MAP[formData.code] || [];

	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Observation Status
				</h3>
				<div className="grid grid-cols-1 gap-6">
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
					Observation Type
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormSelect
						label="Category"
						value={formData.categoryCode}
						onChange={(val) => {
							onFieldChange("categoryCode", val);
							const selectedCategory = CATEGORY_OPTIONS.find((c) => c.code === val);
							if (selectedCategory) {
								onFieldChange("categoryDisplay", selectedCategory.display);
							}
						}}
						options={CATEGORY_OPTIONS}
						required
						disabled={disabled}
						placeholder="Select observation category"
					/>
					<FormSelect
						label="Observation Code"
						value={formData.code}
						onChange={(val) => {
							onFieldChange("code", val);
							const selectedCode = OBSERVATION_CODE_OPTIONS.find((c) => c.code === val);
							if (selectedCode) {
								onFieldChange("codeDisplay", selectedCode.display);
							}
						}}
						options={OBSERVATION_CODE_OPTIONS}
						required
						disabled={disabled}
						placeholder="Select observation type"
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Patient & Practitioner
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormSelect
						label="Patient"
						value={formData.patientId}
						onChange={(val) => onFieldChange("patientId", val)}
						options={patients}
						required
						disabled={disabled}
						placeholder={patients.length === 0 ? "No patients available" : "Select a patient"}
					/>
					<FormSelect
						label="Practitioner (Performer)"
						value={formData.practitionerId}
						onChange={(val) => onFieldChange("practitionerId", val)}
						options={practitioners}
						disabled={disabled}
						placeholder={practitioners.length === 0 ? "No practitioners available" : "Select a practitioner"}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Observation Details
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Effective Date & Time"
						type="datetime-local"
						value={formData.effectiveDateTime}
						onChange={(val) => onFieldChange("effectiveDateTime", val)}
						required
						disabled={disabled}
					/>
					<FormInput
						label="Encounter ID"
						value={formData.encounterId}
						onChange={(val) => onFieldChange("encounterId", val)}
						placeholder="encounter-id (optional)"
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					{isBloodPressure ? "Blood Pressure Values" : "Observation Value"}
				</h3>
				{isBloodPressure ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormInput
							label="Systolic (mmHg)"
							type="number"
							value={formData.systolicValue}
							onChange={(val) => onFieldChange("systolicValue", val)}
							placeholder="120"
							required
							disabled={disabled}
						/>
						<FormInput
							label="Diastolic (mmHg)"
							type="number"
							value={formData.diastolicValue}
							onChange={(val) => onFieldChange("diastolicValue", val)}
							placeholder="80"
							required
							disabled={disabled}
						/>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormInput
							label="Value"
							type="number"
							value={formData.valueQuantity}
							onChange={(val) => onFieldChange("valueQuantity", val)}
							placeholder="Enter measured value"
							disabled={disabled}
						/>
						{availableUnits.length > 0 ? (
							<FormSelect
								label="Unit"
								value={formData.valueUnit}
								onChange={(val) => onFieldChange("valueUnit", val)}
								options={availableUnits}
								disabled={disabled}
								placeholder="Select unit"
							/>
						) : (
							<FormInput
								label="Unit"
								value={formData.valueUnit}
								onChange={(val) => onFieldChange("valueUnit", val)}
								placeholder="Select observation type first"
								disabled={true}
							/>
						)}
					</div>
				)}
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Interpretation
				</h3>
				<div className="grid grid-cols-1 gap-6">
					<FormSelect
						label="Interpretation"
						value={formData.interpretation}
						onChange={(val) => {
							onFieldChange("interpretation", val);
							const selectedInterpretation = INTERPRETATION_OPTIONS.find((i) => i.code === val);
							if (selectedInterpretation) {
								onFieldChange("interpretationDisplay", selectedInterpretation.display);
							}
						}}
						options={INTERPRETATION_OPTIONS}
						disabled={disabled}
						placeholder="Select interpretation (optional)"
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Additional Notes
				</h3>
				<div className="grid grid-cols-1 gap-6">
					<FormInput
						label="Notes"
						value={formData.notes}
						onChange={(val) => onFieldChange("notes", val)}
						placeholder="Any additional observations or clinical notes"
						disabled={disabled}
					/>
				</div>
			</section>
		</div>
	);
}