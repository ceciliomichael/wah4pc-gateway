"use client";

import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import { usePSGC } from "@/hooks/use-terminology";
import { isNCR } from "@/lib/psgc-utils";
import type { PractitionerFormData } from "@/lib/practitioner-utils";

interface PractitionerFormProps {
	formData: PractitionerFormData;
	onFieldChange: (field: keyof PractitionerFormData, value: string) => void;
	disabled?: boolean;
}

const GENDER_OPTIONS = [
	{ code: "male", display: "Male" },
	{ code: "female", display: "Female" },
];

export function PractitionerForm({ formData, onFieldChange, disabled = false }: PractitionerFormProps) {
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

	return (
		<div className="space-y-8">
			<section>
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Personal Information</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Prefix"
						value={formData.prefix}
						onChange={(val) => onFieldChange("prefix", val)}
						disabled={disabled}
						placeholder="Dr., Nurse"
					/>
					<FormInput
						label="First Name"
						value={formData.firstName}
						onChange={(val) => onFieldChange("firstName", val)}
						required
						disabled={disabled}
						placeholder="Maria"
					/>
					<FormInput
						label="Middle Name"
						value={formData.middleName}
						onChange={(val) => onFieldChange("middleName", val)}
						disabled={disabled}
						placeholder="Santos"
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
						placeholder="MD, RN"
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
				<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Professional Information</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="PRC License Number"
						value={formData.prcLicense}
						onChange={(val) => onFieldChange("prcLicense", val)}
						placeholder="PRC-1234567"
						disabled={disabled}
					/>
					<FormInput
						label="TIN Number"
						value={formData.tinNumber}
						onChange={(val) => onFieldChange("tinNumber", val)}
						placeholder="123-456-789-000"
						disabled={disabled}
					/>
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
						label="Work Phone"
						type="tel"
						value={formData.workPhone}
						onChange={(val) => onFieldChange("workPhone", val)}
						placeholder="+63 2 8123 4567"
						disabled={disabled}
					/>
					<FormInput
						label="Email Address"
						type="email"
						value={formData.email}
						onChange={(val) => onFieldChange("email", val)}
						placeholder="dr.maria@hospital.ph"
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
						placeholder="456 Ayala Avenue"
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
							placeholder="1209"
							maxLength={4}
							required
							disabled={disabled}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}