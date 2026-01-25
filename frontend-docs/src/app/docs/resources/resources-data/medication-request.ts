import type { ResourceDefinition } from "./types";

export const medicationRequestResource: ResourceDefinition = {
  id: "medication-request",
  name: "MedicationRequest",
  title: "Medication Request",
  description:
    "An order or request for both supply of the medication and the instructions for administration of the medication to a patient. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/MedicationRequest",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/MedicationRequest",
  fields: [
    {
      name: "identifier",
      path: "MedicationRequest.identifier",
      type: "Identifier[]",
      description: "External IDs for this request",
      required: false,
    },
    {
      name: "status",
      path: "MedicationRequest.status",
      type: "code",
      description: "Status of the prescription (active | on-hold | cancelled | completed | entered-in-error | stopped | draft | unknown)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/medicationrequest-status",
        displayName: "Medication Request Status",
      },
    },
    {
      name: "intent",
      path: "MedicationRequest.intent",
      type: "code",
      description: "Type of request (proposal | plan | order | original-order | reflex-order | filler-order | instance-order | option)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/medicationrequest-intent",
        displayName: "Medication Request Intent",
      },
    },
    {
      name: "category",
      path: "MedicationRequest.category",
      type: "CodeableConcept[]",
      description: "Type of medication usage",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/medicationrequest-category",
        displayName: "Medication Request Category",
      },
    },
    {
      name: "priority",
      path: "MedicationRequest.priority",
      type: "code",
      description: "Urgency of the request (routine | urgent | asap | stat)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/request-priority",
        displayName: "Request Priority",
      },
    },
    {
      name: "medicationCodeableConcept",
      path: "MedicationRequest.medication[x]",
      type: "CodeableConcept",
      description: "Medication to be taken",
      required: true,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/medication-codes",
        displayName: "Medication Codes",
      },
    },
    {
      name: "subject",
      path: "MedicationRequest.subject",
      type: "Reference",
      description: "Who the medication is for",
      required: true,
      referenceTarget: ["Patient", "Group"],
    },
    {
      name: "encounter",
      path: "MedicationRequest.encounter",
      type: "Reference",
      description: "Encounter created as part of",
      required: false,
      referenceTarget: ["Encounter"],
    },
    {
      name: "authoredOn",
      path: "MedicationRequest.authoredOn",
      type: "dateTime",
      description: "When request was initially authored",
      required: false,
    },
    {
      name: "requester",
      path: "MedicationRequest.requester",
      type: "Reference",
      description: "Who ordered the medication",
      required: false,
      referenceTarget: ["Practitioner", "PractitionerRole", "Organization", "Patient", "RelatedPerson", "Device"],
    },
    {
      name: "dosageInstruction",
      path: "MedicationRequest.dosageInstruction",
      type: "Dosage[]",
      description: "How the medication should be taken",
      required: false,
    },
    {
      name: "dispenseRequest",
      path: "MedicationRequest.dispenseRequest",
      type: "BackboneElement",
      description: "Medication supply authorization",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "MedicationRequest",
  "id": "example-medication-request",
  "status": "active",
  "intent": "order",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
          "code": "outpatient",
          "display": "Outpatient"
        }
      ]
    }
  ],
  "priority": "routine",
  "medicationCodeableConcept": {
    "coding": [
      {
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "860975",
        "display": "Metformin hydrochloride 500 MG Oral Tablet"
      }
    ],
    "text": "Metformin 500mg"
  },
  "subject": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "encounter": {
    "reference": "Encounter/example-encounter"
  },
  "authoredOn": "2024-01-15T10:00:00Z",
  "requester": {
    "reference": "Practitioner/example-practitioner",
    "display": "Dr. Maria Santos"
  },
  "dosageInstruction": [
    {
      "text": "Take one tablet by mouth twice daily with meals",
      "timing": {
        "repeat": {
          "frequency": 2,
          "period": 1,
          "periodUnit": "d"
        }
      },
      "route": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "26643006",
            "display": "Oral route"
          }
        ]
      },
      "doseAndRate": [
        {
          "doseQuantity": {
            "value": 500,
            "unit": "mg",
            "system": "http://unitsofmeasure.org",
            "code": "mg"
          }
        }
      ]
    }
  ],
  "dispenseRequest": {
    "numberOfRepeatsAllowed": 3,
    "quantity": {
      "value": 180,
      "unit": "tablets"
    },
    "expectedSupplyDuration": {
      "value": 90,
      "unit": "days",
      "system": "http://unitsofmeasure.org",
      "code": "d"
    }
  }
}`,
};