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
  race?: string;
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

// ============================================================================
// Condition Resource
// ============================================================================

export interface Condition extends DomainResource {
  resourceType: 'Condition';
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetAge?: { value?: number; unit?: string; system?: string; code?: string };
  onsetPeriod?: Period;
  onsetRange?: { low?: { value?: number; unit?: string }; high?: { value?: number; unit?: string } };
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: { value?: number; unit?: string; system?: string; code?: string };
  abatementPeriod?: Period;
  abatementRange?: { low?: { value?: number; unit?: string }; high?: { value?: number; unit?: string } };
  abatementString?: string;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  stage?: {
    summary?: CodeableConcept;
    assessment?: Reference[];
    type?: CodeableConcept;
  }[];
  evidence?: {
    code?: CodeableConcept[];
    detail?: Reference[];
  }[];
  note?: { text: string; authorReference?: Reference; time?: string }[];
}

// ============================================================================
// Observation Resource
// ============================================================================

export interface ObservationComponent {
  code: CodeableConcept;
  valueQuantity?: { value?: number; unit?: string; system?: string; code?: string };
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: { low?: { value?: number; unit?: string }; high?: { value?: number; unit?: string } };
  valueRatio?: { numerator?: { value?: number; unit?: string }; denominator?: { value?: number; unit?: string } };
  valueSampledData?: Record<string, unknown>;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: Period;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  referenceRange?: {
    low?: { value?: number; unit?: string; system?: string; code?: string };
    high?: { value?: number; unit?: string; system?: string; code?: string };
    type?: CodeableConcept;
    appliesTo?: CodeableConcept[];
    age?: { low?: { value?: number; unit?: string }; high?: { value?: number; unit?: string } };
    text?: string;
  }[];
}

export interface Observation extends DomainResource {
  resourceType: 'Observation';
  identifier?: Identifier[];
  basedOn?: Reference[];
  partOf?: Reference[];
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  focus?: Reference[];
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  effectiveTiming?: Record<string, unknown>;
  effectiveInstant?: string;
  issued?: string;
  performer?: Reference[];
  valueQuantity?: { value?: number; unit?: string; system?: string; code?: string };
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: { low?: { value?: number; unit?: string }; high?: { value?: number; unit?: string } };
  valueRatio?: { numerator?: { value?: number; unit?: string }; denominator?: { value?: number; unit?: string } };
  valueSampledData?: Record<string, unknown>;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: Period;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  note?: { text: string; authorReference?: Reference; time?: string }[];
  bodySite?: CodeableConcept;
  method?: CodeableConcept;
  specimen?: Reference;
  device?: Reference;
  referenceRange?: {
    low?: { value?: number; unit?: string; system?: string; code?: string };
    high?: { value?: number; unit?: string; system?: string; code?: string };
    type?: CodeableConcept;
    appliesTo?: CodeableConcept[];
    age?: { low?: { value?: number; unit?: string }; high?: { value?: number; unit?: string } };
    text?: string;
  }[];
  hasMember?: Reference[];
  derivedFrom?: Reference[];
  component?: ObservationComponent[];
}

// ============================================================================
// AllergyIntolerance Resource
// ============================================================================

export interface AllergyIntoleranceReaction {
  substance?: CodeableConcept;
  manifestation: CodeableConcept[];
  description?: string;
  onset?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  exposureRoute?: CodeableConcept;
  note?: { text: string; authorReference?: Reference; time?: string }[];
}

export interface AllergyIntolerance extends DomainResource {
  resourceType: 'AllergyIntolerance';
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  type?: 'allergy' | 'intolerance';
  category?: ('food' | 'medication' | 'environment' | 'biologic')[];
  criticality?: 'low' | 'high' | 'unable-to-assess';
  code?: CodeableConcept;
  patient: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetAge?: { value?: number; unit?: string; system?: string; code?: string };
  onsetPeriod?: Period;
  onsetRange?: { low?: { value?: number; unit?: string }; high?: { value?: number; unit?: string } };
  onsetString?: string;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  lastOccurrence?: string;
  note?: { text: string; authorReference?: Reference; time?: string }[];
  reaction?: AllergyIntoleranceReaction[];
}

// ============================================================================
// Medication Resource
// ============================================================================

export interface MedicationIngredient {
  itemCodeableConcept?: CodeableConcept;
  itemReference?: Reference;
  isActive?: boolean;
  strength?: {
    numerator?: { value?: number; unit?: string; system?: string; code?: string };
    denominator?: { value?: number; unit?: string; system?: string; code?: string };
  };
}

export interface MedicationBatch {
  lotNumber?: string;
  expirationDate?: string;
}

