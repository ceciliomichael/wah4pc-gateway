# PractitionerRole

Roles, specialties, and services a practitioner performs at an organization

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/PractitionerRole`

## Optional Fields

- **`identifier`** (Identifier[]): Business identifiers assigned to this practitioner role
- **`active`** (boolean): Whether this practitioner role record is in active use
- **`period`** (Period): The period during which the practitioner is authorized to perform in these role(s)
- **`practitioner`** (Reference): Practitioner that is able to provide the defined services
- **`organization`** (Reference): Organization where the roles are available
- **`code`** (CodeableConcept[]): Roles which this practitioner may perform
- **`specialty`** (CodeableConcept[]): Specific specialty of the practitioner
- **`location`** (Reference[]): The location(s) at which this practitioner provides care
- **`healthcareService`** (Reference[]): The healthcare services this practitioner provides
- **`telecom`** (ContactPoint[]): Contact details specific to the role/location/service
- **`availableTime`** (BackboneElement[]): Times the practitioner is available at this location
- **`notAvailable`** (BackboneElement[]): Not available during this time due to provided reason

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "PractitionerRole",
  "id": "example-practitioner-role",
  "active": true,
  "period": {
    "start": "2020-01-01"
  },
  "practitioner": {
    "reference": "Practitioner/example-practitioner",
    "display": "Dr. Maria Santos"
  },
  "organization": {
    "reference": "Organization/example-organization",
    "display": "Philippine General Hospital"
  },
  "code": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/practitioner-role",
          "code": "doctor",
          "display": "Doctor"
        }
      ]
    }
  ],
  "specialty": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "394802001",
          "display": "General medicine"
        }
      ]
    }
  ],
  "location": [
    {
      "reference": "Location/example-location",
      "display": "PGH - Main Building"
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+63 2 8554 8400 ext. 123",
      "use": "work"
    }
  ],
  "availableTime": [
    {
      "daysOfWeek": ["mon", "tue", "wed", "thu", "fri"],
      "availableStartTime": "08:00:00",
      "availableEndTime": "17:00:00"
    }
  ]
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).