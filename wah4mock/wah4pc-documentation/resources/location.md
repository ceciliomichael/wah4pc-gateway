# PH Core Location

Location resource schema localized for Philippines with PSGC coding for region, province, city/municipality, and barangay

## Profile URL

**Required in `meta.profile`:**
`urn://example.com/ph-core/fhir/StructureDefinition/ph-core-location`

## Required Fields

- **`meta.profile`** (canonical[]): Must include the PH Core Location profile URL

## Optional Fields

- **`identifier`** (Identifier[]): Unique code or number identifying the location (e.g., DOH NHFR code)
- **`status`** (code): The operational status of the location (active | suspended | inactive)
- **`name`** (string): Name of the location as used by humans
- **`description`** (string): Additional details about the location
- **`mode`** (code): Indicates whether this is a specific location or a class of locations (instance | kind)
- **`type`** (CodeableConcept[]): Type of function performed at the location
- **`address`** (Address): Physical location address using PH Core Address profile with PSGC extensions for region, province, city/municipality, and barangay
- **`physicalType`** (CodeableConcept): Physical form of the location (building, room, wing, etc.)
- **`managingOrganization`** (Reference): Organization responsible for provisioning and upkeep (must reference PH Core Organization)
- **`partOf`** (Reference): Another location this one is physically part of (must reference PH Core Location)

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "Location",
  "id": "example-location",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-location"
    ]
  },
  "status": "active",
  "name": "Philippine General Hospital - Main Building",
  "description": "Main hospital building with emergency and outpatient services",
  "mode": "instance",
  "type": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          "code": "HOSP",
          "display": "Hospital"
        }
      ]
    }
  ],
  "address": {
    "use": "work",
    "type": "physical",
    "line": ["Taft Avenue"],
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
  },
  "physicalType": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/location-physical-type",
        "code": "bu",
        "display": "Building"
      }
    ]
  },
  "managingOrganization": {
    "reference": "Organization/pgh-main",
    "display": "Philippine General Hospital"
  }
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).