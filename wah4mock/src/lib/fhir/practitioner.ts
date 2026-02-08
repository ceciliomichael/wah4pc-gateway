/**
 * FHIR Practitioner Helper Functions
 * Utilities for building and extracting Practitioner resources
 */

import type { Practitioner, PractitionerFormData } from '../types/fhir';
import { PHCORE_EXTENSION_URLS, PHCORE_PROFILE_URLS } from '../types/fhir';
import { v4 as uuidv4 } from 'uuid';
import {
  getPrimaryName,
  getPhone,
  getEmail,
  getAddressExtensionValue,
  buildPHCoreAddress,
  generatePractitionerNarrative,
} from './common';

// ============================================================================
// Practitioner Builder
// ============================================================================

export function buildPractitionerFromFormData(data: PractitionerFormData): Practitioner {
  const practitioner: Practitioner = {
    resourceType: 'Practitioner',
    id: uuidv4(),
    meta: {
      profile: [PHCORE_PROFILE_URLS.practitioner],
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
    identifier: [],
    telecom: [],
    address: [],
  };
  
  if (data.gender) {
    practitioner.gender = data.gender;
  }
  
  if (data.birthDate) {
    practitioner.birthDate = data.birthDate;
  }
  
  if (data.phone) {
    practitioner.telecom!.push({ system: 'phone', value: data.phone, use: 'work' });
  }
  if (data.email) {
    practitioner.telecom!.push({ system: 'email', value: data.email, use: 'work' });
  }
  
  if (data.licenseNumber) {
    practitioner.identifier!.push({
      system: 'http://prc.gov.ph/fhir/Identifier/license',
      value: data.licenseNumber,
      use: 'official',
    });
  }
  
  if (data.specialty) {
    practitioner.qualification = [
      {
        code: {
          coding: [{ display: data.specialty }],
          text: data.specialty,
        },
      },
    ];
  }
  
  if (data.addressLine || data.barangay || data.cityMunicipality || data.province) {
    practitioner.address!.push(
      buildPHCoreAddress({
        line: data.addressLine,
        barangay: data.barangay,
        cityMunicipality: data.cityMunicipality,
        province: data.province,
        postalCode: data.postalCode,
      })
    );
  }
  
  // Generate narrative text
  practitioner.text = generatePractitionerNarrative({
    givenName: data.givenName,
    familyName: data.familyName,
    gender: data.gender,
    birthDate: data.birthDate,
    phone: data.phone,
    email: data.email,
    city: data.cityMunicipality,
    province: data.province,
  });
  
  return practitioner;
}

// ============================================================================
// Practitioner Extractor
// ============================================================================

export function extractPractitionerFormData(practitioner: Practitioner): PractitionerFormData {
  const name = getPrimaryName(practitioner.name);
  const address = practitioner.address?.[0];
  const license = practitioner.identifier?.find((id) => id.system?.includes('license'));
  
  return {
    familyName: name?.family || '',
    givenName: name?.given?.[0] || '',
    middleName: name?.given?.[1],
    suffix: name?.suffix?.[0],
    birthDate: practitioner.birthDate,
    gender: practitioner.gender,
    phone: getPhone(practitioner.telecom),
    email: getEmail(practitioner.telecom),
    licenseNumber: license?.value,
    specialty: practitioner.qualification?.[0]?.code?.text,
    addressLine: address?.line?.[0],
    barangay: getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.barangay),
    cityMunicipality: getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.cityMunicipality) || address?.city,
    province: getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.province) || address?.state,
    postalCode: address?.postalCode,
  };
}