import type { ResourceDefinition } from "./types";

export const organizationResource: ResourceDefinition = {
  id: "organization",
  name: "Organization",
  title: "PH Core Organization",
  description:
    "Represents a formally or informally recognized grouping of people or organizations formed for the purpose of achieving some form of collective action. This profile localizes the FHIR R4 Organization resource to the Philippine context with support for DOH NHFR codes and PH Core Address extensions.",
  profileUrl: "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-organization",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Organization",
  fields: [
    {
      name: "meta.profile",
      path: "Organization.meta.profile",
      type: "canonical[]",
      description: "Must include the PH Core Organization profile URL",
      required: true,
    },
    {
      name: "identifier",
      path: "Organization.identifier",
      type: "Identifier[]",
      description: "Identifies this organization across multiple systems. Supports slicing for specific identifier types.",
      required: false,
    },
    {
      name: "identifier:NhfrCode",
      path: "Organization.identifier",
      type: "Identifier",
      description: "DOH National Health Facilities Registry (NHFR) Code - official facility identifier issued by the Department of Health",
      required: false,
      pattern: "http://doh.gov.ph/fhir/Identifier/doh-nhfr-code",
    },
    {
      name: "active",
      path: "Organization.active",
      type: "boolean",
      description: "Whether the organization's record is still in active use",
      required: false,
    },
    {
      name: "type",
      path: "Organization.type",
      type: "CodeableConcept[]",
      description: "Kind of organization (e.g., hospital, clinic, pharmacy)",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/organization-type",
        displayName: "Organization Type",
      },
    },
    {
      name: "name",
      path: "Organization.name",
      type: "string",
      description: "Name used for the organization",
      required: false,
    },
    {
      name: "alias",
      path: "Organization.alias",
      type: "string[]",
      description: "Alternative names the organization is known by",
      required: false,
    },
    {
      name: "telecom",
      path: "Organization.telecom",
      type: "ContactPoint[]",
      description: "Contact details for the organization (phone, email, etc.)",
      required: false,
    },
    {
      name: "address",
      path: "Organization.address",
      type: "Address[]",
      description: "Address(es) of the organization using PH Core Address profile with PSGC extensions",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-address"],
    },
    {
      name: "partOf",
      path: "Organization.partOf",
      type: "Reference",
      description: "The organization of which this organization forms a part",
      required: false,
      referenceTarget: ["Organization"],
    },
    {
      name: "contact",
      path: "Organization.contact",
      type: "BackboneElement[]",
      description: "Contact for the organization for a certain purpose",
      required: false,
    },
    {
      name: "contact.address",
      path: "Organization.contact.address",
      type: "Address",
      description: "Contact address using PH Core Address profile",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-address"],
    },
  ],
  jsonTemplate: `{
  "resourceType": "Organization",
  "id": "example-organization",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-organization"
    ]
  },
  "identifier": [
    {
      "use": "official",
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
            "code": "FI",
            "display": "Facility ID"
          }
        ]
      },
      "system": "http://doh.gov.ph/fhir/Identifier/doh-nhfr-code",
      "value": "DOH000000000001234"
    }
  ],
  "active": true,
  "type": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/organization-type",
          "code": "prov",
          "display": "Healthcare Provider"
        }
      ]
    }
  ],
  "name": "Philippine General Hospital",
  "alias": ["PGH", "UP-PGH"],
  "telecom": [
    {
      "system": "phone",
      "value": "+63 2 8554 8400",
      "use": "work"
    },
    {
      "system": "email",
      "value": "info@pgh.gov.ph",
      "use": "work"
    }
  ],
  "address": [
    {
      "use": "work",
      "type": "physical",
      "line": ["Taft Avenue, Ermita"],
      "city": "Manila",
      "postalCode": "1000",
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
            "code": "133900000",
            "display": "City of Manila"
          }
        }
      ]
    }
  ]
}`,
};