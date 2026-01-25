import type { ResourceDefinition } from "./types";

export const practitionerResource: ResourceDefinition = {
  id: "practitioner",
  name: "Practitioner",
  title: "PH Core Practitioner",
  description:
    "Represents a person who is directly or indirectly involved in the provisioning of healthcare. This profile sets minimum expectations for the Practitioner resource to record, search, and fetch basic demographics and administrative information about an individual practitioner in a Philippine context, including PH Core Address extensions.",
  profileUrl: "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Practitioner",
  fields: [
    {
      name: "meta.profile",
      path: "Practitioner.meta.profile",
      type: "canonical[]",
      description: "Must include the PH Core Practitioner profile URL",
      required: true,
    },
    {
      name: "identifier",
      path: "Practitioner.identifier",
      type: "Identifier[]",
      description: "An identifier for the practitioner (e.g., PRC license number, PHIC accreditation number)",
      required: false,
    },
    {
      name: "active",
      path: "Practitioner.active",
      type: "boolean",
      description: "Whether this practitioner's record is in active use",
      required: false,
    },
    {
      name: "name",
      path: "Practitioner.name",
      type: "HumanName[]",
      description: "The name(s) associated with the practitioner",
      required: false,
    },
    {
      name: "telecom",
      path: "Practitioner.telecom",
      type: "ContactPoint[]",
      description: "Contact details for the practitioner (phone, email, etc.)",
      required: false,
    },
    {
      name: "address",
      path: "Practitioner.address",
      type: "Address[]",
      description: "Address(es) of the practitioner using PH Core Address profile with PSGC extensions for Philippine geographic codes",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-address"],
    },
    {
      name: "gender",
      path: "Practitioner.gender",
      type: "code",
      description: "Administrative gender (male | female | other | unknown)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/administrative-gender",
        displayName: "Administrative Gender",
      },
    },
    {
      name: "birthDate",
      path: "Practitioner.birthDate",
      type: "date",
      description: "The date of birth for the practitioner",
      required: false,
    },
    {
      name: "qualification",
      path: "Practitioner.qualification",
      type: "BackboneElement[]",
      description: "Qualifications obtained by training and certification (e.g., medical degree, specialty board certification)",
      required: false,
    },
    {
      name: "qualification.identifier",
      path: "Practitioner.qualification.identifier",
      type: "Identifier[]",
      description: "An identifier for this qualification (e.g., PRC license number)",
      required: false,
    },
    {
      name: "qualification.code",
      path: "Practitioner.qualification.code",
      type: "CodeableConcept",
      description: "Coded representation of the qualification",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://terminology.hl7.org/ValueSet/v2-0360",
        displayName: "Degree/License/Certificate",
      },
    },
    {
      name: "qualification.period",
      path: "Practitioner.qualification.period",
      type: "Period",
      description: "Period during which the qualification is valid",
      required: false,
    },
    {
      name: "qualification.issuer",
      path: "Practitioner.qualification.issuer",
      type: "Reference",
      description: "Organization that regulates and issues the qualification (e.g., PRC)",
      required: false,
      referenceTarget: ["Organization"],
    },
    {
      name: "communication",
      path: "Practitioner.communication",
      type: "CodeableConcept[]",
      description: "Languages the practitioner can use in patient communication",
      required: false,
      binding: {
        strength: "preferred",
        valueSet: "http://hl7.org/fhir/ValueSet/languages",
        displayName: "Common Languages",
      },
    },
  ],
  jsonTemplate: `{
  "resourceType": "Practitioner",
  "id": "example-practitioner",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner"
    ]
  },
  "identifier": [
    {
      "use": "official",
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
            "code": "MD",
            "display": "Medical License Number"
          }
        ]
      },
      "system": "http://prc.gov.ph/fhir/Identifier/license",
      "value": "0123456"
    }
  ],
  "active": true,
  "name": [
    {
      "use": "official",
      "family": "Santos",
      "given": ["Maria", "Isabel"],
      "prefix": ["Dr."],
      "suffix": ["MD", "FPCP"]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+63 917 123 4567",
      "use": "mobile"
    },
    {
      "system": "email",
      "value": "dr.santos@hospital.ph",
      "use": "work"
    }
  ],
  "address": [
    {
      "use": "work",
      "line": ["123 Medical Center Drive"],
      "city": "Makati City",
      "postalCode": "1200",
      "country": "PH",
      "extension": [
        {
          "url": "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-address-region",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
                "code": "130000000",
                "display": "NCR"
              }
            ]
          }
        },
        {
          "url": "urn://example.com/ph-core/fhir/StructureDefinition/city-municipality",
          "valueCoding": {
            "system": "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
            "code": "137600000",
            "display": "City of Makati"
          }
        }
      ]
    }
  ],
  "gender": "female",
  "birthDate": "1975-03-15",
  "qualification": [
    {
      "identifier": [
        {
          "system": "http://prc.gov.ph/fhir/Identifier/license",
          "value": "0123456"
        }
      ],
      "code": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0360",
            "code": "MD",
            "display": "Doctor of Medicine"
          }
        ]
      },
      "period": {
        "start": "2000-06-01"
      },
      "issuer": {
        "display": "Professional Regulation Commission"
      }
    }
  ],
  "communication": [
    {
      "coding": [
        {
          "system": "urn:ietf:bcp:47",
          "code": "en",
          "display": "English"
        }
      ]
    },
    {
      "coding": [
        {
          "system": "urn:ietf:bcp:47",
          "code": "fil",
          "display": "Filipino"
        }
      ]
    }
  ]
}`,
};