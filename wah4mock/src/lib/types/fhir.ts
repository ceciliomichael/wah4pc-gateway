/**
 * FHIR R4 Type Definitions - PHCore Compliant
 * Based on Philippine Core (PHCore) StructureDefinitions
 */

// ============================================================================
// Base FHIR Types
// ============================================================================

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Reference {
  reference?: string;
  type?: string;
  identifier?: Identifier;
  display?: string;
}

export interface Extension {
  url: string;
  valueString?: string;
  valueCode?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueDecimal?: number;
  valueDateTime?: string;
  valueDate?: string;
  valueCoding?: Coding;
  valueCodeableConcept?: CodeableConcept;
  valueReference?: Reference;
  valueAddress?: Address;
  extension?: Extension[];
}

export interface Identifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
  assigner?: Reference;
}

export interface HumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: Period;
}

export interface ContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
  period?: Period;
}

export interface Address {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: Period;
  extension?: Extension[];
}

export interface Attachment {
  contentType?: string;
  language?: string;
  data?: string;
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

export interface Narrative {
  status: 'generated' | 'extensions' | 'additional' | 'empty';
  div: string;
}

export interface Meta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  security?: Coding[];
  tag?: Coding[];
}

// ============================================================================
// Base Resource
// ============================================================================

export interface Resource {
  resourceType: string;
  id?: string;
  meta?: Meta;
  implicitRules?: string;
  language?: string;
}

export interface DomainResource extends Resource {
  text?: Narrative;
  contained?: Resource[];
  extension?: Extension[];
  modifierExtension?: Extension[];
}

// ============================================================================
// PHCore Extension URLs
// ============================================================================

export const PHCORE_EXTENSION_URLS = {
  nationality: 'http://hl7.org/fhir/StructureDefinition/patient-nationality',
  religion: 'http://hl7.org/fhir/StructureDefinition/patient-religion',
  indigenousGroup: 'urn://example.com/ph-core/fhir/StructureDefinition/indigenous-group',
  indigenousPeople: 'urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people',
  occupation: 'urn://example.com/ph-core/fhir/StructureDefinition/occupation',
  race: 'urn://example.com/ph-core/fhir/StructureDefinition/race',
  educationalAttainment: 'urn://example.com/ph-core/fhir/StructureDefinition/educational-attainment',
  province: 'urn://example.com/ph-core/fhir/StructureDefinition/province',
  cityMunicipality: 'urn://example.com/ph-core/fhir/StructureDefinition/city-municipality',
  barangay: 'urn://example.com/ph-core/fhir/StructureDefinition/barangay',
} as const;

export const PHCORE_IDENTIFIER_SYSTEMS = {
  philHealthId: 'http://philhealth.gov.ph/fhir/Identifier/philhealth-id',
  pddRegistration: 'http://doh.gov.ph/fhir/Identifier/pdd-registration',
  dohNhfrCode: 'http://doh.gov.ph/fhir/Identifier/doh-nhfr-code',
  philSysId: 'http://psa.gov.ph/fhir/Identifier/philsys-id',
} as const;

export const PHCORE_PROFILE_URLS = {
  patient: 'urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient',
  practitioner: 'urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner',
  organization: 'urn://example.com/ph-core/fhir/StructureDefinition/ph-core-organization',
  encounter: 'urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter',
  address: 'urn://example.com/ph-core/fhir/StructureDefinition/ph-core-address',
} as const;

// ============================================================================
// PHCore Patient
// ============================================================================

export interface PatientContact {
  relationship?: CodeableConcept[];
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  organization?: Reference;
  period?: Period;
}

export interface PatientCommunication {
  language: CodeableConcept;
  preferred?: boolean;
}

export interface PatientLink {
  other: Reference;
  type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
}

export interface Patient extends DomainResource {
  resourceType: 'Patient';
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Address[];
  maritalStatus?: CodeableConcept;
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  photo?: Attachment[];
  contact?: PatientContact[];
  communication?: PatientCommunication[];
  generalPractitioner?: Reference[];
  managingOrganization?: Reference;
  link?: PatientLink[];
}

// ============================================================================
// PHCore Practitioner
// ============================================================================

export interface PractitionerQualification {
  identifier?: Identifier[];
  code: CodeableConcept;
  period?: Period;
  issuer?: Reference;
}

