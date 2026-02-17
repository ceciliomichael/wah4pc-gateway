# PH Core Organization

Organization resource schema with DOH National Health Facilities Registry (NHFR) code support and PSGC address extensions

## Profile URL

**Required in `meta.profile`:**
`urn://example.com/ph-core/fhir/StructureDefinition/ph-core-organization`

## Required Fields

- **`meta.profile`** (canonical[]): Must include the PH Core Organization profile URL

## Optional Fields

- **`identifier`** (Identifier[]): Identifies this organization across multiple systems. Supports slicing for specific identifier types.
- **`identifier:NhfrCode`** (Identifier): DOH National Health Facilities Registry (NHFR) Code - official facility identifier issued by the Department of Health
- **`active`** (boolean): Whether the organization
- **`type`** (CodeableConcept[]): Kind of organization (e.g., hospital, clinic, pharmacy)
- **`name`** (string): Name used for the organization
- **`alias`** (string[]): Alternative names the organization is known by
- **`telecom`** (ContactPoint[]): Contact details for the organization (phone, email, etc.)
- **`address`** (Address[]): Address(es) of the organization using PH Core Address profile with PSGC extensions
- **`partOf`** (Reference): The organization of which this organization forms a part
- **`contact`** (BackboneElement[]): Contact for the organization for a certain purpose
- **`contact.address`** (Address): Contact address using PH Core Address profile

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Organization",
  "id": "example-organization",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-organization"
    ]
  },
  "identifier": [
    {
      "use": "official",
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
            "code": "FI",
            "display": "Facility ID"
          }
        ]
      },
      "system": "http://doh.gov.ph/fhir/Identifier/doh-nhfr-code",
      "value": "DOH000000000001234"
    }
  ],
  "active": true,
  "type": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/organization-type",
          "code": "prov",
          "display": "Healthcare Provider"
        }
      ]
    }
  ],
  "name": "Philippine General Hospital",
  "alias": ["PGH", "UP-PGH"],
  "telecom": [
    {
      "system": "phone",
      "value": "+63 2 8554 8400",
      "use": "work"
    },
    {
      "system": "email",
      "value": "info@pgh.gov.ph",
      "use": "work"
    }
  ],
  "address": [
    {
      "use": "work",
      "type": "physical",
      "line": ["Taft Avenue, Ermita"],
      "city": "Manila",
      "postalCode": "1000",
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
            "code": "133900000",
            "display": "City of Manila"
          }
        }
      ]
    }
  ]
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).