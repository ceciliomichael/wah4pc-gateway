# PH Core Immunization

Immunization resource schema with CVX vaccine codes, patient/encounter references, dose quantity, lot number, and funding source

## Profile URL

**Required in `meta.profile`:**
`urn://example.com/ph-core/fhir/StructureDefinition/ph-core-immunization`

## Required Fields

- **`meta.profile`** (canonical[]): Must include the PH Core Immunization profile URL
- **`status`** (code): Current status (completed | entered-in-error | not-done)
- **`vaccineCode`** (CodeableConcept): Vaccine product administered - CVX codes recommended
- **`patient`** (Reference): The patient who received the immunization - must conform to PH Core Patient
- **`occurrenceDateTime`** (dateTime | string): When the vaccine was administered

## Optional Fields

- **`encounter`** (Reference): The encounter during which immunization was given - must conform to PH Core Encounter
- **`primarySource`** (boolean): Indicates if this is from the source who administered the vaccine
- **`lotNumber`** (string): Vaccine lot number
- **`expirationDate`** (date): Vaccine expiration date
- **`site`** (CodeableConcept): Body site where vaccine was administered
- **`route`** (CodeableConcept): Route of administration (e.g., IM, SC)
- **`doseQuantity`** (Quantity): Amount of vaccine administered
- **`performer`** (BackboneElement[]): Who performed the immunization
- **`fundingSource`** (CodeableConcept): Funding source (public | private)

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Immunization",
  "id": "example-immunization",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-immunization"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Patient received influenza vaccine.</div>"
  },
  "identifier": [
    {
      "system": "urn:ietf:rfc:3986",
      "value": "urn:oid:1.3.6.1.4.1.21367.2005.3.7.1234"
    }
  ],
  "status": "completed",
  "vaccineCode": {
    "coding": [
      {
        "system": "http://hl7.org/fhir/sid/cvx",
        "code": "141",
        "display": "Influenza, seasonal, injectable"
      }
    ],
    "text": "Influenza Vaccine"
  },
  "patient": {
    "reference": "urn:uuid:64eb2d39-8da6-4c1d-b4c7-a6d3e916cd5b"
  },
  "encounter": {
    "reference": "urn:uuid:b3f5e8c2-a123-4567-89ab-cdef01234567"
  },
  "occurrenceDateTime": "2024-01-15T10:00:00+08:00",
  "primarySource": true,
  "lotNumber": "AAJN11K",
  "expirationDate": "2025-06-30",
  "site": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActSite",
        "code": "LA",
        "display": "left arm"
      }
    ]
  },
  "route": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration",
        "code": "IM",
        "display": "Injection, intramuscular"
      }
    ]
  },
  "doseQuantity": {
    "value": 0.5,
    "unit": "mL",
    "system": "http://unitsofmeasure.org",
    "code": "mL"
  },
  "performer": [
    {
      "actor": {
        "reference": "urn:uuid:a036fd4c-c950-497b-8905-0d2c5ec6f1d4"
      },
      "function": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0443",
            "code": "AP",
            "display": "Administering Provider"
          }
        ]
      }
    }
  ],
  "fundingSource": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/immunization-funding-source",
        "code": "public",
        "display": "Public"
      }
    ]
  },
  "note": [
    {
      "text": "Patient tolerated the vaccine well with no immediate adverse reactions."
    }
  ]
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).