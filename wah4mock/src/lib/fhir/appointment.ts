/**
 * FHIR Appointment Helper Functions
 * Utilities for building, extracting, and managing Appointment resources (FHIR R4.0.1)
 */

import type {
  Appointment,
  AppointmentFormData,
  AppointmentStatus,
  Patient,
  Practitioner,
} from '../types/fhir';
import { v4 as uuidv4 } from 'uuid';
import { getDisplayName } from './common';

// ============================================================================
// Status Options
// ============================================================================

export const APPOINTMENT_STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'proposed', label: 'Proposed' },
  { value: 'pending', label: 'Pending' },
  { value: 'booked', label: 'Booked' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'noshow', label: 'No Show' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'checked-in', label: 'Checked In' },
  { value: 'waitlist', label: 'Waitlist' },
];

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
}

// ============================================================================
// Appointment Type Options
// ============================================================================

export const APPOINTMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ROUTINE', label: 'Routine' },
  { value: 'WALKIN', label: 'Walk-in' },
  { value: 'CHECKUP', label: 'Check-up' },
  { value: 'FOLLOWUP', label: 'Follow-up' },
  { value: 'EMERGENCY', label: 'Emergency' },
];

export const APPOINTMENT_TYPE_DISPLAY_MAP: Record<string, string> = {
  ROUTINE: 'Routine',
  WALKIN: 'Walk-in',
  CHECKUP: 'Check-up',
  FOLLOWUP: 'Follow-up',
  EMERGENCY: 'Emergency',
};

// ============================================================================
// Service Type Options
// ============================================================================

export const SERVICE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'GENRL', label: 'General Practice' },
  { value: 'CARD', label: 'Cardiology' },
  { value: 'DERM', label: 'Dermatology' },
  { value: 'ENDO', label: 'Endocrinology' },
  { value: 'GASTRO', label: 'Gastroenterology' },
  { value: 'NEURO', label: 'Neurology' },
  { value: 'OBG', label: 'OB-GYN' },
  { value: 'OPTH', label: 'Ophthalmology' },
  { value: 'ORTHO', label: 'Orthopedics' },
  { value: 'PEDS', label: 'Pediatrics' },
  { value: 'PSYCH', label: 'Psychiatry' },
  { value: 'PULM', label: 'Pulmonology' },
  { value: 'SURG', label: 'Surgery' },
];

export const SERVICE_TYPE_DISPLAY_MAP: Record<string, string> = Object.fromEntries(
  SERVICE_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
);

// ============================================================================
// Specialty Options
// ============================================================================

export const SPECIALTY_OPTIONS: { value: string; label: string }[] = [
  { value: '394802001', label: 'General Medicine' },
  { value: '394579002', label: 'Cardiology' },
  { value: '394582007', label: 'Dermatology' },
  { value: '394583002', label: 'Endocrinology' },
  { value: '394584008', label: 'Gastroenterology' },
  { value: '394591006', label: 'Neurology' },
  { value: '394585009', label: 'Obstetrics and Gynecology' },
  { value: '394594003', label: 'Ophthalmology' },
  { value: '394801008', label: 'Surgery' },
  { value: '394537008', label: 'Pediatrics' },
  { value: '394587001', label: 'Psychiatry' },
];

export const SPECIALTY_DISPLAY_MAP: Record<string, string> = Object.fromEntries(
  SPECIALTY_OPTIONS.map((opt) => [opt.value, opt.label])
);

// ============================================================================
// Date Validation
// ============================================================================

/**
 * Validate that end date is not before start date
 */
export function validateAppointmentDates(start?: string, end?: string): boolean {
  if (!start || !end) return true;
  return new Date(end) >= new Date(start);
}

// ============================================================================
// Appointment Builder
// ============================================================================

/**
 * Build a FHIR Appointment resource from form data
 */
