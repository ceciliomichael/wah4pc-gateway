import type { ResourceDefinition } from "./types";

export const encounterResource: ResourceDefinition = {
  id: "encounter",
  name: "Encounter",
  title: "PH Core Encounter",
  description:
    "This profile sets minimum expectations for an Encounter resource to record, search, and fetch basic encounter information for a patient. It is based on the FHIR R4 Encounter resource and identifies the additional mandatory core elements, extensions, vocabularies and value sets that SHALL be present when conforming to this profile.",
  profileUrl: "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Encounter",
  fields: [
    {
      name: "meta.profile",
      path: "Encounter.meta.profile",
      type: "canonical[]",
      description: "Must include the PH Core Encounter profile URL",
      required: true,
    },
    {
      name: "status",
      path: "Encounter.status",
      type: "code",
      description: "Current status of the encounter (planned | arrived | triaged | in-progress | onleave | finished | cancelled | entered-in-error | unknown)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/encounter-status",
        displayName: "Encounter Status",
      },
    },
    {
      name: "class",
      path: "Encounter.class",
      type: "Coding",
      description: "Classification of the encounter (e.g., AMB for ambulatory, IMP for inpatient)",
      required: true,
      binding: {
        strength: "extensible",
        valueSet: "http://terminology.hl7.org/ValueSet/v3-ActEncounterCode",
        displayName: "Act Encounter Code",
      },
    },
    {
      name: "subject",
      path: "Encounter.subject",
      type: "Reference",
      description: "Reference to the patient - must conform to PH Core Patient profile",
      required: true,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"],
    },
    {
      name: "participant.individual",
      path: "Encounter.participant.individual",
      type: "Reference",
      description: "Healthcare provider involved - must reference PH Core Practitioner, PractitionerRole, or PH Core RelatedPerson",
      required: false,
      referenceTarget: [
        "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner",
        "http://hl7.org/fhir/StructureDefinition/PractitionerRole",
        "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-relatedperson",
      ],
    },
    {
      name: "period",
      path: "Encounter.period",
      type: "Period",
      description: "The start and end time of the encounter",
      required: false,
    },
    {
      name: "reasonCode",
      path: "Encounter.reasonCode",
      type: "CodeableConcept[]",
      description: "Coded reason the encounter takes place",
      required: false,
    },
    {
      name: "serviceProvider",
      path: "Encounter.serviceProvider",
      type: "Reference",
      description: "The organization responsible for the encounter",
      required: false,
      referenceTarget: ["http://hl7.org/fhir/StructureDefinition/Organization"],
    },
  ],
  jsonTemplate: `{
  "resourceType": "Encounter",
  "id": "example-encounter",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">An ambulatory encounter for the patient.</div>"
  },
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "urn:uuid:64eb2d39-8da6-4c1d-b4c7-a6d3e916cd5b"
  },
  "participant": [
    {
      "individual": {
        "reference": "urn:uuid:a036fd4c-c950-497b-8905-0d2c5ec6f1d4"
      }
    }
  ],
  "period": {
    "start": "2024-01-15T09:00:00+08:00",
    "end": "2024-01-15T10:30:00+08:00"
  },
  "reasonCode": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "185349003",
          "display": "Encounter for check up"
        }
      ]
    }
  ]
}`,
};