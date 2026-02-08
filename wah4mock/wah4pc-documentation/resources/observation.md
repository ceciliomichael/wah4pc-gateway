import type { ResourceDefinition } from "./types";

export const observationResource: ResourceDefinition = {
  id: "observation",
  name: "Observation",
  title: "PH Core Observation",
  description:
    "Measurements and simple assertions made about a patient, device or other subject. This profile constrains subject and encounter references to use PH Core profiles. Commonly used for vital signs, laboratory results, and clinical findings.",
  profileUrl: "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Observation",
  fields: [
    {
      name: "meta.profile",
      path: "Observation.meta.profile",
      type: "canonical[]",
      description: "Must include the PH Core Observation profile URL",
      required: true,
    },
    {
      name: "status",
      path: "Observation.status",
      type: "code",
      description: "Current status (registered | preliminary | final | amended | corrected | cancelled | entered-in-error | unknown)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/observation-status",
        displayName: "Observation Status",
      },
    },
    {
      name: "category",
      path: "Observation.category",
      type: "CodeableConcept[]",
      description: "Classification of observation type (e.g., vital-signs, laboratory)",
      required: false,
      binding: {
        strength: "preferred",
        valueSet: "http://hl7.org/fhir/ValueSet/observation-category",
        displayName: "Observation Category Codes",
      },
    },
    {
      name: "code",
      path: "Observation.code",
      type: "CodeableConcept",
      description: "Type of observation - LOINC codes recommended",
      required: true,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/observation-codes",
        displayName: "LOINC Codes",
      },
    },
    {
      name: "subject",
      path: "Observation.subject",
      type: "Reference",
      description: "The patient observed - must conform to PH Core Patient",
      required: true,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"],
    },
    {
      name: "encounter",
      path: "Observation.encounter",
      type: "Reference",
      description: "The encounter context - must conform to PH Core Encounter",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter"],
    },
    {
      name: "effectiveDateTime",
      path: "Observation.effective[x]",
      type: "dateTime | Period | Timing | instant",
      description: "When the observation was made",
      required: false,
    },
    {
      name: "value[x]",
      path: "Observation.value[x]",
      type: "Quantity | CodeableConcept | string | boolean | integer | Range | Ratio | SampledData | time | dateTime | Period",
      description: "Actual result value",
      required: false,
    },
    {
      name: "interpretation",
      path: "Observation.interpretation",
      type: "CodeableConcept[]",
      description: "High, low, normal, etc.",
      required: false,
      binding: {
        strength: "extensible",
        valueSet: "http://hl7.org/fhir/ValueSet/observation-interpretation",
        displayName: "Observation Interpretation Codes",
      },
    },
    {
      name: "bodySite",
      path: "Observation.bodySite",
      type: "CodeableConcept",
      description: "Observed body part - SNOMED CT codes",
      required: false,
    },
    {
      name: "component",
      path: "Observation.component",
      type: "BackboneElement[]",
      description: "Component results (e.g., systolic/diastolic for BP)",
      required: false,
    },
    {
      name: "performer",
      path: "Observation.performer",
      type: "Reference[]",
      description: "Who is responsible for the observation",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Observation",
  "id": "blood-pressure-example",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Blood pressure measurement: 120/80 mmHg</div>"
  },
  "identifier": [
    {
      "system": "urn:ietf:rfc:3986",
      "value": "urn:uuid:187e0c12-8dd2-67e2-99b2-bf273c878281"
    }
  ],
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs",
          "display": "Vital Signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "85354-9",
        "display": "Blood pressure panel with all children optional"
      }
    ],
    "text": "Blood pressure systolic & diastolic"
  },
  "subject": {
    "reference": "urn:uuid:64eb2d39-8da6-4c1d-b4c7-a6d3e916cd5b"
  },
  "encounter": {
    "reference": "urn:uuid:b3f5e8c2-a123-4567-89ab-cdef01234567"
  },
  "effectiveDateTime": "2024-01-15T10:30:00+08:00",
  "performer": [
    {
      "reference": "urn:uuid:a036fd4c-c950-497b-8905-0d2c5ec6f1d4"
    }
  ],
  "bodySite": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "368209003",
        "display": "Right arm"
      }
    ]
  },
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8480-6",
            "display": "Systolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 120,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      },
      "interpretation": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              "code": "N",
              "display": "Normal"
            }
          ]
        }
      ]
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8462-4",
            "display": "Diastolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 80,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      },
      "interpretation": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              "code": "N",
              "display": "Normal"
            }
          ]
        }
      ]
    }
  ]
}`,
};