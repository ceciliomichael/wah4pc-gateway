import type { ResourceDefinition } from "./types";

export const appointmentResource: ResourceDefinition = {
  id: "appointment",
  name: "Appointment",
  title: "Appointment",
  description:
    "Booking of a healthcare event between participants such as patient and practitioner. Used for scheduling and coordination between providers.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/Appointment",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Appointment",
  fields: [
    {
      name: "meta.profile",
      path: "Appointment.meta.profile",
      type: "canonical[]",
      description: "Should include the Appointment profile URL",
      required: true,
    },
    {
      name: "status",
      path: "Appointment.status",
      type: "code",
      description: "Current state of the appointment (proposed | booked | fulfilled | cancelled, etc.)",
      required: true,
    },
    {
      name: "start",
      path: "Appointment.start",
      type: "instant",
      description: "Appointment start date/time",
      required: true,
    },
    {
      name: "end",
      path: "Appointment.end",
      type: "instant",
      description: "Appointment end date/time",
      required: false,
    },
    {
      name: "participant",
      path: "Appointment.participant",
      type: "BackboneElement[]",
      description: "Actors involved in the appointment (patient, practitioner, location)",
      required: false,
    },
    {
      name: "description",
      path: "Appointment.description",
      type: "string",
      description: "Short free-text summary of the appointment",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Appointment",
  "id": "example-appointment",
  "meta": {
    "profile": [
      "http://hl7.org/fhir/StructureDefinition/Appointment"
    ]
  },
  "status": "booked",
  "start": "2026-02-20T09:00:00Z",
  "end": "2026-02-20T09:30:00Z",
  "description": "Follow-up consultation",
  "participant": [
    {
      "actor": {
        "reference": "Patient/example-patient"
      },
      "status": "accepted"
    },
    {
      "actor": {
        "reference": "Practitioner/example-practitioner"
      },
      "status": "accepted"
    }
  ]
}`,
};

