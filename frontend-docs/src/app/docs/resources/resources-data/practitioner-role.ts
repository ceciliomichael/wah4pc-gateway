import type { ResourceDefinition } from "./types";

export const practitionerRoleResource: ResourceDefinition = {
  id: "practitioner-role",
  name: "PractitionerRole",
  title: "Practitioner Role",
  description:
    "A specific set of Roles/Locations/specialties/services that a practitioner may perform at an organization for a period of time. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/PractitionerRole",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/PractitionerRole",
  fields: [
    {
      name: "identifier",
      path: "PractitionerRole.identifier",
      type: "Identifier[]",
      description: "Business identifiers assigned to this practitioner role",
      required: false,
    },
    {
      name: "active",
      path: "PractitionerRole.active",
      type: "boolean",
      description: "Whether this practitioner role record is in active use",
      required: false,
    },
    {
      name: "period",
      path: "PractitionerRole.period",
      type: "Period",
      description: "The period during which the practitioner is authorized to perform in these role(s)",
      required: false,
    },
    {
      name: "practitioner",
      path: "PractitionerRole.practitioner",
      type: "Reference",
      description: "Practitioner that is able to provide the defined services",
      required: false,
      referenceTarget: ["Practitioner"],
    },
    {
      name: "organization",
      path: "PractitionerRole.organization",
      type: "Reference",
      description: "Organization where the roles are available",
      required: false,
      referenceTarget: ["Organization"],
    },
    {
      name: "code",
      path: "PractitionerRole.code",
      type: "CodeableConcept[]",
      description: "Roles which this practitioner may perform",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/practitioner-role",
        displayName: "Practitioner Role",
      },
    },
    {
      name: "specialty",
      path: "PractitionerRole.specialty",
      type: "CodeableConcept[]",
      description: "Specific specialty of the practitioner",
      required: false,
      binding: {
        strength: "preferred",
        valueSet: "http://hl7.org/fhir/ValueSet/c80-practice-codes",
        displayName: "Practice Setting Code",
      },
    },
    {
      name: "location",
      path: "PractitionerRole.location",
      type: "Reference[]",
      description: "The location(s) at which this practitioner provides care",
      required: false,
      referenceTarget: ["Location"],
    },
    {
      name: "healthcareService",
      path: "PractitionerRole.healthcareService",
      type: "Reference[]",
      description: "The healthcare services this practitioner provides",
      required: false,
      referenceTarget: ["HealthcareService"],
    },
    {
      name: "telecom",
      path: "PractitionerRole.telecom",
      type: "ContactPoint[]",
      description: "Contact details specific to the role/location/service",
      required: false,
    },
    {
      name: "availableTime",
      path: "PractitionerRole.availableTime",
      type: "BackboneElement[]",
      description: "Times the practitioner is available at this location",
      required: false,
    },
    {
      name: "notAvailable",
      path: "PractitionerRole.notAvailable",
      type: "BackboneElement[]",
      description: "Not available during this time due to provided reason",
      required: false,
    },
  ],
  jsonTemplate: `{
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
}`,
};