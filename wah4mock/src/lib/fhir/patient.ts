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
  getAddressExtensionCode,
  buildPHCoreAddress,
  generatePatientNarrative,
} from './common';
import { OCCUPATIONS, EDUCATIONAL_ATTAINMENT, RELIGIONS } from '../terminologies';

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
    const religion = RELIGIONS.find(r => r.code === data.religion);
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.religion,
      valueCodeableConcept: {
        coding: [{ 
          system: 'http://terminology.hl7.org/ValueSet/v3-ReligiousAffiliation',
          code: data.religion, 
          display: religion?.display || data.religion 
        }],
      },
    });
  }
  
  // Indigenous People (required in PHCore)
  patient.extension!.push({
    url: PHCORE_EXTENSION_URLS.indigenousPeople,
    valueBoolean: data.indigenousPeople ?? false,
  });
  
  if (data.indigenousPeople && data.indigenousGroup) {
    // Note: Indigenous group might need a CodeSystem in the future, currently string/code
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.indigenousGroup,
      valueCodeableConcept: {
        coding: [{
          system: 'urn://example.com/ph-core/fhir/CodeSystem/indigenous-groups',
          code: data.indigenousGroup,
          display: data.indigenousGroup // Mock display
        }]
      }
    });
  }
  
  if (data.occupation) {
    const occupation = OCCUPATIONS.find(o => o.code === data.occupation);
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.occupation,
      valueCodeableConcept: {
        coding: [{
          system: 'urn://example.com/ph-core/fhir/CodeSystem/PSOC',
          code: data.occupation,
          display: occupation?.display || data.occupation
        }]
      }
    });
  }
  
  if (data.educationalAttainment) {
    const education = EDUCATIONAL_ATTAINMENT.find(e => e.code === data.educationalAttainment);
    patient.extension!.push({
      url: PHCORE_EXTENSION_URLS.educationalAttainment,
      valueCodeableConcept: {
        coding: [{
          system: 'urn://example.com/ph-core/fhir/CodeSystem/educational-attainment',
          code: data.educationalAttainment,
          display: education?.display || data.educationalAttainment
        }]
      }
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
    barangay: getAddressExtensionCode(address, PHCORE_EXTENSION_URLS.barangay) || getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.barangay),
    cityMunicipality: getAddressExtensionCode(address, PHCORE_EXTENSION_URLS.cityMunicipality) || address?.city,
    province: getAddressExtensionCode(address, PHCORE_EXTENSION_URLS.province) || address?.state,
    postalCode: address?.postalCode,
    country: address?.country,
    philHealthId: getPhilHealthId(patient),
    pddRegistration: getPddRegistration(patient),
    nationality: getExtensionValue(
      getExtension(patient.extension, PHCORE_EXTENSION_URLS.nationality)?.extension,
      'code'
    ) as string | undefined,
    religion: (getExtension(patient.extension, PHCORE_EXTENSION_URLS.religion)?.valueCodeableConcept?.coding?.[0]?.code) || 
              (getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.religion) as string | undefined),
    indigenousPeople: getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.indigenousPeople) as boolean | undefined,
    indigenousGroup: (getExtension(patient.extension, PHCORE_EXTENSION_URLS.indigenousGroup)?.valueCodeableConcept?.coding?.[0]?.code) ||
                     (getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.indigenousGroup) as string | undefined),
    occupation: (getExtension(patient.extension, PHCORE_EXTENSION_URLS.occupation)?.valueCodeableConcept?.coding?.[0]?.code) ||
                (getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.occupation) as string | undefined),
    educationalAttainment: (getExtension(patient.extension, PHCORE_EXTENSION_URLS.educationalAttainment)?.valueCodeableConcept?.coding?.[0]?.code) ||
                           (getExtensionValue(patient.extension, PHCORE_EXTENSION_URLS.educationalAttainment) as string | undefined),
  };
}