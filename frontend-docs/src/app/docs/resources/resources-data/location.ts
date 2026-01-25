import type { ResourceDefinition } from "./types";

export const locationResource: ResourceDefinition = {
  id: "location",
  name: "Location",
  title: "PH Core Location",
  description:
    "Represents physical places where services are provided, equipment is stored, or people reside. This profile localizes the FHIR R4 Location resource to the Philippine context with PH Core Address extensions for PSGC-based geographic coding.",
  profileUrl: "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-location",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Location",
  fields: [
    {
      name: "meta.profile",
      path: "Location.meta.profile",
      type: "canonical[]",
      description: "Must include the PH Core Location profile URL",
      required: true,
    },
    {
      name: "identifier",
      path: "Location.identifier",
      type: "Identifier[]",
      description: "Unique code or number identifying the location (e.g., DOH NHFR code)",
      required: false,
    },
    {
      name: "status",
      path: "Location.status",
      type: "code",
      description: "The operational status of the location (active | suspended | inactive)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/location-status",
        displayName: "Location Status",
      },
    },
    {
      name: "name",
      path: "Location.name",
      type: "string",
      description: "Name of the location as used by humans",
      required: false,
    },
    {
      name: "description",
      path: "Location.description",
      type: "string",
      description: "Additional details about the location",
      required: false,
    },
    {
      name: "mode",
      path: "Location.mode",
      type: "code",
      description: "Indicates whether this is a specific location or a class of locations (instance | kind)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/location-mode",
        displayName: "Location Mode",
      },
    },
    {
      name: "type",
      path: "Location.type",
      type: "CodeableConcept[]",
      description: "Type of function performed at the location",
      required: false,
      binding: {
        strength: "extensible",
        valueSet: "http://terminology.hl7.org/ValueSet/v3-ServiceDeliveryLocationRoleType",
        displayName: "Service Delivery Location Role Type",
      },
    },
    {
      name: "address",
      path: "Location.address",
      type: "Address",
      description: "Physical location address using PH Core Address profile with PSGC extensions for region, province, city/municipality, and barangay",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-address"],
    },
    {
      name: "physicalType",
      path: "Location.physicalType",
      type: "CodeableConcept",
      description: "Physical form of the location (building, room, wing, etc.)",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/location-physical-type",
        displayName: "Location Physical Type",
      },
    },
    {
      name: "managingOrganization",
      path: "Location.managingOrganization",
      type: "Reference",
      description: "Organization responsible for provisioning and upkeep (must reference PH Core Organization)",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-organization"],
    },
    {
      name: "partOf",
      path: "Location.partOf",
      type: "Reference",
      description: "Another location this one is physically part of (must reference PH Core Location)",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-location"],
    },
  ],
  jsonTemplate: `{
  "resourceType": "Location",
  "id": "example-location",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-location"
    ]
  },
  "status": "active",
  "name": "Philippine General Hospital - Main Building",
  "description": "Main hospital building with emergency and outpatient services",
  "mode": "instance",
  "type": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          "code": "HOSP",
          "display": "Hospital"
        }
      ]
    }
  ],
  "address": {
    "use": "work",
    "type": "physical",
    "line": ["Taft Avenue"],
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
  },
  "physicalType": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/location-physical-type",
        "code": "bu",
        "display": "Building"
      }
    ]
  },
  "managingOrganization": {
    "reference": "Organization/pgh-main",
    "display": "Philippine General Hospital"
  }
}`,
};