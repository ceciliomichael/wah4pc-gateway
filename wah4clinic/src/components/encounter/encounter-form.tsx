"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import type { EncounterFormData } from "@/lib/encounter-utils";

interface EncounterFormProps {
	formData: EncounterFormData;
	onFieldChange: (field: keyof EncounterFormData, value: string) => void;
	patients: Array<{ code: string; display: string }>;
	practitioners: Array<{ code: string; display: string }>;
	disabled?: boolean;
}

const STATUS_OPTIONS = [
	{ code: "planned", display: "Planned" },
	{ code: "arrived", display: "Arrived" },
	{ code: "in-progress", display: "In Progress" },
	{ code: "finished", display: "Finished" },
	{ code: "cancelled", display: "Cancelled" },
];

const CLASS_OPTIONS = [
	{ code: "AMB", display: "Ambulatory" },
	{ code: "EMER", display: "Emergency" },
	{ code: "IMP", display: "Inpatient" },
	{ code: "VR", display: "Virtual" },
];

export function EncounterForm({
	formData,
	onFieldChange,
	patients,
	practitioners,
	disabled = false,
}: EncounterFormProps) {
	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Encounter Information
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
						label="Class"
						value={formData.class}
						onChange={(val) => onFieldChange("class", val)}
						options={CLASS_OPTIONS}
						required
						disabled={disabled}
					/>
					<FormInput
						label="Type"
						value={formData.type}
						onChange={(val) => onFieldChange("type", val)}
						placeholder="Annual Physical Examination"
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Participants
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
					Period
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Start Date & Time"
						type="datetime-local"
						value={formData.periodStart}
						onChange={(val) => onFieldChange("periodStart", val)}
						required
						disabled={disabled}
					/>
					<FormInput
						label="End Date & Time"
						type="datetime-local"
						value={formData.periodEnd}
						onChange={(val) => onFieldChange("periodEnd", val)}
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
						placeholder="Annual physical examination and health screening"
						disabled={disabled}
					/>
					<FormInput
						label="Location"
						value={formData.location}
						onChange={(val) => onFieldChange("location", val)}
						placeholder="Clinic Room 101"
						disabled={disabled}
					/>
				</div>
			</section>
		</div>
	);
}