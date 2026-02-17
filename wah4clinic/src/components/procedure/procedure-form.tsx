"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import type { ProcedureFormData } from "@/lib/procedure-utils";

interface ProcedureFormProps {
	formData: ProcedureFormData;
	onFieldChange: (field: keyof ProcedureFormData, value: string) => void;
	patients: Array<{ code: string; display: string }>;
	practitioners: Array<{ code: string; display: string }>;
	disabled?: boolean;
}

const STATUS_OPTIONS = [
	{ code: "preparation", display: "Preparation" },
	{ code: "in-progress", display: "In Progress" },
	{ code: "not-done", display: "Not Done" },
	{ code: "on-hold", display: "On Hold" },
	{ code: "stopped", display: "Stopped" },
	{ code: "completed", display: "Completed" },
	{ code: "entered-in-error", display: "Entered in Error" },
	{ code: "unknown", display: "Unknown" },
];

const CATEGORY_OPTIONS = [
	{ code: "387713003", display: "Surgical procedure" },
	{ code: "103693007", display: "Diagnostic procedure" },
	{ code: "277132007", display: "Therapeutic procedure" },
	{ code: "24642003", display: "Psychiatry procedure" },
	{ code: "409063005", display: "Counseling" },
	{ code: "409073007", display: "Education" },
];

const CODE_OPTIONS = [
	{ code: "80146002", display: "Appendectomy" },
	{ code: "55705006", display: "Tonsillectomy" },
	{ code: "71388002", display: "Cesarean section" },
	{ code: "174050007", display: "Coronary artery bypass grafting" },
	{ code: "84755001", display: "Total hip replacement" },
	{ code: "86198006", display: "Appendicitis" },
	{ code: "241957004", display: "Routine health examination" },
	{ code: "165171009", display: "Blood pressure measurement" },
];

export function ProcedureForm({
	formData,
	onFieldChange,
	patients,
	practitioners,
	disabled = false,
}: ProcedureFormProps) {
	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Procedure Information
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormSelect
						label="Status"
						value={formData.status}
						onChange={(val) => onFieldChange("status", val)}
						options={STATUS_OPTIONS}
						required
						disabled={disabled}
					/>
					<FormSelect
						label="Category"
						value={formData.category}
						onChange={(val) => {
							onFieldChange("category", val);
							const selectedCat = CATEGORY_OPTIONS.find((c) => c.code === val);
							if (selectedCat) {
								onFieldChange("categoryDisplay", selectedCat.display);
							}
						}}
						options={CATEGORY_OPTIONS}
						disabled={disabled}
						placeholder="Select procedure category"
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Procedure Code
				</h3>
				<div className="grid grid-cols-1 gap-6">
					<FormSelect
						label="Procedure Type"
						value={formData.code}
						onChange={(val) => {
							onFieldChange("code", val);
							const selectedCode = CODE_OPTIONS.find((c) => c.code === val);
							if (selectedCode) {
								onFieldChange("codeDisplay", selectedCode.display);
							}
						}}
						options={CODE_OPTIONS}
						required
						disabled={disabled}
						placeholder="Select procedure type"
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
						label="Practitioner"
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
					Timing & Location
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Performed Date & Time"
						type="datetime-local"
						value={formData.performedDateTime}
						onChange={(val) => onFieldChange("performedDateTime", val)}
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
					<FormInput
						label="Location"
						value={formData.location}
						onChange={(val) => onFieldChange("location", val)}
						placeholder="Operating Room 1"
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Additional Details
				</h3>
				<div className="grid grid-cols-1 gap-6">
					<FormInput
						label="Reason"
						value={formData.reasonCode}
						onChange={(val) => onFieldChange("reasonCode", val)}
						placeholder="Reason for procedure"
						disabled={disabled}
					/>
					<FormInput
						label="Outcome"
						value={formData.outcome}
						onChange={(val) => onFieldChange("outcome", val)}
						placeholder="Procedure outcome"
						disabled={disabled}
					/>
					<FormInput
						label="Notes"
						value={formData.notes}
						onChange={(val) => onFieldChange("notes", val)}
						placeholder="Additional notes"
						disabled={disabled}
					/>
				</div>
			</section>
		</div>
	);
}