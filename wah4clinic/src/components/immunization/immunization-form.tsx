"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import type { ImmunizationFormData } from "@/lib/immunization-utils";

interface ImmunizationFormProps {
	formData: ImmunizationFormData;
	onFieldChange: (field: keyof ImmunizationFormData, value: string) => void;
	patients: Array<{ code: string; display: string }>;
	practitioners: Array<{ code: string; display: string }>;
	disabled?: boolean;
}

const STATUS_OPTIONS = [
	{ code: "completed", display: "Completed" },
	{ code: "entered-in-error", display: "Entered in Error" },
	{ code: "not-done", display: "Not Done" },
];

const VACCINE_OPTIONS = [
	{ code: "03", display: "MMR (Measles, Mumps, Rubella)" },
	{ code: "08", display: "Hepatitis B" },
	{ code: "10", display: "Polio (IPV)" },
	{ code: "20", display: "DTaP (Diphtheria, Tetanus, Pertussis)" },
	{ code: "21", display: "Varicella (Chickenpox)" },
	{ code: "88", display: "Influenza" },
	{ code: "94", display: "MMRV (Measles, Mumps, Rubella, Varicella)" },
	{ code: "106", display: "DTaP-Hib-IPV" },
	{ code: "110", display: "DTaP-Hep B-IPV" },
	{ code: "113", display: "Tetanus Toxoid" },
	{ code: "114", display: "Meningococcal" },
	{ code: "115", display: "Tdap (Tetanus, Diphtheria, Pertussis)" },
	{ code: "116", display: "Rotavirus" },
	{ code: "121", display: "Zoster (Shingles)" },
	{ code: "133", display: "Pneumococcal Conjugate (PCV13)" },
	{ code: "137", display: "HPV (Human Papillomavirus)" },
	{ code: "141", display: "Influenza (High Dose)" },
	{ code: "185", display: "Yellow Fever" },
	{ code: "208", display: "COVID-19" },
	{ code: "212", display: "COVID-19 (Pfizer-BioNTech)" },
	{ code: "213", display: "COVID-19 (Moderna)" },
];

const SITE_OPTIONS = [
	{ code: "LA", display: "Left Arm" },
	{ code: "RA", display: "Right Arm" },
	{ code: "LT", display: "Left Thigh" },
	{ code: "RT", display: "Right Thigh" },
	{ code: "LD", display: "Left Deltoid" },
	{ code: "RD", display: "Right Deltoid" },
];

const ROUTE_OPTIONS = [
	{ code: "IM", display: "Injection, intramuscular" },
	{ code: "NASINHLC", display: "Inhalation, nasal" },
	{ code: "IDINJ", display: "Injection, intradermal" },
	{ code: "PO", display: "Swallow, oral" },
	{ code: "SQ", display: "Injection, subcutaneous" },
	{ code: "TRNSDERM", display: "Transdermal" },
];

export function ImmunizationForm({
	formData,
	onFieldChange,
	patients,
	practitioners,
	disabled = false,
}: ImmunizationFormProps) {
	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Immunization Status
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
					Vaccine Information
				</h3>
				<div className="grid grid-cols-1 gap-6">
					<FormSelect
						label="Vaccine"
						value={formData.vaccineCode}
						onChange={(val) => {
							onFieldChange("vaccineCode", val);
							const selectedVaccine = VACCINE_OPTIONS.find((v) => v.code === val);
							if (selectedVaccine) {
								onFieldChange("vaccineDisplay", selectedVaccine.display);
							}
						}}
						options={VACCINE_OPTIONS}
						required
						disabled={disabled}
						placeholder="Select vaccine type"
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
						label="Practitioner (Administering)"
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
					Administration Details
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Occurrence Date & Time"
						type="datetime-local"
						value={formData.occurrenceDateTime}
						onChange={(val) => onFieldChange("occurrenceDateTime", val)}
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
					<FormSelect
						label="Site"
						value={formData.site}
						onChange={(val) => {
							onFieldChange("site", val);
							const selectedSite = SITE_OPTIONS.find((s) => s.code === val);
							if (selectedSite) {
								onFieldChange("siteDisplay", selectedSite.display);
							}
						}}
						options={SITE_OPTIONS}
						disabled={disabled}
						placeholder="Select administration site"
					/>
					<FormSelect
						label="Route"
						value={formData.route}
						onChange={(val) => {
							onFieldChange("route", val);
							const selectedRoute = ROUTE_OPTIONS.find((r) => r.code === val);
							if (selectedRoute) {
								onFieldChange("routeDisplay", selectedRoute.display);
							}
						}}
						options={ROUTE_OPTIONS}
						disabled={disabled}
						placeholder="Select administration route"
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Dose Information
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Dose Value"
						type="number"
						value={formData.doseValue}
						onChange={(val) => onFieldChange("doseValue", val)}
						placeholder="0.5"
						disabled={disabled}
					/>
					<FormInput
						label="Dose Unit"
						value={formData.doseUnit}
						onChange={(val) => onFieldChange("doseUnit", val)}
						placeholder="ml"
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
					Batch & Product Details
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Lot Number"
						value={formData.lotNumber}
						onChange={(val) => onFieldChange("lotNumber", val)}
						placeholder="Batch lot number"
						disabled={disabled}
					/>
					<FormInput
						label="Expiration Date"
						type="date"
						value={formData.expirationDate}
						onChange={(val) => onFieldChange("expirationDate", val)}
						disabled={disabled}
					/>
					<FormInput
						label="Manufacturer"
						value={formData.manufacturer}
						onChange={(val) => onFieldChange("manufacturer", val)}
						placeholder="e.g., Pfizer, Moderna"
						disabled={disabled}
					/>
					<FormInput
						label="Location"
						value={formData.location}
						onChange={(val) => onFieldChange("location", val)}
						placeholder="e.g., Clinic Room 101"
						disabled={disabled}
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
						placeholder="Any additional observations or notes"
						disabled={disabled}
					/>
				</div>
			</section>
		</div>
	);
}