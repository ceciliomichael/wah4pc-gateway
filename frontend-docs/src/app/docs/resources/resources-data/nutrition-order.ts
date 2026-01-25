import type { ResourceDefinition } from "./types";

export const nutritionOrderResource: ResourceDefinition = {
  id: "nutrition-order",
  name: "NutritionOrder",
  title: "Nutrition Order",
  description:
    "A request to supply a diet, formula feeding (enteral) or oral nutritional supplement to a patient/resident. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/NutritionOrder",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/NutritionOrder",
  fields: [
    {
      name: "identifier",
      path: "NutritionOrder.identifier",
      type: "Identifier[]",
      description: "Identifiers assigned to this order",
      required: false,
    },
    {
      name: "status",
      path: "NutritionOrder.status",
      type: "code",
      description: "The status of the nutrition order (draft | active | on-hold | revoked | completed | entered-in-error | unknown)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/request-status",
        displayName: "Request Status",
      },
    },
    {
      name: "intent",
      path: "NutritionOrder.intent",
      type: "code",
      description: "Indicates the level of authority/intentionality (proposal | plan | directive | order | original-order | reflex-order | filler-order | instance-order | option)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/request-intent",
        displayName: "Request Intent",
      },
    },
    {
      name: "patient",
      path: "NutritionOrder.patient",
      type: "Reference",
      description: "The person who requires the diet, formula or nutritional supplement",
      required: true,
      referenceTarget: ["Patient"],
    },
    {
      name: "encounter",
      path: "NutritionOrder.encounter",
      type: "Reference",
      description: "The encounter associated with this nutrition order",
      required: false,
      referenceTarget: ["Encounter"],
    },
    {
      name: "dateTime",
      path: "NutritionOrder.dateTime",
      type: "dateTime",
      description: "Date and time the nutrition order was requested",
      required: true,
    },
    {
      name: "orderer",
      path: "NutritionOrder.orderer",
      type: "Reference",
      description: "Who ordered the diet, formula or nutritional supplement",
      required: false,
      referenceTarget: ["Practitioner", "PractitionerRole"],
    },
    {
      name: "allergyIntolerance",
      path: "NutritionOrder.allergyIntolerance",
      type: "Reference[]",
      description: "List of the patient's food and nutrition-related allergies and intolerances",
      required: false,
      referenceTarget: ["AllergyIntolerance"],
    },
    {
      name: "foodPreferenceModifier",
      path: "NutritionOrder.foodPreferenceModifier",
      type: "CodeableConcept[]",
      description: "Order-specific modifier about the type of food that should be given",
      required: false,
    },
    {
      name: "oralDiet",
      path: "NutritionOrder.oralDiet",
      type: "BackboneElement",
      description: "Oral diet components",
      required: false,
    },
    {
      name: "supplement",
      path: "NutritionOrder.supplement",
      type: "BackboneElement[]",
      description: "Supplement components",
      required: false,
    },
    {
      name: "enteralFormula",
      path: "NutritionOrder.enteralFormula",
      type: "BackboneElement",
      description: "Enteral formula components",
      required: false,
    },
  ],
  jsonTemplate: `{
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
}`,
};