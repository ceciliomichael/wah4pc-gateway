/**
 * FHIR Patient Helper Functions
 * Utilities for building and extracting Patient resources
 */

import type { Patient, PatientFormData } from '../types/fhir';
import {
  PHCORE_EXTENSION_URLS,
  PHCORE_IDENTIFIER_SYSTEMS,
  PHCORE_PROFILE_URLS,
} from '../types/fhir';
import { v4 as uuidv4 } from 'uuid';
import {
  getExtension,
  getExtensionValue,
  getIdentifier,
  setIdentifier,
  getPrimaryName,
  getPhone,
  getEmail,
  getAddressExtensionValue,
  buildPHCoreAddress,
  generatePatientNarrative,
} from './common';

// ============================================================================
// Patient Identifier Helpers
// ============================================================================

export function getPhilHealthId(patient: Patient): string | undefined {
  return getIdentifier(patient.identifier, PHCORE_IDENTIFIER_SYSTEMS.philHealthId);
}

export function getPddRegistration(patient: Patient): string | undefined {
  return getIdentifier(patient.identifier, PHCORE_IDENTIFIER_SYSTEMS.pddRegistration);
}

// ============================================================================
// Patient Builder
// ============================================================================

export function buildPatientFromFormData(data: PatientFormData): Patient {
  const patient: Patient = {
    resourceType: 'Patient',
    id: uuidv4(),
    meta: {
      profile: [PHCORE_PROFILE_URLS.patient],
      lastUpdated: new Date().toISOString(),
    },
    active: true,
    name: [
      {
        use: 'official',
        family: data.familyName,
        given: [data.givenName, data.middleName].filter(Boolean) as string[],
        suffix: data.suffix ? [data.suffix] : undefined,
      },
    ],
    gender: data.gender,
    birthDate: data.birthDate,
    identifier: [],
    telecom: [],
    address: [],
    extension: [],
  };
  
  // Telecom
  if (data.phone) {
    patient.telecom!.push({ system: 'phone', value: data.phone, use: 'mobile' });
  }
  if (data.email) {
    patient.telecom!.push({ system: 'email', value: data.email });
  }
  
  // Address
  if (data.addressLine || data.barangay || data.cityMunicipality || data.province) {
    patient.address!.push(
      buildPHCoreAddress({
        line: data.addressLine,
        barangay: data.barangay,
        cityMunicipality: data.cityMunicipality,
        province: data.province,
        postalCode: data.postalCode,
        country: data.country || 'PH',
      })
    );
  }
  
  // Marital Status
  if (data.maritalStatus) {
    patient.maritalStatus = {
      coding: [
        {
          system: 'http://hl7.org/fhir/ValueSet/marital-status',
          code: data.maritalStatus,
        },
      ],
    };
  }
  
  // PHCore Identifiers
  if (data.philHealthId) {
    setIdentifier(patient.identifier!, PHCORE_IDENTIFIER_SYSTEMS.philHealthId, data.philHealthId, 'NH');
  }
  if (data.pddRegistration) {
    setIdentifier(patient.identifier!, PHCORE_IDENTIFIER_SYSTEMS.pddRegistration, data.pddRegistration, 'NH');
  }
  
  // PHCore Extensions
  if (data.nationality) {
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.nationality,
      extension: [
        {
          url: 'code',
          valueCodeableConcept: {
            coding: [{ code: data.nationality, display: data.nationality }],
          },
        },
      ],
    });
  }
  
  if (data.religion) {
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.religion,
      valueCodeableConcept: {
        coding: [{ code: data.religion, display: data.religion }],
      },
    });
  }
  
  // Indigenous People (required in PHCore)
  patient.extension!.push({
    url: PHCORE_EXTENSION_URLS.indigenousPeople,
    valueBoolean: data.indigenousPeople ?? false,
  });
  
  if (data.indigenousPeople && data.indigenousGroup) {
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.indigenousGroup,
      valueString: data.indigenousGroup,
    });
  }
  
  if (data.occupation) {
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.occupation,
      valueString: data.occupation,
    });
  }
  
  if (data.educationalAttainment) {
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.educationalAttainment,
      valueString: data.educationalAttainment,
    });
  }
  
  // Race extension (PH Core)
  if (data.race) {
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.race,
      valueCodeableConcept: {
        coding: [{
          code: data.race,
          system: 'http://terminology.hl7.org/CodeSystem/v3-Race',
          display: data.race,
        }],
      },
    });
  }
  
  // Generate narrative text
  patient.text = generatePatientNarrative({
    givenName: data.givenName,
    familyName: data.familyName,
    gender: data.gender,
    birthDate: data.birthDate,
    city: data.cityMunicipality,
    province: data.province,
    country: data.country || 'PH',
  });
  
  return patient;
}

// ============================================================================
// Patient Extractor
// ============================================================================

export function extractPatientFormData(patient: Patient): PatientFormData {
  const name = getPrimaryName(patient.name);
  const address = patient.address?.[0];
  
  return {
    familyName: name?.family || '',
    givenName: name?.given?.[0] || '',
    middleName: name?.given?.[1],
    suffix: name?.suffix?.[0],
    birthDate: patient.birthDate || '',
    gender: patient.gender || 'unknown',
    maritalStatus: patient.maritalStatus?.coding?.[0]?.code,
    phone: getPhone(patient.telecom),
    email: getEmail(patient.telecom),
    addressLine: address?.line?.[0],
    barangay: getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.barangay),
    cityMunicipality: getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.cityMunicipality) || address?.city,
    province: getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.province) || address?.state,
    postalCode: address?.postalCode,
    country: address?.country,
    philHealthId: getPhilHealthId(patient),
    pddRegistration: getPddRegistration(patient),
    nationality: getExtensionValue(
      getExtension(patient.extension, PHCORE_EXTENSION_URLS.nationality)?.extension,
      'code'
    ) as string | undefined,
    religion: getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.religion) as string | undefined,
    indigenousPeople: getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.indigenousPeople) as boolean | undefined,
    indigenousGroup: getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.indigenousGroup) as string | undefined,
    occupation: getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.occupation) as string | undefined,
    educationalAttainment: getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.educationalAttainment) as string | undefined,
  };
}