export interface Practitioner extends DomainResource {
  resourceType: 'Practitioner';
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  address?: Address[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  photo?: Attachment[];
  qualification?: PractitionerQualification[];
  communication?: CodeableConcept[];
}

// ============================================================================
// PHCore Organization
// ============================================================================

export interface OrganizationContact {
  purpose?: CodeableConcept;
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
}

export interface Organization extends DomainResource {
  resourceType: 'Organization';
  identifier?: Identifier[];
  active?: boolean;
  type?: CodeableConcept[];
  name?: string;
  alias?: string[];
  telecom?: ContactPoint[];
  address?: Address[];
  partOf?: Reference;
  contact?: OrganizationContact[];
  endpoint?: Reference[];
}

// ============================================================================
// PHCore Encounter
// ============================================================================

export interface EncounterStatusHistory {
  status: EncounterStatus;
  period: Period;
}

export interface EncounterClassHistory {
  class: Coding;
  period: Period;
}

export interface EncounterParticipant {
  type?: CodeableConcept[];
  period?: Period;
  individual?: Reference;
}

export interface EncounterDiagnosis {
  condition: Reference;
  use?: CodeableConcept;
  rank?: number;
}

export interface EncounterHospitalization {
  preAdmissionIdentifier?: Identifier;
  origin?: Reference;
  admitSource?: CodeableConcept;
  reAdmission?: CodeableConcept;
  dietPreference?: CodeableConcept[];
  specialCourtesy?: CodeableConcept[];
  specialArrangement?: CodeableConcept[];
  destination?: Reference;
  dischargeDisposition?: CodeableConcept;
}

export interface EncounterLocation {
  location: Reference;
  status?: 'planned' | 'active' | 'reserved' | 'completed';
  physicalType?: CodeableConcept;
  period?: Period;
}

export type EncounterStatus = 
  | 'planned'
  | 'arrived'
  | 'triaged'
  | 'in-progress'
  | 'onleave'
  | 'finished'
  | 'cancelled'
  | 'entered-in-error'
  | 'unknown';

export interface Encounter extends DomainResource {
  resourceType: 'Encounter';
  identifier?: Identifier[];
  status: EncounterStatus;
  statusHistory?: EncounterStatusHistory[];
  class: Coding;
  classHistory?: EncounterClassHistory[];
  type?: CodeableConcept[];
  serviceType?: CodeableConcept;
  priority?: CodeableConcept;
  subject?: Reference;
  episodeOfCare?: Reference[];
  basedOn?: Reference[];
  participant?: EncounterParticipant[];
  appointment?: Reference[];
  period?: Period;
  length?: {
    value?: number;
    comparator?: '<' | '<=' | '>=' | '>';
    unit?: string;
    system?: string;
    code?: string;
  };
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  diagnosis?: EncounterDiagnosis[];
  account?: Reference[];
  hospitalization?: EncounterHospitalization;
  location?: EncounterLocation[];
  serviceProvider?: Reference;
  partOf?: Reference;
}

// ============================================================================
// FHIR Bundle (for potential batch operations)
// ============================================================================

export interface BundleLink {
  relation: string;
  url: string;
}

export interface BundleEntrySearch {
  mode?: 'match' | 'include' | 'outcome';
  score?: number;
}

export interface BundleEntryRequest {
  method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  ifNoneMatch?: string;
  ifModifiedSince?: string;
  ifMatch?: string;
  ifNoneExist?: string;
}

export interface BundleEntryResponse {
  status: string;
  location?: string;
  etag?: string;
  lastModified?: string;
  outcome?: Resource;
}

export interface BundleEntry<T extends Resource = Resource> {
  link?: BundleLink[];
  fullUrl?: string;
  resource?: T;
  search?: BundleEntrySearch;
  request?: BundleEntryRequest;
  response?: BundleEntryResponse;
}

export interface Bundle<T extends Resource = Resource> extends Resource {
  resourceType: 'Bundle';
  identifier?: Identifier;
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  timestamp?: string;
  total?: number;
  link?: BundleLink[];
  entry?: BundleEntry<T>[];
  signature?: {
    type: Coding[];
    when: string;
    who: Reference;
    onBehalfOf?: Reference;
    targetFormat?: string;
    sigFormat?: string;
    data?: string;
  };
}

// ============================================================================
// Helper Types for Form Data
// ============================================================================

export interface PatientFormData {
  // Basic Info
  familyName: string;
  givenName: string;
  middleName?: string;
  suffix?: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  maritalStatus?: string;
  
  // Contact
  phone?: string;
  email?: string;
  
  // Address (PHCore)
  addressLine?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  
  // PHCore Identifiers
  philHealthId?: string;
  pddRegistration?: string;
  
  // PHCore Extensions
  nationality?: string;
  religion?: string;
  indigenousPeople?: boolean;
  indigenousGroup?: string;
  occupation?: string;
  educationalAttainment?: string;
}

export interface PractitionerFormData {
  familyName: string;
  givenName: string;
  middleName?: string;
  suffix?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  phone?: string;
  email?: string;
  licenseNumber?: string;
  specialty?: string;
  addressLine?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  postalCode?: string;
}

export interface EncounterFormData {
  patientId: string;
  practitionerId: string;
  status: EncounterStatus;
  classCode: string;
  classDisplay: string;
  typeCode?: string;
  typeDisplay?: string;
  reasonText?: string;
  startDate: string;
  endDate?: string;
}

export interface OrganizationFormData {
  name: string;
  alias?: string;
  nhfrCode?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

// ============================================================================
// Resource Type Union
// ============================================================================

export type FHIRResource = Patient | Practitioner | Organization | Encounter;
export type FHIRResourceType = 'Patient' | 'Practitioner' | 'Organization' | 'Encounter';