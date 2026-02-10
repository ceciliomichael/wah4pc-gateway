# PH Core Practitioner

Practitioner resource schema with PRC license identifier support and PH Core address extensions

## Profile URL

**Required in `meta.profile`:**
`urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner`

## Required Fields

- **`meta.profile`** (canonical[]): Must include the PH Core Practitioner profile URL

## Optional Fields

- **`identifier`** (Identifier[]): An identifier for the practitioner (e.g., PRC license number, PHIC accreditation number)
- **`active`** (boolean): Whether this practitioner
- **`name`** (HumanName[]): The name(s) associated with the practitioner
- **`telecom`** (ContactPoint[]): Contact details for the practitioner (phone, email, etc.)
- **`address`** (Address[]): Address(es) of the practitioner using PH Core Address profile with PSGC extensions for Philippine geographic codes
- **`gender`** (code): Administrative gender (male | female | other | unknown)
- **`birthDate`** (date): The date of birth for the practitioner
- **`qualification`** (BackboneElement[]): Qualifications obtained by training and certification (e.g., medical degree, specialty board certification)
- **`qualification.identifier`** (Identifier[]): An identifier for this qualification (e.g., PRC license number)
- **`qualification.code`** (CodeableConcept): Coded representation of the qualification
- **`qualification.period`** (Period): Period during which the qualification is valid
- **`qualification.issuer`** (Reference): Organization that regulates and issues the qualification (e.g., PRC)
- **`communication`** (CodeableConcept[]): Languages the practitioner can use in patient communication

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Practitioner",
  "id": "example-practitioner",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner"
    ]
  },
  "identifier": [
    {
      "use": "official",
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
            "code": "MD",
            "display": "Medical License Number"
          }
        ]
      },
      "system": "http://prc.gov.ph/fhir/Identifier/license",
      "value": "0123456"
    }
  ],
  "active": true,
  "name": [
    {
      "use": "official",
      "family": "Santos",
      "given": ["Maria", "Isabel"],
      "prefix": ["Dr."],
      "suffix": ["MD", "FPCP"]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+63 917 123 4567",
      "use": "mobile"
    },
    {
      "system": "email",
      "value": "dr.santos@hospital.ph",
      "use": "work"
    }
  ],
  "address": [
    {
      "use": "work",
      "line": ["123 Medical Center Drive"],
      "city": "Makati City",
      "postalCode": "1200",
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
            "code": "137600000",
            "display": "City of Makati"
          }
        }
      ]
    }
  ],
  "gender": "female",
  "birthDate": "1975-03-15",
  "qualification": [
    {
      "identifier": [
        {
          "system": "http://prc.gov.ph/fhir/Identifier/license",
          "value": "0123456"
        }
      ],
      "code": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0360",
            "code": "MD",
            "display": "Doctor of Medicine"
          }
        ]
      },
      "period": {
        "start": "2000-06-01"
      },
      "issuer": {
        "display": "Professional Regulation Commission"
      }
    }
  ],
  "communication": [
    {
      "coding": [
        {
          "system": "urn:ietf:bcp:47",
          "code": "en",
          "display": "English"
        }
      ]
    },
    {
      "coding": [
        {
          "system": "urn:ietf:bcp:47",
          "code": "fil",
          "display": "Filipino"
        }
      ]
    }
  ]
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).