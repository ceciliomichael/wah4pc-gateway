# PH Core Patient

Patient resource schema with required extensions (indigenousPeople), PH Core Address profile, PhilHealth ID identifiers, and complete JSON template

## Profile URL

**Required in `meta.profile`:**
`urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient`

## Required Fields

- **`meta.profile`** (canonical[]): Must include the PH Core Patient profile URL
- **`extension:indigenousPeople`** (Extension): Indicates whether the patient is an indigenous person (boolean value)

## Optional Fields

- **`extension:nationality`** (Extension): Patient
- **`extension:religion`** (Extension): Patient
- **`extension:indigenousGroup`** (Extension): Specific indigenous group if patient is indigenous
- **`extension:occupation`** (Extension): Patient
- **`extension:race`** (Extension): Patient
- **`extension:educationalAttainment`** (Extension): Patient
- **`identifier:PHCorePhilHealthID`** (Identifier): PhilHealth ID - system must match the pattern when provided
- **`identifier:PHCorePddRegistration`** (Identifier): PhilHealth Dialysis Database Registration Number
- **`address`** (Address): Patient address using PH Core Address profile with PSGC extensions
- **`maritalStatus`** (CodeableConcept): Patient
- **`contact.relationship`** (CodeableConcept): Relationship of contact to patient
- **`name`** (HumanName[]): Patient
- **`gender`** (code): Patient
- **`birthDate`** (date): Patient
- **`active`** (boolean): Whether the patient record is active

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Patient",
  "id": "example-patient",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Juan Dela Cruz is a male patient born on June 15, 1985, residing in Quezon City, NCR, Philippines.</div>"
  },
  "extension": [
    {
      "url": "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people",
      "valueBoolean": false
    },
    {
      "url": "http://hl7.org/fhir/StructureDefinition/patient-nationality",
      "extension": [
        {
          "url": "code",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "urn:iso:std:iso:3166",
                "code": "PH",
                "display": "Philippines"
              }
            ]
          }
        }
      ]
    },
    {
      "url": "http://hl7.org/fhir/StructureDefinition/patient-religion",
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ReligiousAffiliation",
            "code": "1041",
            "display": "Roman Catholic Church"
          }
        ]
      }
    },
    {
      "url": "urn://example.com/ph-core/fhir/StructureDefinition/race",
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "urn://example.com/ph-core/fhir/CodeSystem/race",
            "code": "filipino",
            "display": "Filipino"
          }
        ]
      }
    }
  ],
  "identifier": [
    {
      "system": "http://philhealth.gov.ph/fhir/Identifier/philhealth-id",
      "value": "12-345678901-2"
    }
  ],
  "name": [
    {
      "family": "Dela Cruz",
      "given": ["Juan", "Santos"]
    }
  ],
  "gender": "male",
  "birthDate": "1985-06-15",
  "active": true,
  "address": [
    {
      "line": ["123 Rizal Street", "Barangay Commonwealth"],
      "city": "Quezon City",
      "postalCode": "1121",
      "country": "PH",
      "extension": [
        {
          "url": "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-address-region",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
                "code": "130000000",
                "display": "NCR"
              }
            ]
          }
        },
        {
          "url": "urn://example.com/ph-core/fhir/StructureDefinition/city-municipality",
          "valueCoding": {
            "system": "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
            "code": "137404000",
            "display": "Quezon City"
          }
        },
        {
          "url": "urn://example.com/ph-core/fhir/StructureDefinition/barangay",
          "valueCoding": {
            "system": "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
            "code": "137404019",
            "display": "Camp Aguinaldo"
          }
        }
      ]
    }
  ],
  "maritalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
        "code": "M",
        "display": "Married"
      }
    ]
  }
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).