/**
 * FHIR Encounter Helper Functions
 * Utilities for building, updating, and extracting Encounter resources
 */

import type {
  Encounter,
  EncounterFormData,
  EncounterStatus,
  EncounterStatusHistory,
  Patient,
  Practitioner,
} from '../types/fhir';
import { PHCORE_PROFILE_URLS } from '../types/fhir';
import { v4 as uuidv4 } from 'uuid';
import { getDisplayName } from './common';

// ============================================================================
// Status Transition Validation
// ============================================================================

/**
 * Valid status transitions for clinic workflow
 * Maps current status -> allowed next statuses
 */
const STATUS_TRANSITIONS: Record<EncounterStatus, EncounterStatus[]> = {
  'planned': ['arrived', 'cancelled', 'entered-in-error'],
  'arrived': ['triaged', 'in-progress', 'cancelled', 'entered-in-error'],
  'triaged': ['in-progress', 'cancelled', 'entered-in-error'],
  'in-progress': ['onleave', 'finished', 'cancelled', 'entered-in-error'],
  'onleave': ['in-progress', 'finished', 'cancelled', 'entered-in-error'],
  'finished': ['in-progress', 'cancelled', 'entered-in-error'], // Allow reopening finished encounters
  'cancelled': ['planned', 'entered-in-error'], // Allow rescheduling cancelled encounters
  'entered-in-error': [], // Terminal state
  'unknown': ['planned', 'arrived', 'in-progress', 'cancelled', 'entered-in-error'],
};

/**
 * Get allowed next statuses from a given status
 */
export function getAllowedStatusTransitions(currentStatus: EncounterStatus): EncounterStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: EncounterStatus,
  newStatus: EncounterStatus
): boolean {
  // Same status is always "valid" (no-op)
  if (currentStatus === newStatus) return true;
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

// ============================================================================
// Date Validation
// ============================================================================

/**
 * Validate that end date is not before start date
 */
export function validateEncounterDates(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return true; // If either is missing, no conflict
  return new Date(endDate) >= new Date(startDate);
}

// ============================================================================
// Status Update Logic
// ============================================================================

export interface StatusUpdateResult {
  success: boolean;
  encounter?: Encounter;
  error?: string;
}

/**
 * Update encounter status with proper history tracking
 * This is the core function for status transitions
 */
export function updateEncounterStatus(
  encounter: Encounter,
  newStatus: EncounterStatus,
  effectiveDate?: string
): StatusUpdateResult {
  const now = effectiveDate || new Date().toISOString();
  
  // Validate transition
  if (!isValidStatusTransition(encounter.status, newStatus)) {
    return {
      success: false,
      error: `Invalid status transition: ${encounter.status} → ${newStatus}. Allowed: ${getAllowedStatusTransitions(encounter.status).join(', ') || 'none'}`,
    };
  }
  
  // No change needed
  if (encounter.status === newStatus) {
    return { success: true, encounter };
  }
  
  // Create updated encounter (immutable update)
  const updatedEncounter: Encounter = {
    ...encounter,
    status: newStatus,
    meta: {
      ...encounter.meta,
      lastUpdated: now,
    },
  };
  
  // Add previous status to history
  const previousStatusEntry: EncounterStatusHistory = {
    status: encounter.status,
    period: {
      start: encounter.meta?.lastUpdated || encounter.period?.start,
      end: now,
    },
  };
  
  updatedEncounter.statusHistory = [
    ...(encounter.statusHistory || []),
    previousStatusEntry,
  ];
  
  // Auto-set period.end when finishing
  if (newStatus === 'finished' && !updatedEncounter.period?.end) {
    updatedEncounter.period = {
      ...updatedEncounter.period,
      end: now,
    };
  }
  
  // Validate dates after update
  if (!validateEncounterDates(updatedEncounter.period?.start, updatedEncounter.period?.end)) {
    return {
      success: false,
      error: 'End date cannot be before start date',
    };
  }
  
  return { success: true, encounter: updatedEncounter };
}

// ============================================================================
// Encounter Builder
// ============================================================================

export function buildEncounterFromFormData(
  data: EncounterFormData,
  patient: Patient,
  practitioner: Practitioner
): Encounter {
  // Validate dates before building
  if (!validateEncounterDates(data.startDate, data.endDate)) {
    throw new Error('End date cannot be before start date');
  }
  
  const encounter: Encounter = {
    resourceType: 'Encounter',
    id: uuidv4(),
    meta: {
      profile: [PHCORE_PROFILE_URLS.encounter],
      lastUpdated: new Date().toISOString(),
    },
    status: data.status,
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: data.classCode,
      display: data.classDisplay,
    },
    subject: {
      reference: `Patient/${patient.id}`,
      display: getDisplayName(patient),
    },
    participant: [
      {
        individual: {
          reference: `Practitioner/${practitioner.id}`,
          display: getDisplayName(practitioner),
        },
      },
    ],
    period: {
      start: data.startDate,
      end: data.endDate || undefined,
    },
  };
  
  if (data.typeCode && data.typeDisplay) {
    encounter.type = [
      {
        coding: [
          {
            code: data.typeCode,
            display: data.typeDisplay,
          },
        ],
      },
    ];
  }
  
  if (data.reasonText) {
    encounter.reasonCode = [
      {
        text: data.reasonText,
      },
    ];
  }
  
  return encounter;
}

// ============================================================================
// Encounter Extractor
// ============================================================================

export function extractEncounterFormData(encounter: Encounter): EncounterFormData {
  return {
    patientId: encounter.subject?.reference?.replace('Patient/', '') || '',
    practitionerId: encounter.participant?.[0]?.individual?.reference?.replace('Practitioner/', '') || '',
    status: encounter.status,
    classCode: encounter.class?.code || 'AMB',
    classDisplay: encounter.class?.display || 'Ambulatory',
    typeCode: encounter.type?.[0]?.coding?.[0]?.code,
    typeDisplay: encounter.type?.[0]?.coding?.[0]?.display,
    reasonText: encounter.reasonCode?.[0]?.text,
    startDate: encounter.period?.start || '',
    endDate: encounter.period?.end,
  };
}

// ============================================================================
// Status Display Helpers
// ============================================================================

export const ENCOUNTER_STATUS_OPTIONS: { value: EncounterStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'onleave', label: 'On Leave' },
  { value: 'finished', label: 'Finished' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
];

export function getStatusLabel(status: EncounterStatus): string {
  return ENCOUNTER_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
}