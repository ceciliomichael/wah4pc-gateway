# MedicationRequest

Order or prescription for medication to be supplied and instructions for use

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/MedicationRequest`

## Required Fields

- **`status`** (code): Status of the prescription (active | on-hold | cancelled | completed | entered-in-error | stopped | draft | unknown)
- **`intent`** (code): Type of request (proposal | plan | order | original-order | reflex-order | filler-order | instance-order | option)
- **`medicationCodeableConcept`** (CodeableConcept): Medication to be taken
- **`subject`** (Reference): Who the medication is for

## Optional Fields

- **`identifier`** (Identifier[]): External IDs for this request
- **`category`** (CodeableConcept[]): Type of medication usage
- **`priority`** (code): Urgency of the request (routine | urgent | asap | stat)
- **`encounter`** (Reference): Encounter created as part of
- **`authoredOn`** (dateTime): When request was initially authored
- **`requester`** (Reference): Who ordered the medication
- **`dosageInstruction`** (Dosage[]): How the medication should be taken
- **`dispenseRequest`** (BackboneElement): Medication supply authorization

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
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
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).