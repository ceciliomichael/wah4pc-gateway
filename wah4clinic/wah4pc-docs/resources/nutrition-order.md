# NutritionOrder

Request for diet, formula feeding, or nutritional supplements

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/NutritionOrder`

## Required Fields

- **`status`** (code): The status of the nutrition order (draft | active | on-hold | revoked | completed | entered-in-error | unknown)
- **`intent`** (code): Indicates the level of authority/intentionality (proposal | plan | directive | order | original-order | reflex-order | filler-order | instance-order | option)
- **`patient`** (Reference): The person who requires the diet, formula or nutritional supplement
- **`dateTime`** (dateTime): Date and time the nutrition order was requested

## Optional Fields

- **`identifier`** (Identifier[]): Identifiers assigned to this order
- **`encounter`** (Reference): The encounter associated with this nutrition order
- **`orderer`** (Reference): Who ordered the diet, formula or nutritional supplement
- **`allergyIntolerance`** (Reference[]): List of the patient
- **`foodPreferenceModifier`** (CodeableConcept[]): Order-specific modifier about the type of food that should be given
- **`oralDiet`** (BackboneElement): Oral diet components
- **`supplement`** (BackboneElement[]): Supplement components
- **`enteralFormula`** (BackboneElement): Enteral formula components

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "NutritionOrder",
  "id": "example-nutrition-order",
  "status": "active",
  "intent": "order",
  "patient": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "encounter": {
    "reference": "Encounter/example-encounter"
  },
  "dateTime": "2024-01-15T10:00:00Z",
  "orderer": {
    "reference": "Practitioner/example-practitioner",
    "display": "Dr. Maria Santos"
  },
  "allergyIntolerance": [
    {
      "reference": "AllergyIntolerance/shellfish-allergy",
      "display": "Shellfish allergy"
    }
  ],
  "foodPreferenceModifier": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/diet",
          "code": "dairy-free",
          "display": "Dairy Free"
        }
      ]
    }
  ],
  "oralDiet": {
    "type": [
      {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "160674004",
            "display": "Diabetic diet"
          }
        ],
        "text": "Diabetic Diet"
      }
    ],
    "nutrient": [
      {
        "modifier": {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "2331003",
              "display": "Carbohydrate"
            }
          ]
        },
        "amount": {
          "value": 150,
          "unit": "grams",
          "system": "http://unitsofmeasure.org",
          "code": "g"
        }
      }
    ],
    "instruction": "Limit carbohydrate intake to 150g per day"
  }
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).