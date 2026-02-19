"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput } from "@/components/ui/form/form-input";
import { FormSelect } from "@/components/ui/form/form-select";
import { usePSGC, useCodeSystem } from "@/hooks/use-terminology";
import { isNCR } from "@/lib/psgc-utils";

interface PatientFormData {
	firstName: string;
	middleName: string;
	lastName: string;
	suffix: string;
	birthDate: string;
	gender: string;
	email: string;
	mobilePhone: string;
	religion: string;
	race: string;
	educationalAttainment: string;
	occupation: string;
	indigenousPeople: string;
	indigenousGroup: string;
	maritalStatus: string;
	streetAddress: string;
	region: string;
	province: string;
	cityMunicipality: string;
	barangay: string;
	postalCode: string;
	philhealthId: string;
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

export function PatientRegistrationForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [formData, setFormData] = useState<PatientFormData>({
		firstName: "",
		middleName: "",
		lastName: "",
		suffix: "",
		birthDate: "",
		gender: "",
		email: "",
		mobilePhone: "",
		religion: "",
		race: "",
		educationalAttainment: "",
		occupation: "",
		indigenousPeople: "false",
		indigenousGroup: "",
		maritalStatus: "",
		streetAddress: "",
		region: "",
		province: "",
		cityMunicipality: "",
		barangay: "",
		postalCode: "",
		philhealthId: "",
	});

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

