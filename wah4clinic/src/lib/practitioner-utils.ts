interface PractitionerFormData {
	firstName: string;
	middleName: string;
	lastName: string;
	prefix: string;
	suffix: string;
	birthDate: string;
	gender: string;
	email: string;
	mobilePhone: string;
	workPhone: string;
	prcLicense: string;
	tinNumber: string;
	streetAddress: string;
	region: string;
	province: string;
	cityMunicipality: string;
	barangay: string;
	postalCode: string;
}

interface FHIRPractitioner {
	resourceType?: string;
	id?: string;
	active?: boolean;
	name: Array<{
		use: string;
		prefix?: string[];
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

export function fhirToFormData(practitioner: FHIRPractitioner): PractitionerFormData {
	const officialName = practitioner.name.find((n) => n.use === "official") || practitioner.name[0];
	const address = practitioner.address[0];
	const mobilePhone = practitioner.telecom.find((t) => t.system === "phone" && t.use === "mobile");
	const workPhone = practitioner.telecom.find((t) => t.system === "phone" && t.use === "work");
	const email = practitioner.telecom.find((t) => t.system === "email");

	const regionExt = address?.extension.find((e) => e.url.includes("region"));
	const provinceExt = address?.extension.find((e) => e.url.includes("province"));
	const cityExt = address?.extension.find((e) => e.url.includes("city-municipality"));
	const barangayExt = address?.extension.find((e) => e.url.includes("barangay"));

	const prcLicense = practitioner.identifier?.find((i) => 
		i.system === "http://prc.gov.ph/fhir/Identifier/prc-license"
	);
	const tinNumber = practitioner.identifier?.find((i) => 
		i.system === "http://bir.gov.ph/fhir/Identifier/tin"
	);

	return {
		firstName: officialName?.given[0] || "",
		middleName: officialName?.given[1] || "",
		lastName: officialName?.family || "",
		prefix: officialName?.prefix?.[0] || "",
		suffix: officialName?.suffix?.[0] || "",
		birthDate: practitioner.birthDate || "",
		gender: practitioner.gender || "",
		email: email?.value || "",
		mobilePhone: mobilePhone?.value || "",
		workPhone: workPhone?.value || "",
		prcLicense: prcLicense?.value || "",
		tinNumber: tinNumber?.value || "",
		streetAddress: address?.line[0] || "",
		region: regionExt?.valueCoding.code || "",
		province: provinceExt?.valueCoding.code || "",
		cityMunicipality: cityExt?.valueCoding.code || "",
		barangay: barangayExt?.valueCoding.code || "",
		postalCode: address?.postalCode || "",
	};
}

export function buildFHIRPractitioner(
	formData: PractitionerFormData,
	terminologyData: {
		regions: Array<{ code: string; display: string }>;
		provinces: Array<{ code: string; display: string }>;
		cities: Array<{ code: string; display: string }>;
		barangays: Array<{ code: string; display: string }>;
	},
): Omit<FHIRPractitioner, "resourceType" | "id"> {
	const givenNames = [formData.firstName];
	if (formData.middleName) givenNames.push(formData.middleName);

	const regionData = terminologyData.regions.find((r) => r.code === formData.region);
	const provinceData = terminologyData.provinces.find((p) => p.code === formData.province);
	const cityData = terminologyData.cities.find((c) => c.code === formData.cityMunicipality);
	const barangayData = terminologyData.barangays.find((b) => b.code === formData.barangay);

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

	const practitioner: Omit<FHIRPractitioner, "resourceType" | "id"> = {
		active: true,
		name: [
			{
				use: "official",
				...(formData.prefix && { prefix: [formData.prefix] }),
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
			...(formData.workPhone
				? [
						{
							system: "phone",
							value: formData.workPhone,
							use: "work",
							rank: 2,
						},
				  ]
				: []),
			...(formData.email
				? [
						{
							system: "email",
							value: formData.email,
							use: "work",
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
	};

	const identifiers: Array<{
		type: {
			coding: Array<{
				system: string;
				code: string;
				display: string;
			}>;
		};
		system: string;
		value: string;
	}> = [];

	if (formData.prcLicense) {
		identifiers.push({
			type: {
				coding: [
					{
						system: "http://terminology.hl7.org/CodeSystem/v2-0203",
						code: "MD",
						display: "Medical License number",
					},
				],
			},
			system: "http://prc.gov.ph/fhir/Identifier/prc-license",
			value: formData.prcLicense,
		});
	}

	if (formData.tinNumber) {
		identifiers.push({
			type: {
				coding: [
					{
						system: "http://terminology.hl7.org/CodeSystem/v2-0203",
						code: "TAX",
						display: "Tax ID number",
					},
				],
			},
			system: "http://bir.gov.ph/fhir/Identifier/tin",
			value: formData.tinNumber,
		});
	}

	if (identifiers.length > 0) {
		practitioner.identifier = identifiers;
	}

	return practitioner;
}

export type { PractitionerFormData, FHIRPractitioner };