"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import type { DiagnosticReportFormData } from "@/lib/diagnostic-report-utils";

interface DiagnosticReportFormProps {
	formData: DiagnosticReportFormData;
	onFieldChange: (field: keyof DiagnosticReportFormData, value: string) => void;
	patients: Array<{ code: string; display: string }>;
	practitioners: Array<{ code: string; display: string }>;
	disabled?: boolean;
}

const STATUS_OPTIONS = [
	{ code: "registered", display: "Registered" },
	{ code: "partial", display: "Partial" },
	{ code: "preliminary", display: "Preliminary" },
	{ code: "final", display: "Final" },
	{ code: "amended", display: "Amended" },
	{ code: "corrected", display: "Corrected" },
	{ code: "appended", display: "Appended" },
];

const CATEGORY_OPTIONS = [
	{ code: "LAB", display: "Laboratory" },
	{ code: "RAD", display: "Radiology" },
	{ code: "PAT", display: "Pathology" },
	{ code: "MIC", display: "Microbiology" },
];

export function DiagnosticReportForm({
	formData,
	onFieldChange,
	patients,
	practitioners,
	disabled = false,
}: DiagnosticReportFormProps) {
	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Report Details
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormSelect
						label="Status"
						value={formData.status}
						onChange={(value) => onFieldChange("status", value)}
						options={STATUS_OPTIONS}
						required
						disabled={disabled}
					/>
					<FormSelect
						label="Category"
						value={formData.categoryCode}
						onChange={(value) => {
							onFieldChange("categoryCode", value);
							const category = CATEGORY_OPTIONS.find((option) => option.code === value);
							if (category) {
								onFieldChange("categoryDisplay", category.display);
							}
						}}
						options={CATEGORY_OPTIONS}
						disabled={disabled}
						placeholder="Select category"
					/>
					<FormInput
						label="Code (LOINC)"
						value={formData.code}
						onChange={(value) => onFieldChange("code", value)}
						required
						disabled={disabled}
						placeholder="58410-2"
					/>
					<FormInput
						label="Code Display"
						value={formData.codeDisplay}
						onChange={(value) => onFieldChange("codeDisplay", value)}
						required
						disabled={disabled}
						placeholder="Complete blood count panel"
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Patient and Encounter
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormSelect
						label="Patient"
						value={formData.patientId}
						onChange={(value) => onFieldChange("patientId", value)}
						options={patients}
						disabled={disabled}
						placeholder={
							patients.length === 0 ? "No patients available" : "Select a patient"
						}
					/>
					<FormInput
						label="Encounter ID"
						value={formData.encounterId}
						onChange={(value) => onFieldChange("encounterId", value)}
						disabled={disabled}
						placeholder="Encounter ID (optional)"
					/>
					<FormInput
						label="Effective Date and Time"
						type="datetime-local"
						value={formData.effectiveDateTime}
						onChange={(value) => onFieldChange("effectiveDateTime", value)}
						disabled={disabled}
					/>
					<FormInput
						label="Issued Date and Time"
						type="datetime-local"
						value={formData.issuedDateTime}
						onChange={(value) => onFieldChange("issuedDateTime", value)}
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Performer and Results
				</h3>
				<div className="grid grid-cols-1 gap-6">
					<FormSelect
						label="Performer"
						value={formData.performerId}
						onChange={(value) => onFieldChange("performerId", value)}
						options={practitioners}
						disabled={disabled}
						placeholder={
							practitioners.length === 0
								? "No practitioners available"
								: "Select performer"
						}
					/>
					<FormInput
						label="Result Observation IDs"
						value={formData.resultObservationIds}
						onChange={(value) => onFieldChange("resultObservationIds", value)}
						disabled={disabled}
						placeholder="Comma-separated Observation IDs"
					/>
					<FormInput
						label="Conclusion"
						value={formData.conclusion}
						onChange={(value) => onFieldChange("conclusion", value)}
						disabled={disabled}
						placeholder="Clinical interpretation"
					/>
				</div>
			</section>
		</div>
	);
}
