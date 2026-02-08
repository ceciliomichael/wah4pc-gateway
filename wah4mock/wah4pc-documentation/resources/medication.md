import type { ResourceDefinition } from "./types";

export const medicationResource: ResourceDefinition = {
  id: "medication",
  name: "Medication",
  title: "PH Core Medication",
  description:
    "This resource is primarily used for the identification and definition of a medication, including ingredients, for the purposes of prescribing, dispensing, and administering a medication as well as for making statements about medication use. The code is bound to the PH Core drugs ValueSet.",
  profileUrl: "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-medication",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Medication",
  fields: [
    {
      name: "meta.profile",
      path: "Medication.meta.profile",
      type: "canonical[]",
      description: "Must include the PH Core Medication profile URL",
      required: true,
    },
    {
      name: "code",
      path: "Medication.code",
      type: "CodeableConcept",
      description: "Codes that identify this medication - bound to PH Core drugs ValueSet",
      required: false,
      binding: {
        strength: "extensible",
        valueSet: "urn://example.com/ph-core/fhir/ValueSet/drugs",
        displayName: "PH Core Drugs ValueSet",
      },
    },
    {
      name: "status",
      path: "Medication.status",
      type: "code",
      description: "Status of the medication (active | inactive | entered-in-error)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/medication-status",
        displayName: "Medication Status Codes",
      },
    },
    {
      name: "manufacturer",
      path: "Medication.manufacturer",
      type: "Reference",
      description: "Manufacturer of the item",
      required: false,
      referenceTarget: ["http://hl7.org/fhir/StructureDefinition/Organization"],
    },
    {
      name: "form",
      path: "Medication.form",
      type: "CodeableConcept",
      description: "Dose form (e.g., tablet, capsule, injection)",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/medication-form-codes",
        displayName: "SNOMED CT Form Codes",
      },
    },
    {
      name: "amount",
      path: "Medication.amount",
      type: "Ratio",
      description: "Amount of drug in package",
      required: false,
    },
    {
      name: "ingredient",
      path: "Medication.ingredient",
      type: "BackboneElement[]",
      description: "Active or inactive ingredient",
      required: false,
    },
    {
      name: "batch",
      path: "Medication.batch",
      type: "BackboneElement",
      description: "Batch information including lot number and expiration",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Medication",
  "id": "example-medication",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-medication"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Paracetamol 500mg Tablet</div>"
  },
  "status": "active",
  "code": {
    "coding": [
      {
        "system": "urn://example.com/ph-core/fhir/CodeSystem/drugs",
        "code": "paracetamol-500mg",
        "display": "Paracetamol 500mg"
      },
      {
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "313782",
        "display": "Acetaminophen 500 MG Oral Tablet"
      }
    ],
    "text": "Paracetamol 500mg Tablet"
  },
  "form": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "385055001",
        "display": "Tablet"
      }
    ]
  },
  "amount": {
    "numerator": {
      "value": 100,
      "unit": "tablets",
      "system": "http://unitsofmeasure.org",
      "code": "{tbl}"
    },
    "denominator": {
      "value": 1,
      "unit": "bottle",
      "system": "http://unitsofmeasure.org",
      "code": "{bottle}"
    }
  },
  "ingredient": [
    {
      "itemCodeableConcept": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "387517004",
            "display": "Paracetamol"
          }
        ]
      },
      "strength": {
        "numerator": {
          "value": 500,
          "unit": "mg",
          "system": "http://unitsofmeasure.org",
          "code": "mg"
        },
        "denominator": {
          "value": 1,
          "unit": "tablet",
          "system": "http://unitsofmeasure.org",
          "code": "{tbl}"
        }
      }
    }
  ],
  "batch": {
    "lotNumber": "MED2024A001",
    "expirationDate": "2026-12-31"
  }
}`,
};