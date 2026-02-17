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

interface FHIRPatient {
	resourceType?: string;
	id?: string;
	active?: boolean;
	name: Array<{
		use: string;
		family: string;
		given: string[];
		suffix?: string[];
	}>;
	telecom: Array<{
		system: string;
		value: string;
		use?: string;
		rank?: number;
	}>;
	gender: string;
	birthDate: string;
	address: Array<{
		extension: Array<{
			url: string;
			valueCoding: {
				system: string;
				code: string;
				display: string;
			};
		}>;
		use: string;
		type: string;
		line: string[];
		city?: string;
		district?: string;
		postalCode: string;
		country: string;
	}>;
	extension: Array<Record<string, unknown>>;
	maritalStatus?: {
		coding: Array<{
			system: string;
			code: string;
		}>;
	};
	identifier?: Array<{
		type: {
			coding: Array<{
				system: string;
				code: string;
				display: string;
			}>;
		};
		system: string;
		value: string;
	}>;
	[key: string]: unknown;
}

export function fhirToFormData(patient: FHIRPatient): PatientFormData {
	const officialName = patient.name.find((n) => n.use === "official") || patient.name[0];
	const address = patient.address[0];
	const mobilePhone = patient.telecom.find((t) => t.system === "phone" && t.use === "mobile");
	const email = patient.telecom.find((t) => t.system === "email");

	const regionExt = address?.extension.find((e) => e.url.includes("region"));
	const provinceExt = address?.extension.find((e) => e.url.includes("province"));
	const cityExt = address?.extension.find((e) => e.url.includes("city-municipality"));
	const barangayExt = address?.extension.find((e) => e.url.includes("barangay"));

	const religionExt = patient.extension?.find((e) => 
		typeof e.url === "string" && e.url.includes("religion")
	);
	const raceExt = patient.extension?.find((e) => 
		typeof e.url === "string" && e.url.includes("race")
	);
	const educationExt = patient.extension?.find((e) => 
		typeof e.url === "string" && e.url.includes("educational-attainment")
	);
	const occupationExt = patient.extension?.find((e) => 
		typeof e.url === "string" && e.url.includes("occupation")
	);
	const indigenousPeopleExt = patient.extension?.find((e) => 
		typeof e.url === "string" && e.url.includes("indigenous-people")
	);
	const indigenousGroupExt = patient.extension?.find((e) => 
		typeof e.url === "string" && e.url.includes("indigenous-group")
	);

	const philhealthId = patient.identifier?.find((i) => 
		i.system === "http://philhealth.gov.ph/fhir/Identifier/philhealth-id"
	);

	const getCodingCode = (ext: Record<string, unknown> | undefined): string => {
		if (!ext) return "";
		const valueCodeableConcept = ext.valueCodeableConcept as { coding?: Array<{ code: string }> } | undefined;
		return valueCodeableConcept?.coding?.[0]?.code || "";
	};

	return {
		firstName: officialName?.given[0] || "",
		middleName: officialName?.given[1] || "",
		lastName: officialName?.family || "",
		suffix: officialName?.suffix?.[0] || "",
		birthDate: patient.birthDate || "",
		gender: patient.gender || "",
		email: email?.value || "",
		mobilePhone: mobilePhone?.value || "",
		religion: getCodingCode(religionExt),
		race: getCodingCode(raceExt),
		educationalAttainment: getCodingCode(educationExt),
		occupation: getCodingCode(occupationExt),
		indigenousPeople: indigenousPeopleExt?.valueBoolean === true ? "true" : "false",
		indigenousGroup: getCodingCode(indigenousGroupExt),
		maritalStatus: patient.maritalStatus?.coding[0]?.code || "",
		streetAddress: address?.line[0] || "",
		region: regionExt?.valueCoding.code || "",
		province: provinceExt?.valueCoding.code || "",
		cityMunicipality: cityExt?.valueCoding.code || "",
		barangay: barangayExt?.valueCoding.code || "",
		postalCode: address?.postalCode || "",
		philhealthId: philhealthId?.value || "",
	};
}

