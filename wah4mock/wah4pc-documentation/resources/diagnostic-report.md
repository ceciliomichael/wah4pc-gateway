import type { ResourceDefinition } from "./types";

export const diagnosticReportResource: ResourceDefinition = {
  id: "diagnostic-report",
  name: "DiagnosticReport",
  title: "Diagnostic Report",
  description:
    "The findings and interpretation of diagnostic tests performed on patients, groups of patients, devices, and locations. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/DiagnosticReport",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/DiagnosticReport",
  fields: [
    {
      name: "identifier",
      path: "DiagnosticReport.identifier",
      type: "Identifier[]",
      description: "Business identifier for the report",
      required: false,
    },
    {
      name: "basedOn",
      path: "DiagnosticReport.basedOn",
      type: "Reference[]",
      description: "What was requested",
      required: false,
      referenceTarget: ["CarePlan", "ImmunizationRecommendation", "MedicationRequest", "NutritionOrder", "ServiceRequest"],
    },
    {
      name: "status",
      path: "DiagnosticReport.status",
      type: "code",
      description: "The status of the diagnostic report (registered | partial | preliminary | final)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/diagnostic-report-status",
        displayName: "Diagnostic Report Status",
      },
    },
    {
      name: "category",
      path: "DiagnosticReport.category",
      type: "CodeableConcept[]",
      description: "Service category",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/diagnostic-service-sections",
        displayName: "Diagnostic Service Section",
      },
    },
    {
      name: "code",
      path: "DiagnosticReport.code",
      type: "CodeableConcept",
      description: "Name/Code for this diagnostic report",
      required: true,
      binding: {
        strength: "preferred",
        valueSet: "http://hl7.org/fhir/ValueSet/report-codes",
        displayName: "LOINC Diagnostic Report Codes",
      },
    },
    {
      name: "subject",
      path: "DiagnosticReport.subject",
      type: "Reference",
      description: "The subject of the report",
      required: false,
      referenceTarget: ["Patient", "Group", "Device", "Location"],
    },
    {
      name: "encounter",
      path: "DiagnosticReport.encounter",
      type: "Reference",
      description: "Health care event when test ordered",
      required: false,
      referenceTarget: ["Encounter"],
    },
    {
      name: "effectiveDateTime",
      path: "DiagnosticReport.effective[x]",
      type: "dateTime",
      description: "Clinically relevant time for report",
      required: false,
    },
    {
      name: "issued",
      path: "DiagnosticReport.issued",
      type: "instant",
      description: "When the report was released",
      required: false,
    },
    {
      name: "performer",
      path: "DiagnosticReport.performer",
      type: "Reference[]",
      description: "Responsible diagnostic service",
      required: false,
      referenceTarget: ["Practitioner", "PractitionerRole", "Organization", "CareTeam"],
    },
    {
      name: "result",
      path: "DiagnosticReport.result",
      type: "Reference[]",
      description: "Observations",
      required: false,
      referenceTarget: ["Observation"],
    },
    {
      name: "conclusion",
      path: "DiagnosticReport.conclusion",
      type: "string",
      description: "Clinical conclusion (interpretation) of test results",
      required: false,
    },
    {
      name: "conclusionCode",
      path: "DiagnosticReport.conclusionCode",
      type: "CodeableConcept[]",
      description: "Codes for the clinical conclusion",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "DiagnosticReport",
  "id": "example-diagnostic-report",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
          "code": "LAB",
          "display": "Laboratory"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "58410-2",
        "display": "Complete blood count (hemogram) panel - Blood by Automated count"
      }
    ],
    "text": "Complete Blood Count"
  },
  "subject": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "encounter": {
    "reference": "Encounter/example-encounter"
  },
  "effectiveDateTime": "2024-01-15T09:30:00Z",
  "issued": "2024-01-15T14:00:00Z",
  "performer": [
    {
      "reference": "Organization/example-organization",
      "display": "Philippine General Hospital Laboratory"
    }
  ],
  "result": [
    {
      "reference": "Observation/hemoglobin",
      "display": "Hemoglobin"
    },
    {
      "reference": "Observation/wbc",
      "display": "White Blood Cell Count"
    }
  ],
  "conclusion": "All values within normal limits"
}`,
};