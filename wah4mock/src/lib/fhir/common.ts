/**
 * FHIR Common Helper Functions
 * Shared utilities for extensions, identifiers, names, contacts, and addresses
 */

import type {
  Extension,
  Identifier,
  Address,
  HumanName,
  ContactPoint,
  Coding,
  Patient,
  Practitioner,
} from '../types/fhir';
import {
  PHCORE_EXTENSION_URLS,
  PHCORE_IDENTIFIER_SYSTEMS,
} from '../types/fhir';

// Re-export constants for convenience
export { PHCORE_EXTENSION_URLS, PHCORE_IDENTIFIER_SYSTEMS };

// ============================================================================
// Extension Helpers
// ============================================================================

export function getExtension(
  extensions: Extension[] | undefined,
  url: string
): Extension | undefined {
  return extensions?.find((ext) => ext.url === url);
}

export function getExtensionValue(
  extensions: Extension[] | undefined,
  url: string
): string | boolean | number | undefined {
  const ext = getExtension(extensions, url);
  if (!ext) return undefined;
  
  return (
    ext.valueString ??
    ext.valueCode ??
    ext.valueBoolean ??
    ext.valueInteger ??
    ext.valueDecimal ??
    ext.valueDateTime ??
    ext.valueDate ??
    ext.valueCoding?.display ??
    ext.valueCoding?.code ??
    ext.valueCodeableConcept?.text ??
    ext.valueCodeableConcept?.coding?.[0]?.display
  );
}

export function setExtension(
  extensions: Extension[],
  url: string,
  value: string | boolean | number,
  valueType: 'string' | 'code' | 'boolean' | 'integer' | 'decimal' = 'string'
): Extension[] {
  const existingIndex = extensions.findIndex((ext) => ext.url === url);
  const newExt: Extension = { url };
  
  switch (valueType) {
    case 'string':
      newExt.valueString = String(value);
      break;
    case 'code':
      newExt.valueCode = String(value);
      break;
    case 'boolean':
      newExt.valueBoolean = Boolean(value);
      break;
    case 'integer':
      newExt.valueInteger = Number(value);
      break;
    case 'decimal':
      newExt.valueDecimal = Number(value);
      break;
  }
  
  if (existingIndex >= 0) {
    extensions[existingIndex] = newExt;
  } else {
    extensions.push(newExt);
  }
  
  return extensions;
}

export function setCodingExtension(
  extensions: Extension[],
  url: string,
  coding: Coding
): Extension[] {
  const existingIndex = extensions.findIndex((ext) => ext.url === url);
  const newExt: Extension = { url, valueCoding: coding };
  
  if (existingIndex >= 0) {
    extensions[existingIndex] = newExt;
  } else {
    extensions.push(newExt);
  }
  
  return extensions;
}

// ============================================================================
// Identifier Helpers
// ============================================================================

export function getIdentifier(
  identifiers: Identifier[] | undefined,
  system: string
): string | undefined {
  return identifiers?.find((id) => id.system === system)?.value;
}

export function setIdentifier(
  identifiers: Identifier[],
  system: string,
  value: string,
  typeCode?: string
): Identifier[] {
  const existingIndex = identifiers.findIndex((id) => id.system === system);
  const newId: Identifier = {
    system,
    value,
    use: 'official',
  };
  
  if (typeCode) {
    newId.type = {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: typeCode,
        },
      ],
    };
  }
  
  if (existingIndex >= 0) {
    identifiers[existingIndex] = newId;
  } else {
    identifiers.push(newId);
  }
  
  return identifiers;
}

// ============================================================================
// Name Helpers
// ============================================================================

export function formatHumanName(name: HumanName | undefined): string {
  if (!name) return '';
  
  const parts: string[] = [];
  
  if (name.prefix?.length) {
    parts.push(name.prefix.join(' '));
  }
  
  if (name.given?.length) {
    parts.push(name.given.join(' '));
  }
  
  if (name.family) {
    parts.push(name.family);
  }
  
  if (name.suffix?.length) {
    parts.push(name.suffix.join(' '));
  }
  
  return name.text || parts.join(' ').trim();
}

export function getPrimaryName(names: HumanName[] | undefined): HumanName | undefined {
  if (!names?.length) return undefined;
  return names.find((n) => n.use === 'official') || names[0];
}

export function getDisplayName(resource: Patient | Practitioner): string {
  const name = getPrimaryName(resource.name);
  return formatHumanName(name) || 'Unknown';
}

// ============================================================================
// Contact Helpers
// ============================================================================

export function getPhone(telecom: ContactPoint[] | undefined): string | undefined {
  return telecom?.find((t) => t.system === 'phone')?.value;
}

export function getEmail(telecom: ContactPoint[] | undefined): string | undefined {
  return telecom?.find((t) => t.system === 'email')?.value;
}

// ============================================================================
// Address Helpers (PHCore)
// ============================================================================

export function getAddressExtensionValue(
  address: Address | undefined,
  extensionUrl: string
): string | undefined {
  const ext = getExtension(address?.extension, extensionUrl);
  return ext?.valueString ?? ext?.valueCoding?.display ?? ext?.valueCoding?.code;
}

export function formatAddress(address: Address | undefined): string {
  if (!address) return '';
  
  const parts: string[] = [];
  
  if (address.line?.length) {
    parts.push(address.line.join(', '));
  }
  
  const barangay = getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.barangay);
  if (barangay) parts.push(`Brgy. ${barangay}`);
  
  const city = getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.cityMunicipality) || address.city;
  if (city) parts.push(city);
  
  const province = getAddressExtensionValue(address, PHCORE_EXTENSION_URLS.province) || address.state;
  if (province) parts.push(province);
  
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
}

export function buildPHCoreAddress(data: {
  line?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}): Address {
  const address: Address = {
    use: 'home',
    type: 'physical',
    extension: [],
  };
  
  if (data.line) {
    address.line = [data.line];
  }
  
  if (data.postalCode) {
    address.postalCode = data.postalCode;
  }
  
  if (data.country) {
    address.country = data.country;
  }
  
  // PHCore extensions
  if (data.barangay) {
    address.extension!.push({
      url: PHCORE_EXTENSION_URLS.barangay,
      valueString: data.barangay,
    });
  }
  
  if (data.cityMunicipality) {
    address.extension!.push({
      url: PHCORE_EXTENSION_URLS.cityMunicipality,
      valueString: data.cityMunicipality,
    });
    address.city = data.cityMunicipality;
  }
  
  if (data.province) {
    address.extension!.push({
      url: PHCORE_EXTENSION_URLS.province,
      valueString: data.province,
    });
    address.state = data.province;
  }
  
  return address;
}