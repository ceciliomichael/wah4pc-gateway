"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import type { AppointmentFormData } from "@/lib/appointment-utils";

interface AppointmentFormProps {
	formData: AppointmentFormData;
	onFieldChange: (field: keyof AppointmentFormData, value: string) => void;
	patients: Array<{ code: string; display: string }>;
	practitioners: Array<{ code: string; display: string }>;
	customAppointmentTypeOption?: { code: string; display: string } | null;
	disabled?: boolean;
}

const STATUS_OPTIONS = [
	{ code: "proposed", display: "Proposed" },
	{ code: "pending", display: "Pending" },
	{ code: "booked", display: "Booked" },
	{ code: "arrived", display: "Arrived" },
	{ code: "fulfilled", display: "Fulfilled" },
	{ code: "cancelled", display: "Cancelled" },
	{ code: "noshow", display: "No Show" },
];

const APPOINTMENT_TYPE_OPTIONS = [
	{ code: "ROUTINE", display: "Routine" },
	{ code: "WALKIN", display: "Walk-in" },
	{ code: "CHECKUP", display: "Check-up" },
	{ code: "FOLLOWUP", display: "Follow-up" },
	{ code: "EMERGENCY", display: "Emergency" },
];

export function AppointmentForm({
	formData,
	onFieldChange,
	patients,
	practitioners,
	customAppointmentTypeOption = null,
	disabled = false,
}: AppointmentFormProps) {
	const appointmentTypeOptions = [...APPOINTMENT_TYPE_OPTIONS];
	if (
		customAppointmentTypeOption?.code &&
		!appointmentTypeOptions.some((option) => option.code === customAppointmentTypeOption.code)
	) {
		appointmentTypeOptions.push(customAppointmentTypeOption);
	}

	if (
		formData.appointmentType &&
		!appointmentTypeOptions.some((option) => option.code === formData.appointmentType)
	) {
		appointmentTypeOptions.push({
			code: formData.appointmentType,
			display: customAppointmentTypeOption?.display || formData.appointmentType,
		});
	}

	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Appointment Information
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
						label="Appointment Type"
						value={formData.appointmentType}
						onChange={(val) => onFieldChange("appointmentType", val)}
						options={appointmentTypeOptions}
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
					Schedule
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Start Date & Time"
						type="datetime-local"
						value={formData.start}
						onChange={(val) => onFieldChange("start", val)}
						required
						disabled={disabled}
					/>
					<FormInput
						label="End Date & Time"
						type="datetime-local"
						value={formData.end}
						onChange={(val) => onFieldChange("end", val)}
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
						label="Description"
						value={formData.description}
						onChange={(val) => onFieldChange("description", val)}
						placeholder="Annual physical examination and health screening"
						disabled={disabled}
					/>
					<FormInput
						label="Comment"
						value={formData.comment}
						onChange={(val) => onFieldChange("comment", val)}
						placeholder="Patient requests reminder call 1 day before appointment"
						disabled={disabled}
					/>
				</div>
			</section>
		</div>
	);
}
