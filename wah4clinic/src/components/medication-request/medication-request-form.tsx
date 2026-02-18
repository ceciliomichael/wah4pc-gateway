"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import { ensureSelectedOption } from "@/lib/form-option-utils";
import type { MedicationRequestFormData } from "@/lib/medication-request-utils";

interface MedicationRequestFormProps {
	formData: MedicationRequestFormData;
	onFieldChange: (field: keyof MedicationRequestFormData, value: string) => void;
	patients: Array<{ code: string; display: string }>;
	practitioners: Array<{ code: string; display: string }>;
	disabled?: boolean;
}

const STATUS_OPTIONS = [
	{ code: "active", display: "Active" },
	{ code: "on-hold", display: "On Hold" },
	{ code: "cancelled", display: "Cancelled" },
	{ code: "completed", display: "Completed" },
	{ code: "entered-in-error", display: "Entered in Error" },
	{ code: "stopped", display: "Stopped" },
	{ code: "draft", display: "Draft" },
	{ code: "unknown", display: "Unknown" },
];

const INTENT_OPTIONS = [
	{ code: "proposal", display: "Proposal" },
	{ code: "plan", display: "Plan" },
	{ code: "order", display: "Order" },
	{ code: "original-order", display: "Original Order" },
	{ code: "filler-order", display: "Filler Order" },
	{ code: "instance-order", display: "Instance Order" },
];

const PRIORITY_OPTIONS = [
	{ code: "routine", display: "Routine" },
	{ code: "urgent", display: "Urgent" },
	{ code: "asap", display: "ASAP" },
	{ code: "stat", display: "STAT" },
];

export function MedicationRequestForm({
	formData,
	onFieldChange,
	patients,
	practitioners,
	disabled = false,
}: MedicationRequestFormProps) {
	const statusOptions = ensureSelectedOption(
		STATUS_OPTIONS,
		formData.status,
		formData.status,
	);
	const intentOptions = ensureSelectedOption(
		INTENT_OPTIONS,
		formData.intent,
		formData.intent,
	);
	const priorityOptions = ensureSelectedOption(
		PRIORITY_OPTIONS,
		formData.priority,
		formData.priority,
	);
	const patientOptions = ensureSelectedOption(patients, formData.patientId);
	const practitionerOptions = ensureSelectedOption(
		practitioners,
		formData.requesterId,
	);

	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Request Details
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormSelect
						label="Status"
						value={formData.status}
						onChange={(value) => onFieldChange("status", value)}
						options={statusOptions}
						required
						disabled={disabled}
					/>
					<FormSelect
						label="Intent"
						value={formData.intent}
						onChange={(value) => onFieldChange("intent", value)}
						options={intentOptions}
						required
						disabled={disabled}
					/>
					<FormSelect
						label="Priority"
						value={formData.priority}
						onChange={(value) => onFieldChange("priority", value)}
						options={priorityOptions}
						disabled={disabled}
						placeholder="Select priority"
					/>
					<FormInput
						label="Authored On"
						type="datetime-local"
						value={formData.authoredOn}
						onChange={(value) => onFieldChange("authoredOn", value)}
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Medication
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Medication Code (RxNorm)"
						value={formData.medicationCode}
						onChange={(value) => onFieldChange("medicationCode", value)}
						required
						disabled={disabled}
						placeholder="860975"
					/>
					<FormInput
						label="Medication Display"
						value={formData.medicationDisplay}
						onChange={(value) => onFieldChange("medicationDisplay", value)}
						required
						disabled={disabled}
						placeholder="Metformin 500mg tablet"
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Patient and Requester
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormSelect
						label="Patient"
						value={formData.patientId}
						onChange={(value) => onFieldChange("patientId", value)}
						options={patientOptions}
						required
						disabled={disabled}
						placeholder={
							patients.length === 0 ? "No patients available" : "Select a patient"
						}
					/>
					<FormSelect
						label="Requester"
						value={formData.requesterId}
						onChange={(value) => onFieldChange("requesterId", value)}
						options={practitionerOptions}
						disabled={disabled}
						placeholder={
							practitioners.length === 0
								? "No practitioners available"
								: "Select a requester"
						}
					/>
					<FormInput
						label="Encounter ID"
						value={formData.encounterId}
						onChange={(value) => onFieldChange("encounterId", value)}
						disabled={disabled}
						placeholder="Encounter ID (optional)"
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Dosage and Supply
				</h3>
				<div className="grid grid-cols-1 gap-6">
					<FormInput
						label="Dosage Instruction"
						value={formData.dosageInstruction}
						onChange={(value) => onFieldChange("dosageInstruction", value)}
						disabled={disabled}
						placeholder="Take one tablet by mouth twice daily"
					/>
					<FormInput
						label="Dispense Quantity"
						type="number"
						value={formData.dispenseQuantity}
						onChange={(value) => onFieldChange("dispenseQuantity", value)}
						disabled={disabled}
						placeholder="30"
					/>
					<FormInput
						label="Notes"
						value={formData.notes}
						onChange={(value) => onFieldChange("notes", value)}
						disabled={disabled}
						placeholder="Additional notes"
					/>
				</div>
			</section>
		</div>
	);
}