	const updateField = (field: keyof PatientFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleRegionChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			region: value,
			province: "",
			cityMunicipality: "",
			barangay: "",
		}));
	};

	const handleProvinceChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			province: value,
			cityMunicipality: "",
			barangay: "",
		}));
	};

	const handleCityChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			cityMunicipality: value,
			barangay: "",
		}));
	};

	const handleIndigenousChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			indigenousPeople: value,
			indigenousGroup: value === "false" ? "" : prev.indigenousGroup,
		}));
	};

	const buildFHIRPatient = () => {
		const givenNames = [formData.firstName];
		if (formData.middleName) givenNames.push(formData.middleName);

		const regionData = regions.find((r) => r.code === formData.region);
		const provinceData = provinces.find((p) => p.code === formData.province);
		const cityData = cities.find((c) => c.code === formData.cityMunicipality);
		const barangayData = barangays.find((b) => b.code === formData.barangay);

		const addressExtensions: Array<{
			url: string;
			valueCoding: { system: string; code: string; display?: string };
		}> = [
			{
				url: "urn://example.com/ph-core/fhir/StructureDefinition/region",
				valueCoding: {
					system: "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
					code: formData.region,
					display: regionData?.display,
				},
			},
		];

		// Only include province extension if a province was selected (NCR skips province)
		if (formData.province) {
			addressExtensions.push({
				url: "urn://example.com/ph-core/fhir/StructureDefinition/province",
				valueCoding: {
					system: "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
					code: formData.province,
					display: provinceData?.display,
				},
			});
		}

		addressExtensions.push(
			{
				url: "urn://example.com/ph-core/fhir/StructureDefinition/city-municipality",
				valueCoding: {
					system: "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
					code: formData.cityMunicipality,
					display: cityData?.display,
				},
			},
			{
				url: "urn://example.com/ph-core/fhir/StructureDefinition/barangay",
				valueCoding: {
					system: "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
					code: formData.barangay,
					display: barangayData?.display,
				},
			},
		);

		const patient: Record<string, unknown> = {
			active: true,
			name: [
				{
					use: "official",
					family: formData.lastName,
					given: givenNames,
					...(formData.suffix && { suffix: [formData.suffix] }),
				},
			],
			telecom: [
				{
					system: "phone",
					value: formData.mobilePhone,
					use: "mobile",
					rank: 1,
				},
				...(formData.email
					? [
							{
								system: "email",
								value: formData.email,
								use: "home",
							},
					  ]
					: []),
			],
			gender: formData.gender,
			birthDate: formData.birthDate,
			address: [
				{
					extension: addressExtensions,
					use: "home",
					type: "physical",
					line: [formData.streetAddress],
					city: cityData?.display,
					district: provinceData?.display,
					postalCode: formData.postalCode,
					country: "PH",
				},
			],
			extension: [],
		};

		const extensions = patient.extension as Array<Record<string, unknown>>;

		if (formData.religion) {
			const religionData = religions.find((r) => r.code === formData.religion);
			extensions.push({
				url: "urn://example.com/ph-core/fhir/StructureDefinition/religion",
				valueCodeableConcept: {
					coding: [
						{
							system: "urn://example.com/ph-core/fhir/CodeSystem/religion",
							code: formData.religion,
							display: religionData?.display,
						},
					],
				},
			});
		}

		if (formData.race) {
			const raceData = races.find((r) => r.code === formData.race);
			extensions.push({
				url: "urn://example.com/ph-core/fhir/StructureDefinition/race",
				valueCodeableConcept: {
					coding: [
						{
							system: "urn://example.com/ph-core/fhir/CodeSystem/race",
							code: formData.race,
							display: raceData?.display,
						},
					],
				},
			});
		}

		if (formData.educationalAttainment) {
			const educationData = educations.find((e) => e.code === formData.educationalAttainment);
			extensions.push({
				url: "urn://example.com/ph-core/fhir/StructureDefinition/educational-attainment",
				valueCodeableConcept: {
					coding: [
						{
							system: "urn://example.com/ph-core/fhir/CodeSystem/educational-attainment",
							code: formData.educationalAttainment,
							display: educationData?.display,
						},
					],
				},
			});
		}

		if (formData.occupation) {
			const occupationData = occupations.find((o) => o.code === formData.occupation);
			extensions.push({
				url: "urn://example.com/ph-core/fhir/StructureDefinition/occupation",
				valueCodeableConcept: {
					coding: [
						{
							system: "urn://example.com/ph-core/fhir/CodeSystem/PSOC",
							code: formData.occupation,
							display: occupationData?.display,
						},
					],
				},
			});
		}

		extensions.push({
			url: "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people",
			valueBoolean: formData.indigenousPeople === "true",
		});

		if (formData.indigenousPeople === "true" && formData.indigenousGroup) {
			const indigenousGroupData = indigenousGroups.find((g) => g.code === formData.indigenousGroup);
			extensions.push({
				url: "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-group",
				valueCodeableConcept: {
					coding: [
						{
							system: "urn://example.com/ph-core/fhir/CodeSystem/indigenous-groups",
							code: formData.indigenousGroup,
							display: indigenousGroupData?.display,
						},
					],
				},
			});
		}

		if (formData.maritalStatus) {
			patient.maritalStatus = {
				coding: [
					{
						system: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
						code: formData.maritalStatus,
					},
				],
			};
		}

		if (formData.philhealthId) {
			patient.identifier = [
				{
					use: "official",
					type: {
						coding: [
							{
								system: "http://terminology.hl7.org/CodeSystem/v2-0203",
								code: "SB",
								display: "Social Beneficiary Identifier",
							},
						],
					},
					system: "http://philhealth.gov.ph/fhir/Identifier/philhealth-id",
					value: formData.philhealthId,
				},
			];
		}

		return patient;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const fhirPatient = buildFHIRPatient();

			const response = await fetch("/api/patients", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(fhirPatient),
			});

			if (!response.ok) {
				throw new Error("Failed to register patient");
			}

			setShowSuccessDialog(true);
		} catch (error) {
			console.error("Error registering patient:", error);
			alert("Failed to register patient. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDialogClose = () => {
		setShowSuccessDialog(false);
		router.push("/patients");
	};

	return (
		<>
			<form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
				<div className="mb-8">
					<h2 className="text-2xl font-semibold text-stone-900 mb-2">Patient Registration</h2>
					<p className="text-sm text-stone-600">Please fill out all required fields marked with *</p>
				</div>

				<div className="space-y-8">
					<section>
						<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Personal Information</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormInput
								label="First Name"
								value={formData.firstName}
								onChange={(val) => updateField("firstName", val)}
								required
								placeholder="Juan"
							/>
							<FormInput
								label="Middle Name"
								value={formData.middleName}
								onChange={(val) => updateField("middleName", val)}
								placeholder="Garcia"
							/>
							<FormInput
								label="Last Name"
								value={formData.lastName}
								onChange={(val) => updateField("lastName", val)}
								required
								placeholder="Dela Cruz"
							/>
							<FormInput
								label="Suffix"
								value={formData.suffix}
								onChange={(val) => updateField("suffix", val)}
								placeholder="Jr., Sr., III"
							/>
							<FormInput
								label="Birth Date"
								type="date"
								value={formData.birthDate}
								onChange={(val) => updateField("birthDate", val)}
								required
							/>
							<FormSelect
								label="Gender"
								value={formData.gender}
								onChange={(val) => updateField("gender", val)}
								options={GENDER_OPTIONS}
								required
							/>
						</div>
					</section>

					<section>
						<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Demographics</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormSelect
								label="Religion"
								value={formData.religion}
								onChange={(val) => updateField("religion", val)}
								options={religions}
								loading={religionsLoading}
							/>
							<FormSelect
								label="Race"
								value={formData.race}
								onChange={(val) => updateField("race", val)}
								options={races}
								loading={racesLoading}
							/>
							<FormSelect
								label="Educational Attainment"
								value={formData.educationalAttainment}
								onChange={(val) => updateField("educationalAttainment", val)}
								options={educations}
								loading={educationsLoading}
							/>
							<FormSelect
								label="Occupation"
								value={formData.occupation}
								onChange={(val) => updateField("occupation", val)}
								options={occupations}
								loading={occupationsLoading}
							/>
							<FormSelect
								label="Indigenous People"
								value={formData.indigenousPeople}
								onChange={handleIndigenousChange}
								options={INDIGENOUS_OPTIONS}
							/>
							{formData.indigenousPeople === "true" && (
								<FormSelect
									label="Indigenous Group"
									value={formData.indigenousGroup}
									onChange={(val) => updateField("indigenousGroup", val)}
									options={indigenousGroups}
									loading={indigenousGroupsLoading}
									required
								/>
							)}
							<FormSelect
								label="Marital Status"
								value={formData.maritalStatus}
								onChange={(val) => updateField("maritalStatus", val)}
								options={MARITAL_STATUS_OPTIONS}
							/>
						</div>
					</section>

					<section>
						<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Address</h3>
						<div className="grid grid-cols-1 gap-6">
							<FormInput
								label="Street Address"
								value={formData.streetAddress}
								onChange={(val) => updateField("streetAddress", val)}
								placeholder="123 Sampaguita Street"
								required
							/>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<FormSelect
									label="Region"
									value={formData.region}
									onChange={handleRegionChange}
									options={regions}
									loading={regionsLoading}
									required
								/>
								{!regionIsNCR && (
									<FormSelect
										label="Province"
										value={formData.province}
										onChange={handleProvinceChange}
										options={provinces}
										loading={provincesLoading}
										disabled={!formData.region}
										required
									/>
								)}
								<FormSelect
									label="City/Municipality"
									value={formData.cityMunicipality}
									onChange={handleCityChange}
									options={cities}
									loading={citiesLoading}
									disabled={!regionIsNCR && !formData.province}
									required
								/>
								<FormSelect
									label="Barangay"
									value={formData.barangay}
									onChange={(val) => updateField("barangay", val)}
									options={barangays}
									loading={barangaysLoading}
									disabled={!formData.cityMunicipality}
									required
								/>
								<FormInput
									label="Postal Code"
									value={formData.postalCode}
									onChange={(val) => updateField("postalCode", val)}
									placeholder="1870"
									maxLength={4}
									required
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
								onChange={(val) => updateField("mobilePhone", val)}
								placeholder="09171234567"
								maxLength={11}
								required
							/>
							<FormInput
								label="Email Address"
								type="email"
								value={formData.email}
								onChange={(val) => updateField("email", val)}
								placeholder="juan.delacruz@example.com"
							/>
						</div>
					</section>

					<section>
						<h3 className="text-lg font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">Health Insurance</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormInput
								label="PhilHealth ID"
								value={formData.philhealthId}
								onChange={(val) => updateField("philhealthId", val)}
								placeholder="12-345678901-2"
								maxLength={15}
							/>
						</div>
					</section>
				</div>

				<div className="mt-8 flex gap-4 justify-end">
					<button
						type="button"
						onClick={() => router.push("/patients")}
						disabled={isSubmitting}
						className="px-6 h-12 rounded-xl bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-6 h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
					>
						{isSubmitting ? "Registering..." : "Register Patient"}
					</button>
				</div>
			</form>

			{showSuccessDialog && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
						<div className="flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mx-auto mb-4">
							<svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-stone-900 text-center mb-2">Patient Registered Successfully!</h3>
						<p className="text-stone-600 text-center mb-6">
							{formData.firstName} {formData.lastName} has been added to the system.
						</p>
						<button
							onClick={handleDialogClose}
							className="w-full h-12 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
						>
							View Patients
						</button>
					</div>
				</div>
			)}
		</>
	);
}