/**
 * FHIR Helpers - Barrel Export
 * Re-exports all domain-specific FHIR helper functions
 */

// Common utilities
export {
  // Extension helpers
  getExtension,
  getExtensionValue,
  setExtension,
  setCodingExtension,
  // Identifier helpers
  getIdentifier,
  setIdentifier,
  // Name helpers
  formatHumanName,
  getPrimaryName,
  getDisplayName,
  // Contact helpers
  getPhone,
  getEmail,
  // Address helpers
  getAddressExtensionValue,
  formatAddress,
  buildPHCoreAddress,
  // Constants
  PHCORE_EXTENSION_URLS,
  PHCORE_IDENTIFIER_SYSTEMS,
} from './common';

// Patient helpers
export {
  getPhilHealthId,
  getPddRegistration,
  buildPatientFromFormData,
  extractPatientFormData,
} from './patient';

// Practitioner helpers
export {
  buildPractitionerFromFormData,
  extractPractitionerFormData,
} from './practitioner';

// Organization helpers
export {
  getNhfrCode,
  buildOrganizationFromFormData,
  extractOrganizationFormData,
} from './organization';

// Encounter helpers
export {
  // Status management
  getAllowedStatusTransitions,
  isValidStatusTransition,
  validateEncounterDates,
  updateEncounterStatus,
  // Builder/extractor
  buildEncounterFromFormData,
  extractEncounterFormData,
  // Status options
  ENCOUNTER_STATUS_OPTIONS,
  getStatusLabel,
  // Types
  type StatusUpdateResult,
} from './encounter';

// Re-export profile URLs from types
export { PHCORE_PROFILE_URLS } from '../types/fhir';