export function buildFHIRPatient(
	formData: PatientFormData,
	terminologyData: {
		regions: Array<{ code: string; display: string }>;
		provinces: Array<{ code: string; display: string }>;
		cities: Array<{ code: string; display: string }>;
		barangays: Array<{ code: string; display: string }>;
		religions: Array<{ code: string; display: string }>;
		races: Array<{ code: string; display: string }>;
		educations: Array<{ code: string; display: string }>;
		occupations: Array<{ code: string; display: string }>;
		indigenousGroups: Array<{ code: string; display: string }>;
	},
): Omit<FHIRPatient, "resourceType" | "id"> {
	const givenNames = [formData.firstName];
	if (formData.middleName) givenNames.push(formData.middleName);

	const regionData = terminologyData.regions.find((r) => r.code === formData.region);
	const provinceData = terminologyData.provinces.find((p) => p.code === formData.province);
	const cityData = terminologyData.cities.find((c) => c.code === formData.cityMunicipality);
	const barangayData = terminologyData.barangays.find((b) => b.code === formData.barangay);

	const extensions: Array<Record<string, unknown>> = [];

	const addressExtensions: Array<{
		url: string;
		valueCoding: { system: string; code: string; display: string };
	}> = [
		{
			url: "urn://example.com/ph-core/fhir/StructureDefinition/region",
			valueCoding: {
				system: "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
				code: formData.region,
				display: regionData?.display || "",
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
				display: provinceData?.display || "",
			},
		});
	}

	addressExtensions.push(
		{
			url: "urn://example.com/ph-core/fhir/StructureDefinition/city-municipality",
			valueCoding: {
				system: "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
				code: formData.cityMunicipality,
				display: cityData?.display || "",
			},
		},
		{
			url: "urn://example.com/ph-core/fhir/StructureDefinition/barangay",
			valueCoding: {
				system: "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
				code: formData.barangay,
				display: barangayData?.display || "",
			},
		},
	);

	const patient: Omit<FHIRPatient, "resourceType" | "id"> = {
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
		extension: extensions,
	};

	if (formData.religion) {
		const religionData = terminologyData.religions.find((r) => r.code === formData.religion);
		extensions.push({
			url: "urn://example.com/ph-core/fhir/StructureDefinition/religion",
			valueCodeableConcept: {
				coding: [
					{
						system: "urn://example.com/ph-core/fhir/CodeSystem/religion",
						code: formData.religion,
						display: religionData?.display || "",
					},
				],
			},
		});
	}

	if (formData.race) {
		const raceData = terminologyData.races.find((r) => r.code === formData.race);
		extensions.push({
			url: "urn://example.com/ph-core/fhir/StructureDefinition/race",
			valueCodeableConcept: {
				coding: [
					{
						system: "urn://example.com/ph-core/fhir/CodeSystem/race",
						code: formData.race,
						display: raceData?.display || "",
					},
				],
			},
		});
	}

	if (formData.educationalAttainment) {
		const educationData = terminologyData.educations.find((e) => e.code === formData.educationalAttainment);
		extensions.push({
			url: "urn://example.com/ph-core/fhir/StructureDefinition/educational-attainment",
			valueCodeableConcept: {
				coding: [
					{
						system: "urn://example.com/ph-core/fhir/CodeSystem/educational-attainment",
						code: formData.educationalAttainment,
						display: educationData?.display || "",
					},
				],
			},
		});
	}

	if (formData.occupation) {
		const occupationData = terminologyData.occupations.find((o) => o.code === formData.occupation);
		extensions.push({
			url: "urn://example.com/ph-core/fhir/StructureDefinition/occupation",
			valueCodeableConcept: {
				coding: [
					{
						system: "urn://example.com/ph-core/fhir/CodeSystem/PSOC",
						code: formData.occupation,
						display: occupationData?.display || "",
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
		const indigenousGroupData = terminologyData.indigenousGroups.find(
			(g) => g.code === formData.indigenousGroup,
		);
		extensions.push({
			url: "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-group",
			valueCodeableConcept: {
				coding: [
					{
						system: "urn://example.com/ph-core/fhir/CodeSystem/indigenous-groups",
						code: formData.indigenousGroup,
						display: indigenousGroupData?.display || "",
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
}

export type { PatientFormData, FHIRPatient };