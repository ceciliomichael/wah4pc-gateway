/**
 * Integration Service - Common Utilities
 * Shared functions for patient matching, formatting, and gateway communication
 */

import { config } from '../config';
import { db } from '../db';
import type { Patient, Identifier as FHIRIdentifier } from '../types/fhir';
import type {
  Identifier,
  GatewayResponse,
  ProviderRegistrationResponse,
} from '../types/integration';
import { isPhilHealthIdentifier, isMrnIdentifier } from '../types/integration';

// ============================================================================
// Patient Matching Logic
// ============================================================================

/**
 * Find a patient by any of the provided identifiers
 * Matches on PhilHealth ID, MRN, or other identifier systems
 */
export async function findPatientByIdentifiers(
  identifiers: Identifier[]
): Promise<Patient | null> {
  const patients = await db.getAll<Patient>('Patient');

  for (const patient of patients) {
    if (!patient.identifier) continue;

    for (const searchId of identifiers) {
      for (const patientId of patient.identifier) {
        // Match by system and value
        if (
          patientId.system?.toLowerCase() === searchId.system.toLowerCase() &&
          patientId.value === searchId.value
        ) {
          return patient;
        }

        // Flexible matching for PhilHealth IDs
        if (
          isPhilHealthIdentifier(searchId.system) &&
          isPhilHealthIdentifier(patientId.system || '') &&
          patientId.value === searchId.value
        ) {
          return patient;
        }

        // Flexible matching for MRNs
        if (
          isMrnIdentifier(searchId.system) &&
          isMrnIdentifier(patientId.system || '') &&
          patientId.value === searchId.value
        ) {
          return patient;
        }
      }
    }
  }

  return null;
}

/**
 * Find a patient by FHIR-style identifiers (from received data)
 */
export async function findPatientByFHIRIdentifiers(
  identifiers: FHIRIdentifier[]
): Promise<Patient | null> {
  // Convert FHIR identifiers to integration identifiers
  const integrationIdentifiers: Identifier[] = identifiers
    .filter((id): id is FHIRIdentifier & { system: string; value: string } => 
      Boolean(id.system && id.value)
    )
    .map((id) => ({
      system: id.system,
      value: id.value,
    }));

  if (integrationIdentifiers.length === 0) {
    return null;
  }

  return findPatientByIdentifiers(integrationIdentifiers);
}

// ============================================================================
// Data Formatting
// ============================================================================

/**
 * Convert internal Patient to FHIR-compliant format for gateway response
 * Returns the FULL Patient resource as per PH Core documentation requirements
 * including all extensions, meta, text narrative, and other fields
 */
export function formatPatientForGateway(
  patient: Patient,
  _matchedIdentifiers: Identifier[]
): Record<string, unknown> {
  // Return the complete Patient resource to comply with PH Core format
  // The wah4pc documentation requires the full resource including:
  // - meta with profile
  // - text narrative
  // - all extensions (nationality, religion, indigenousPeople, indigenousGroup, race, etc.)
  // - full address with PSGC extensions
  // - all identifiers
  return {
    resourceType: patient.resourceType,
    id: patient.id,
    meta: patient.meta,
    text: patient.text,
    identifier: patient.identifier,
    active: patient.active,
    name: patient.name,
    telecom: patient.telecom,
    gender: patient.gender,
    birthDate: patient.birthDate,
    deceasedBoolean: patient.deceasedBoolean,
    deceasedDateTime: patient.deceasedDateTime,
    address: patient.address,
    maritalStatus: patient.maritalStatus,
    multipleBirthBoolean: patient.multipleBirthBoolean,
    multipleBirthInteger: patient.multipleBirthInteger,
    photo: patient.photo,
    contact: patient.contact,
    communication: patient.communication,
    generalPractitioner: patient.generalPractitioner,
    managingOrganization: patient.managingOrganization,
    link: patient.link,
    extension: patient.extension,
  };
}

// ============================================================================
// Gateway Communication
// ============================================================================

/**
 * Send a response back to the gateway's return URL
 */
export async function sendToGateway(
  returnUrl: string,
  payload: GatewayResponse
): Promise<void> {
  const { providerId, apiKey } = config.integration;

  const response = await fetch(returnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Provider-ID': providerId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gateway callback failed: ${response.status} - ${errorText}`);
  }
}

/**
 * Register this provider with the gateway
 */
export async function registerProvider(): Promise<ProviderRegistrationResponse> {
  const { gatewayUrl, providerBaseUrl, providerName, providerType } = config.integration;

  console.log(`[Integration] Registering provider with gateway at ${gatewayUrl}`);

  const response = await fetch(`${gatewayUrl}/api/v1/providers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: providerName,
      type: providerType,
      baseUrl: providerBaseUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Integration] Registration failed: ${response.status} - ${errorText}`);
    throw new Error(`Registration failed: ${response.status} - ${errorText}`);
  }

  const result = (await response.json()) as ProviderRegistrationResponse;

  console.log(`[Integration] Successfully registered with ID: ${result.id}`);
  console.log(`[Integration] IMPORTANT: Update your .env with:`);
  console.log(`  WAH4PC_PROVIDER_ID=${result.id}`);

  return result;
}