import type { ResourceDefinition } from "./types";

export const procedureResource: ResourceDefinition = {
  id: "procedure",
  name: "Procedure",
  title: "PH Core Procedure",
  description:
    "An action that is or was performed on or for a patient, practitioner, device, organization, or location. This profile constrains references to use PH Core Patient and PH Core Encounter profiles.",
  profileUrl: "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-procedure",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Procedure",
  fields: [
    {
      name: "meta.profile",
      path: "Procedure.meta.profile",
      type: "canonical[]",
      description: "Must include the PH Core Procedure profile URL",
      required: true,
    },
    {
      name: "status",
      path: "Procedure.status",
      type: "code",
      description: "Current status (preparation | in-progress | not-done | on-hold | stopped | completed | entered-in-error | unknown)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/event-status",
        displayName: "Event Status",
      },
    },
    {
      name: "code",
      path: "Procedure.code",
      type: "CodeableConcept",
      description: "Identification of the procedure - typically SNOMED CT or ICD-10-PCS codes",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/procedure-code",
        displayName: "Procedure Codes (SNOMED CT)",
      },
    },
    {
      name: "subject",
      path: "Procedure.subject",
      type: "Reference",
      description: "The patient on whom the procedure was performed - must conform to PH Core Patient",
      required: true,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"],
    },
    {
      name: "encounter",
      path: "Procedure.encounter",
      type: "Reference",
      description: "The encounter during which the procedure was performed - must conform to PH Core Encounter",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter"],
    },
    {
      name: "performedDateTime",
      path: "Procedure.performed[x]",
      type: "dateTime | Period | string | Age | Range",
      description: "When the procedure was performed",
      required: false,
    },
    {
      name: "performer",
      path: "Procedure.performer",
      type: "BackboneElement[]",
      description: "The people who performed the procedure",
      required: false,
    },
    {
      name: "bodySite",
      path: "Procedure.bodySite",
      type: "CodeableConcept[]",
      description: "Target body sites - SNOMED CT body structure codes",
      required: false,
    },
    {
      name: "outcome",
      path: "Procedure.outcome",
      type: "CodeableConcept",
      description: "The result of the procedure",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Procedure",
  "id": "example-procedure",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-procedure"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Appendectomy procedure performed on patient.</div>"
  },
  "status": "completed",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "80146002",
        "display": "Appendectomy"
      }
    ],
    "text": "Appendectomy"
  },
  "subject": {
    "reference": "urn:uuid:64eb2d39-8da6-4c1d-b4c7-a6d3e916cd5b"
  },
  "encounter": {
    "reference": "urn:uuid:b3f5e8c2-a123-4567-89ab-cdef01234567"
  },
  "performedDateTime": "2024-01-15T14:30:00+08:00",
  "performer": [
    {
      "actor": {
        "reference": "urn:uuid:a036fd4c-c950-497b-8905-0d2c5ec6f1d4"
      },
      "function": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "304292004",
            "display": "Surgeon"
          }
        ]
      }
    }
  ],
  "bodySite": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "66754008",
          "display": "Appendix structure"
        }
      ]
    }
  ],
  "outcome": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "385669000",
        "display": "Successful"
      }
    ]
  }
}`,
};