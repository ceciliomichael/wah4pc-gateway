import type { ResourceDefinition } from "./types";

export const medicationAdministrationResource: ResourceDefinition = {
  id: "medication-administration",
  name: "MedicationAdministration",
  title: "Medication Administration",
  description:
    "Describes the event of a patient consuming or otherwise being administered a medication. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/MedicationAdministration",
  fields: [
    {
      name: "identifier",
      path: "MedicationAdministration.identifier",
      type: "Identifier[]",
      description: "External identifier for the administration",
      required: false,
    },
    {
      name: "status",
      path: "MedicationAdministration.status",
      type: "code",
      description: "Status of the administration (in-progress | not-done | on-hold | completed | entered-in-error | stopped | unknown)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/medication-admin-status",
        displayName: "Medication Administration Status",
      },
    },
    {
      name: "category",
      path: "MedicationAdministration.category",
      type: "CodeableConcept",
      description: "Type of medication usage",
      required: false,
      binding: {
        strength: "preferred",
        valueSet: "http://hl7.org/fhir/ValueSet/medication-admin-category",
        displayName: "Medication Administration Category",
      },
    },
    {
      name: "medicationCodeableConcept",
      path: "MedicationAdministration.medication[x]",
      type: "CodeableConcept",
      description: "What was administered",
      required: true,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/medication-codes",
        displayName: "Medication Codes",
      },
    },
    {
      name: "subject",
      path: "MedicationAdministration.subject",
      type: "Reference",
      description: "Who received medication",
      required: true,
      referenceTarget: ["Patient", "Group"],
    },
    {
      name: "context",
      path: "MedicationAdministration.context",
      type: "Reference",
      description: "Encounter or Episode of Care",
      required: false,
      referenceTarget: ["Encounter", "EpisodeOfCare"],
    },
    {
      name: "effectiveDateTime",
      path: "MedicationAdministration.effective[x]",
      type: "dateTime",
      description: "Start and end time of administration",
      required: true,
    },
    {
      name: "performer",
      path: "MedicationAdministration.performer",
      type: "BackboneElement[]",
      description: "Who performed the medication administration",
      required: false,
    },
    {
      name: "request",
      path: "MedicationAdministration.request",
      type: "Reference",
      description: "Request administration performed against",
      required: false,
      referenceTarget: ["MedicationRequest"],
    },
    {
      name: "dosage",
      path: "MedicationAdministration.dosage",
      type: "BackboneElement",
      description: "Details of how medication was taken",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "MedicationAdministration",
  "id": "example-medication-administration",
  "status": "completed",
  "category": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/medication-admin-category",
        "code": "inpatient",
        "display": "Inpatient"
      }
    ]
  },
  "medicationCodeableConcept": {
    "coding": [
      {
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "1049502",
        "display": "Acetaminophen 325 MG Oral Tablet"
      }
    ],
    "text": "Paracetamol 325mg"
  },
  "subject": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "context": {
    "reference": "Encounter/example-encounter"
  },
  "effectiveDateTime": "2024-01-15T08:00:00Z",
  "performer": [
    {
      "actor": {
        "reference": "Practitioner/example-nurse",
        "display": "Nurse Ana Garcia"
      }
    }
  ],
  "dosage": {
    "text": "One tablet orally",
    "route": {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "26643006",
          "display": "Oral route"
        }
      ]
    },
    "dose": {
      "value": 325,
      "unit": "mg",
      "system": "http://unitsofmeasure.org",
      "code": "mg"
    }
  }
}`,
};