export function buildAppointmentFromFormData(
  data: AppointmentFormData,
  patient: Patient,
  practitioner: Practitioner
): Appointment {
  if (!validateAppointmentDates(data.start, data.end)) {
    throw new Error('End date/time cannot be before start date/time');
  }

  const appointment: Appointment = {
    resourceType: 'Appointment',
    id: uuidv4(),
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    status: data.status,
    created: new Date().toISOString(),
    start: data.start ? new Date(data.start).toISOString() : undefined,
    end: data.end ? new Date(data.end).toISOString() : undefined,
    minutesDuration: data.minutesDuration,
    description: data.description || undefined,
    comment: data.comment || undefined,
    priority: data.priority,
    patientInstruction: data.patientInstruction || undefined,
    participant: [
      {
        actor: {
          reference: `Patient/${patient.id}`,
          display: getDisplayName(patient),
        },
        required: 'required',
        status: 'accepted',
      },
      {
        actor: {
          reference: `Practitioner/${practitioner.id}`,
          display: getDisplayName(practitioner),
        },
        required: 'required',
        status: 'accepted',
      },
    ],
  };

  // Appointment type
  if (data.appointmentTypeCode && data.appointmentTypeDisplay) {
    appointment.appointmentType = {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v2-0276',
          code: data.appointmentTypeCode,
          display: data.appointmentTypeDisplay,
        },
      ],
    };
  }

  // Service type
  if (data.serviceTypeCode && data.serviceTypeDisplay) {
    appointment.serviceType = [
      {
        coding: [
          {
            code: data.serviceTypeCode,
            display: data.serviceTypeDisplay,
          },
        ],
      },
    ];
  }

  // Specialty
  if (data.specialtyCode && data.specialtyDisplay) {
    appointment.specialty = [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: data.specialtyCode,
            display: data.specialtyDisplay,
          },
        ],
      },
    ];
  }

  // Reason
  if (data.reasonText) {
    appointment.reasonCode = [
      {
        text: data.reasonText,
      },
    ];
  }

  // Generate narrative
  appointment.text = {
    status: 'generated',
    div: `<div xmlns="http://www.w3.org/1999/xhtml">Appointment for ${getDisplayName(patient)} with ${getDisplayName(practitioner)}, status: ${data.status}.</div>`,
  };

  return appointment;
}

// ============================================================================
// Appointment Extractor
// ============================================================================

/**
 * Extract form data from an existing Appointment resource
 */
export function extractAppointmentFormData(appointment: Appointment): AppointmentFormData {
  // Find patient and practitioner from participants
  const patientParticipant = appointment.participant?.find(
    (p) => p.actor?.reference?.startsWith('Patient/')
  );
  const practitionerParticipant = appointment.participant?.find(
    (p) => p.actor?.reference?.startsWith('Practitioner/')
  );

  return {
    patientId: patientParticipant?.actor?.reference?.replace('Patient/', '') || '',
    practitionerId: practitionerParticipant?.actor?.reference?.replace('Practitioner/', '') || '',
    status: appointment.status,
    appointmentTypeCode: appointment.appointmentType?.coding?.[0]?.code,
    appointmentTypeDisplay: appointment.appointmentType?.coding?.[0]?.display,
    serviceTypeCode: appointment.serviceType?.[0]?.coding?.[0]?.code,
    serviceTypeDisplay: appointment.serviceType?.[0]?.coding?.[0]?.display,
    specialtyCode: appointment.specialty?.[0]?.coding?.[0]?.code,
    specialtyDisplay: appointment.specialty?.[0]?.coding?.[0]?.display,
    reasonText: appointment.reasonCode?.[0]?.text,
    description: appointment.description,
    comment: appointment.comment,
    priority: appointment.priority,
    start: appointment.start ? new Date(appointment.start).toISOString().slice(0, 16) : '',
    end: appointment.end ? new Date(appointment.end).toISOString().slice(0, 16) : undefined,
    minutesDuration: appointment.minutesDuration,
    patientInstruction: appointment.patientInstruction,
  };
}