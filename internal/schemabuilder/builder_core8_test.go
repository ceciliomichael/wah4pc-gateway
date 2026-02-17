package schemabuilder

import (
	"encoding/json"
	"testing"
)

func TestBuildSuccessBundle_Core8Resources(t *testing.T) {
	tests := []struct {
		name             string
		resourceType     string
		inputResource    string
		requiredTopLevel []string
	}{
		{
			name:         "patient",
			resourceType: "Patient",
			inputResource: `{
				"firstName":"Juan",
				"lastName":"Dela Cruz",
				"identifierSystem":"http://philhealth.gov.ph",
				"identifierValue":"12-345678901-1"
			}`,
			requiredTopLevel: []string{"resourceType", "meta", "name", "identifier", "extension"},
		},
		{
			name:         "appointment",
			resourceType: "Appointment",
			inputResource: `{
				"appointmentStatus":"booked",
				"startDateTime":"2026-02-17T09:00:00Z",
				"endDateTime":"2026-02-17T10:00:00Z",
				"patientReference":"Patient/pat-1"
			}`,
			requiredTopLevel: []string{"resourceType", "meta", "status", "start"},
		},
		{
			name:         "encounter",
			resourceType: "Encounter",
			inputResource: `{
				"encounterStatus":"finished",
				"classCode":"AMB",
				"patientReference":"Patient/pat-1"
			}`,
			requiredTopLevel: []string{"resourceType", "meta", "status", "class", "subject"},
		},
		{
			name:         "procedure",
			resourceType: "Procedure",
			inputResource: `{
				"procedureStatus":"completed",
				"procedureCodeSystem":"http://snomed.info/sct",
				"procedureCode":"80146002",
				"patientReference":"Patient/pat-1"
			}`,
			requiredTopLevel: []string{"resourceType", "meta", "status", "code", "subject"},
		},
		{
			name:         "immunization",
			resourceType: "Immunization",
			inputResource: `{
				"immunizationStatus":"completed",
				"vaccineSystem":"http://hl7.org/fhir/sid/cvx",
				"vaccineCode":"207",
				"patientReference":"Patient/pat-1",
				"occurrenceDateTime":"2026-02-17T09:00:00Z"
			}`,
			requiredTopLevel: []string{"resourceType", "meta", "status", "vaccineCode", "patient", "occurrenceDateTime", "primarySource"},
		},
		{
			name:         "observation",
			resourceType: "Observation",
			inputResource: `{
				"observationStatus":"final",
				"observationCodeSystem":"http://loinc.org",
				"observationCode":"8480-6"
			}`,
			requiredTopLevel: []string{"resourceType", "meta", "status", "code"},
		},
		{
			name:         "practitioner",
			resourceType: "Practitioner",
			inputResource: `{
				"firstName":"Maria",
				"lastName":"Santos",
				"identifierSystem":"http://example.org/practitioner-id",
				"identifierValue":"PRAC-001"
			}`,
			requiredTopLevel: []string{"resourceType", "meta", "name", "identifier"},
		},
		{
			name:         "medication",
			resourceType: "Medication",
			inputResource: `{
				"medicationCode":{"system":"http://www.nlm.nih.gov/research/umls/rxnorm","code":"1049502"}
			}`,
			requiredTopLevel: []string{"resourceType", "meta", "code"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			input := []byte(`{"resourceType":"Bundle","type":"collection","entry":[{"resource":` + tc.inputResource + `}]}`)
			out, err := BuildSuccessBundle(tc.resourceType, input)
			if err != nil {
				t.Fatalf("expected no error, got %v", err)
			}

			resource := firstEntryResource(t, out)
			if got := asString(resource["resourceType"]); got != tc.resourceType {
				t.Fatalf("expected resourceType %s, got %s", tc.resourceType, got)
			}
			for _, key := range tc.requiredTopLevel {
				if _, ok := resource[key]; !ok {
					t.Fatalf("expected key %q in rebuilt resource", key)
				}
			}

			meta := asMap(resource["meta"])
			if meta == nil {
				t.Fatalf("expected meta object")
			}
			profiles := asSlice(meta["profile"])
			if len(profiles) == 0 {
				t.Fatalf("expected meta.profile")
			}
			if tc.resourceType == "Patient" && !containsExtensionURL(resource, "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people") {
				t.Fatalf("expected patient indigenousPeople extension")
			}
		})
	}
}

func TestBuildSuccessBundle_ObservationMissingRequiredFails(t *testing.T) {
	input := []byte(`{"resourceType":"Bundle","type":"collection","entry":[{"resource":{}}]}`)
	_, err := BuildSuccessBundle("Observation", input)
	if err == nil {
		t.Fatal("expected error for missing required fields")
	}
}