export interface Medication extends DomainResource {
  resourceType: 'Medication';
  identifier?: Identifier[];
  code?: CodeableConcept;
  status?: 'active' | 'inactive' | 'entered-in-error';
  manufacturer?: Reference;
  form?: CodeableConcept;
  amount?: {
    numerator?: { value?: number; unit?: string; system?: string; code?: string };
    denominator?: { value?: number; unit?: string; system?: string; code?: string };
  };
  ingredient?: MedicationIngredient[];
  batch?: MedicationBatch;
}

// ============================================================================
// Immunization Resource
// ============================================================================

export interface ImmunizationPerformer {
  function?: CodeableConcept;
  actor: Reference;
}

export interface ImmunizationProtocolApplied {
  series?: string;
  authority?: Reference;
  targetDisease?: CodeableConcept[];
  doseNumberPositiveInt?: number;
  doseNumberString?: string;
  seriesDosesPositiveInt?: number;
  seriesDosesString?: string;
}

export interface Immunization extends DomainResource {
  resourceType: 'Immunization';
  identifier?: Identifier[];
  status: 'completed' | 'entered-in-error' | 'not-done';
  statusReason?: CodeableConcept;
  vaccineCode: CodeableConcept;
  patient: Reference;
  encounter?: Reference;
  occurrenceDateTime?: string;
  occurrenceString?: string;
  recorded?: string;
  primarySource?: boolean;
  reportOrigin?: CodeableConcept;
  location?: Reference;
  manufacturer?: Reference;
  lotNumber?: string;
  expirationDate?: string;
  site?: CodeableConcept;
  route?: CodeableConcept;
  doseQuantity?: { value?: number; unit?: string; system?: string; code?: string };
  performer?: ImmunizationPerformer[];
  note?: { text: string; authorReference?: Reference; time?: string }[];
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  isSubpotent?: boolean;
  subpotentReason?: CodeableConcept[];
  education?: {
    documentType?: string;
    reference?: string;
    publicationDate?: string;
    presentationDate?: string;
  }[];
  programEligibility?: CodeableConcept[];
  fundingSource?: CodeableConcept;
  reaction?: {
    date?: string;
    detail?: Reference;
    reported?: boolean;
  }[];
  protocolApplied?: ImmunizationProtocolApplied[];
}

// ============================================================================
// Appointment Resource (FHIR R4.0.1)
// ============================================================================

export type AppointmentStatus =
  | 'proposed'
  | 'pending'
  | 'booked'
  | 'arrived'
  | 'fulfilled'
  | 'cancelled'
  | 'noshow'
  | 'entered-in-error'
  | 'checked-in'
  | 'waitlist';

export interface AppointmentParticipant {
  type?: CodeableConcept[];
  actor?: Reference;
  required?: 'required' | 'optional' | 'information-only';
  status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  period?: Period;
}

export interface Appointment extends DomainResource {
  resourceType: 'Appointment';
  identifier?: Identifier[];
  status: AppointmentStatus;
  cancelationReason?: CodeableConcept;
  serviceCategory?: CodeableConcept[];
  serviceType?: CodeableConcept[];
  specialty?: CodeableConcept[];
  appointmentType?: CodeableConcept;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  priority?: number;
  description?: string;
  supportingInformation?: Reference[];
  start?: string;
  end?: string;
  minutesDuration?: number;
  slot?: Reference[];
  created?: string;
  comment?: string;
  patientInstruction?: string;
  basedOn?: Reference[];
  participant: AppointmentParticipant[];
  requestedPeriod?: Period[];
}

// ============================================================================
// Appointment Form Data
// ============================================================================

export interface AppointmentFormData {
  patientId: string;
  practitionerId: string;
  status: AppointmentStatus;
  appointmentTypeCode?: string;
  appointmentTypeDisplay?: string;
  serviceTypeCode?: string;
  serviceTypeDisplay?: string;
  specialtyCode?: string;
  specialtyDisplay?: string;
  reasonText?: string;
  description?: string;
  comment?: string;
  priority?: number;
  start: string;
  end?: string;
  minutesDuration?: number;
  patientInstruction?: string;
}

// ============================================================================
// Resource Type Union
// ============================================================================

export type FHIRResource = Patient | Practitioner | Organization | Encounter | Condition | Observation | AllergyIntolerance | Medication | Immunization | Appointment;
export type FHIRResourceType = 'Patient' | 'Practitioner' | 'Organization' | 'Encounter' | 'Condition' | 'Observation' | 'AllergyIntolerance' | 'Medication' | 'Immunization' | 'Appointment';