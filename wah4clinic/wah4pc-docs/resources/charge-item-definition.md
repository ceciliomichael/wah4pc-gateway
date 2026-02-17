# ChargeItemDefinition

Definition of billing codes, prices, and rules for charge items

## Profile URL

**Required in `meta.profile`:**
`http://hl7.org/fhir/StructureDefinition/ChargeItemDefinition`

## Required Fields

- **`url`** (uri): Canonical identifier for this charge item definition
- **`status`** (code): Publication status (draft | active | retired | unknown)

## Optional Fields

- **`identifier`** (Identifier[]): Additional identifier for the charge item definition
- **`version`** (string): Business version of the charge item definition
- **`title`** (string): Name for this charge item definition (human-friendly)
- **`description`** (markdown): Natural language description of the charge item definition
- **`code`** (CodeableConcept): Billing code or product type this definition applies to
- **`applicability`** (BackboneElement[]): Whether the charge item definition is applicable
- **`propertyGroup`** (BackboneElement[]): Group of properties which are applicable for the definition

## JSON Template

Use this as a starting point for creating valid resources:

```json
{
  "resourceType": "ChargeItemDefinition",
  "id": "example-charge-item-definition",
  "url": "http://hospital.ph/ChargeItemDefinition/laboratory-cbc",
  "version": "1.0.0",
  "title": "Complete Blood Count Pricing",
  "status": "active",
  "description": "Pricing definition for Complete Blood Count laboratory test",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "85984002",
        "display": "Laboratory test"
      }
    ],
    "text": "Complete Blood Count"
  },
  "propertyGroup": [
    {
      "priceComponent": [
        {
          "type": "base",
          "amount": {
            "value": 500.00,
            "currency": "PHP"
          }
        }
      ]
    }
  ]
}
```

## Validation

This resource must include the profile URL in `meta.profile`. Resources that do not conform will be rejected with HTTP 422 (Unprocessable Entity).