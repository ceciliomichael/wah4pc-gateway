"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import { usePSGC, useCodeSystem } from "@/hooks/use-terminology";
import { isNCR } from "@/lib/psgc-utils";
import type { PatientFormData } from "@/lib/patient-utils";

interface PatientFormProps {
	formData: PatientFormData;
	onFieldChange: (field: keyof PatientFormData, value: string) => void;
	disabled?: boolean;
}

const GENDER_OPTIONS = [
	{ code: "male", display: "Male" },
	{ code: "female", display: "Female" },
];

const MARITAL_STATUS_OPTIONS = [
	{ code: "S", display: "Single" },
	{ code: "M", display: "Married" },
	{ code: "D", display: "Divorced" },
	{ code: "W", display: "Widowed" },
];

const INDIGENOUS_OPTIONS = [
	{ code: "false", display: "No" },
	{ code: "true", display: "Yes" },
];

export function PatientForm({ formData, onFieldChange, disabled = false }: PatientFormProps) {
	const { data: religions, loading: religionsLoading } = useCodeSystem("religion");
	const { data: races, loading: racesLoading } = useCodeSystem("race");
	const { data: educations, loading: educationsLoading } = useCodeSystem("educational-attainment");
	const { data: occupations, loading: occupationsLoading } = useCodeSystem("occupation");
	const { data: indigenousGroups, loading: indigenousGroupsLoading } = useCodeSystem("indigenous-groups");

	const regionIsNCR = isNCR(formData.region);

	const { data: regions, loading: regionsLoading } = usePSGC("region");
	const { data: provinces, loading: provincesLoading } = usePSGC("province", regionIsNCR ? undefined : (formData.region || undefined));
	const { data: cities, loading: citiesLoading } = usePSGC("city", regionIsNCR ? formData.region : (formData.province || undefined));
	const { data: barangays, loading: barangaysLoading } = usePSGC("barangay", formData.cityMunicipality || undefined);

	const handleRegionChange = (value: string) => {
		onFieldChange("region", value);
		onFieldChange("province", "");
		onFieldChange("cityMunicipality", "");
		onFieldChange("barangay", "");
	};

	const handleProvinceChange = (value: string) => {
		onFieldChange("province", value);
		onFieldChange("cityMunicipality", "");
		onFieldChange("barangay", "");
	};

	const handleCityChange = (value: string) => {
		onFieldChange("cityMunicipality", value);
		onFieldChange("barangay", "");
	};

	const handleIndigenousChange = (value: string) => {
		onFieldChange("indigenousPeople", value);
		if (value === "false") {
			onFieldChange("indigenousGroup", "");
		}
	};

	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Personal Information</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="First Name"
						value={formData.firstName}
						onChange={(val) => onFieldChange("firstName", val)}
						required
						disabled={disabled}
						placeholder="Juan"
					/>
					<FormInput
						label="Middle Name"
						value={formData.middleName}
						onChange={(val) => onFieldChange("middleName", val)}
						disabled={disabled}
						placeholder="Garcia"
					/>
					<FormInput
						label="Last Name"
						value={formData.lastName}
						onChange={(val) => onFieldChange("lastName", val)}
						required
						disabled={disabled}
						placeholder="Dela Cruz"
					/>
					<FormInput
						label="Suffix"
						value={formData.suffix}
						onChange={(val) => onFieldChange("suffix", val)}
						disabled={disabled}
						placeholder="Jr., Sr., III"
					/>
					<FormInput
						label="Birth Date"
						type="date"
						value={formData.birthDate}
						onChange={(val) => onFieldChange("birthDate", val)}
						required
						disabled={disabled}
					/>
					<FormSelect
						label="Gender"
						value={formData.gender}
						onChange={(val) => onFieldChange("gender", val)}
						options={GENDER_OPTIONS}
						required
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Demographics</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormSelect
						label="Religion"
						value={formData.religion}
						onChange={(val) => onFieldChange("religion", val)}
						options={religions}
						loading={religionsLoading}
						disabled={disabled}
					/>
					<FormSelect
						label="Race"
						value={formData.race}
						onChange={(val) => onFieldChange("race", val)}
						options={races}
						loading={racesLoading}
						disabled={disabled}
					/>
					<FormSelect
						label="Educational Attainment"
						value={formData.educationalAttainment}
						onChange={(val) => onFieldChange("educationalAttainment", val)}
						options={educations}
						loading={educationsLoading}
						disabled={disabled}
					/>
					<FormSelect
						label="Occupation"
						value={formData.occupation}
						onChange={(val) => onFieldChange("occupation", val)}
						options={occupations}
						loading={occupationsLoading}
						disabled={disabled}
					/>
					<FormSelect
						label="Indigenous People"
						value={formData.indigenousPeople}
						onChange={handleIndigenousChange}
						options={INDIGENOUS_OPTIONS}
						disabled={disabled}
					/>
					{formData.indigenousPeople === "true" && (
						<FormSelect
							label="Indigenous Group"
							value={formData.indigenousGroup}
							onChange={(val) => onFieldChange("indigenousGroup", val)}
							options={indigenousGroups}
							loading={indigenousGroupsLoading}
							required
							disabled={disabled}
						/>
					)}
					<FormSelect
						label="Marital Status"
						value={formData.maritalStatus}
						onChange={(val) => onFieldChange("maritalStatus", val)}
						options={MARITAL_STATUS_OPTIONS}
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Address</h3>
				<div className="grid grid-cols-1 gap-6">
					<FormInput
						label="Street Address"
						value={formData.streetAddress}
						onChange={(val) => onFieldChange("streetAddress", val)}
						placeholder="123 Sampaguita Street"
						required
						disabled={disabled}
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormSelect
							label="Region"
							value={formData.region}
							onChange={handleRegionChange}
							options={regions}
							loading={regionsLoading}
							required
							disabled={disabled}
						/>
						{!regionIsNCR && (
							<FormSelect
								label="Province"
								value={formData.province}
								onChange={handleProvinceChange}
								options={provinces}
								loading={provincesLoading}
								disabled={disabled || !formData.region}
								required
							/>
						)}
						<FormSelect
							label="City/Municipality"
							value={formData.cityMunicipality}
							onChange={handleCityChange}
							options={cities}
							loading={citiesLoading}
							disabled={disabled || (!regionIsNCR && !formData.province)}
							required
						/>
						<FormSelect
							label="Barangay"
							value={formData.barangay}
							onChange={(val) => onFieldChange("barangay", val)}
							options={barangays}
							loading={barangaysLoading}
							disabled={disabled || !formData.cityMunicipality}
							required
						/>
						<FormInput
							label="Postal Code"
							value={formData.postalCode}
							onChange={(val) => onFieldChange("postalCode", val)}
							placeholder="1870"
							maxLength={4}
							required
							disabled={disabled}
						/>
					</div>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Contact Information</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Mobile Phone"
						type="tel"
						value={formData.mobilePhone}
						onChange={(val) => onFieldChange("mobilePhone", val)}
						placeholder="09171234567"
						maxLength={11}
						required
						disabled={disabled}
					/>
					<FormInput
						label="Email Address"
						type="email"
						value={formData.email}
						onChange={(val) => onFieldChange("email", val)}
						placeholder="juan.delacruz@example.com"
						disabled={disabled}
					/>
				</div>
			</section>

			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Health Insurance</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="PhilHealth ID"
						value={formData.philhealthId}
						onChange={(val) => onFieldChange("philhealthId", val)}
						placeholder="12-345678901-2"
						maxLength={15}
						disabled={disabled}
					/>
				</div>
			</section>
		</div>
	);
}