func TestBuildSuccessBundle_PatientRealPayloadProvidedByUser(t *testing.T) {
	input := []byte(`{
		"resourceType":"Bundle",
		"type":"collection",
		"entry":[
			{
				"resource":{
					"resourceType":"Patient",
					"id":"a43ba81b-c551-463a-8774-046fb91f82a2",
					"meta":{
						"profile":[
							"urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"
						],
						"lastUpdated":"2026-02-17T19:54:17.201Z"
					},
					"active":true,
					"name":[
						{
							"use":"official",
							"family":"Kish",
							"given":[
								"Mahee League",
								"Sah"
							]
						}
					],
					"telecom":[
						{
							"system":"phone",
							"value":"09653234346",
							"use":"mobile",
							"rank":1
						},
						{
							"system":"email",
							"value":"maheeleague@gmail.com",
							"use":"home"
						}
					],
					"gender":"female",
					"birthDate":"2004-02-21",
					"address":[
						{
							"extension":[
								{
									"url":"urn://example.com/ph-core/fhir/StructureDefinition/region",
									"valueCoding":{
										"system":"urn://example.com/ph-core/fhir/CodeSystem/PSGC",
										"code":"150000000",
										"display":"BARMM"
									}
								},
								{
									"url":"urn://example.com/ph-core/fhir/StructureDefinition/province",
									"valueCoding":{
										"system":"urn://example.com/ph-core/fhir/CodeSystem/PSGC",
										"code":"153800000",
										"display":"Maguindanao"
									}
								},
								{
									"url":"urn://example.com/ph-core/fhir/StructureDefinition/city-municipality",
									"valueCoding":{
										"system":"urn://example.com/ph-core/fhir/CodeSystem/PSGC",
										"code":"153801000",
										"display":"Ampatuan"
									}
								},
								{
									"url":"urn://example.com/ph-core/fhir/StructureDefinition/barangay",
									"valueCoding":{
										"system":"urn://example.com/ph-core/fhir/CodeSystem/PSGC",
										"code":""
									}
								}
							],
							"use":"home",
							"type":"physical",
							"line":[
								"103basilan exit drive hehe solid"
							],
							"city":"Ampatuan",
							"district":"Maguindanao",
							"postalCode":"1709",
							"country":"PH"
						}
					],
					"extension":[
						{
							"url":"urn://example.com/ph-core/fhir/StructureDefinition/religion",
							"valueCodeableConcept":{
								"coding":[
									{
										"system":"urn://example.com/ph-core/fhir/CodeSystem/religion",
										"code":"1013",
										"display":"Roman Catholic"
									}
								]
							}
						},
						{
							"url":"urn://example.com/ph-core/fhir/StructureDefinition/race",
							"valueCodeableConcept":{
								"coding":[
									{
										"system":"urn://example.com/ph-core/fhir/CodeSystem/race",
										"code":"filipino",
										"display":"Filipino"
									}
								]
							}
						},
						{
							"url":"urn://example.com/ph-core/fhir/StructureDefinition/educational-attainment",
							"valueCodeableConcept":{
								"coding":[
									{
										"system":"urn://example.com/ph-core/fhir/CodeSystem/educational-attainment",
										"code":"college-undergraduate",
										"display":"College Undergraduate"
									}
								]
							}
						},
						{
							"url":"urn://example.com/ph-core/fhir/StructureDefinition/occupation",
							"valueCodeableConcept":{
								"coding":[
									{
										"system":"urn://example.com/ph-core/fhir/CodeSystem/PSOC",
										"code":"2",
										"display":"Professionals"
									}
								]
							}
						},
						{
							"url":"urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people",
							"valueBoolean":false
						}
					],
					"maritalStatus":{
						"coding":[
							{
								"system":"http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
								"code":"S"
							}
						]
					},
					"identifier":[
						{
							"use":"official",
							"type":{
								"coding":[
									{
										"system":"http://terminology.hl7.org/CodeSystem/v2-0203",
										"code":"SB",
										"display":"Social Beneficiary Identifier"
									}
								]
							},
							"system":"http://philhealth.gov.ph/fhir/Identifier/philhealth-id",
							"value":"23-1232382289-2"
						}
					]
				}
			}
		]
	}`)

	out, err := BuildSuccessBundle("Patient", input)
	if err != nil {
		t.Fatalf("expected payload to pass rebuild, got %v", err)
	}

	resource := firstEntryResource(t, out)
	if asString(resource["resourceType"]) != "Patient" {
		t.Fatalf("expected Patient resourceType")
	}
	if _, ok := resource["name"]; !ok {
		t.Fatalf("expected name to be preserved")
	}
	if _, ok := resource["identifier"]; !ok {
		t.Fatalf("expected identifier to be preserved")
	}
	if !containsExtensionURL(resource, "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people") {
		t.Fatalf("expected indigenous-people extension")
	}
}

func firstEntryResource(t *testing.T, raw []byte) map[string]interface{} {
	t.Helper()
	var bundle map[string]interface{}
	if err := json.Unmarshal(raw, &bundle); err != nil {
		t.Fatalf("invalid bundle: %v", err)
	}
	entryRaw, ok := bundle["entry"].([]interface{})
	if !ok || len(entryRaw) == 0 {
		t.Fatalf("invalid entry")
	}
	entry, ok := entryRaw[0].(map[string]interface{})
	if !ok {
		t.Fatalf("invalid entry object")
	}
	resource, ok := entry["resource"].(map[string]interface{})
	if !ok {
		t.Fatalf("invalid resource")
	}
	return resource
}

func asString(v interface{}) string {
	s, _ := v.(string)
	return s
}

func asMap(v interface{}) map[string]interface{} {
	m, _ := v.(map[string]interface{})
	return m
}

func asSlice(v interface{}) []interface{} {
	s, _ := v.([]interface{})
	return s
}

func containsExtensionURL(resource map[string]interface{}, url string) bool {
	extRaw, ok := resource["extension"].([]interface{})
	if !ok {
		return false
	}
	for _, raw := range extRaw {
		ext, ok := raw.(map[string]interface{})
		if !ok {
			continue
		}
		if asString(ext["url"]) == url {
			return true
		}
	}
	return false
}
