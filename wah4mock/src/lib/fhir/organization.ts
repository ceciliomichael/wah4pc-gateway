/**
 * FHIR Organization Helper Functions
 * Utilities for building and extracting Organization resources
 */

import type { Organization, OrganizationFormData } from '../types/fhir';
import { PHCORE_IDENTIFIER_SYSTEMS, PHCORE_PROFILE_URLS } from '../types/fhir';
import { v4 as uuidv4 } from 'uuid';
import {
  getIdentifier,
  getPhone,
  getEmail,
  getAddressExtensionValue,
  buildPHCoreAddress,
  PHCORE_EXTENSION_URLS,
} from './common';

// ============================================================================
// Organization Identifier Helpers
// ============================================================================

export function getNhfrCode(org: Organization): string | undefined {
  return getIdentifier(org.identifier, PHCORE_IDENTIFIER_SYSTEMS.dohNhfrCode);
}

// ============================================================================
// Organization Builder
// ============================================================================

export function buildOrganizationFromFormData(data: OrganizationFormData): Organization {
  const organization: Organization = {
    resourceType: 'Organization',
    id: uuidv4(),
    meta: {
      profile: [PHCORE_PROFILE_URLS.organization],
      lastUpdated: new Date().toISOString(),
    },
    active: true,
    name: data.name,
    identifier: [],
    telecom: [],
    address: [],
  };
  
  if (data.alias) {
    organization.alias = [data.alias];
  }
  
  if (data.nhfrCode) {
    organization.identifier!.push({
      use: 'official',
      system: PHCORE_IDENTIFIER_SYSTEMS.dohNhfrCode,
      value: data.nhfrCode,
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'FI',
          },
        ],
      },
    });
  }
  
  if (data.phone) {
    organization.telecom!.push({ system: 'phone', value: data.phone, use: 'work' });
  }
  if (data.email) {
    organization.telecom!.push({ system: 'email', value: data.email, use: 'work' });
  }
  
  if (data.addressLine || data.barangay || data.cityMunicipality || data.province) {
    organization.address!.push(
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
  
  return organization;
}

// ============================================================================
// Organization Extractor
// ============================================================================

export function extractOrganizationFormData(org: Organization): OrganizationFormData {
  const address = org.address?.[0];
  
  return {
    name: org.name || '',
    alias: org.alias?.[0],
    nhfrCode: getNhfrCode(org),
    phone: getPhone(org.telecom),
    email: getEmail(org.telecom),
    addressLine: address?.line?.[0],
    barangay: getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.barangay),
    cityMunicipality: getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.cityMunicipality) || address?.city,
    province: getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.province) || address?.state,
    postalCode: address?.postalCode,
    country: address?.country,
  };
}