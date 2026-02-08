/**
 * Standard FHIR and PH Core Terminology Codes
 */

export interface CodingOption {
  code: string;
  display: string;
  system?: string;
}

// ============================================================================
// Occupational Classifications (PSOC)
// urn://example.com/ph-core/fhir/CodeSystem/PSOC
// ============================================================================
export const OCCUPATIONS: CodingOption[] = [
  { code: '1', display: 'Managers' },
  { code: '2', display: 'Professionals' },
  { code: '22', display: 'Health Professionals' },
  { code: '221', display: 'Medical Doctors' },
  { code: '222', display: 'Nursing and Midwifery Professionals' },
  { code: '3', display: 'Technicians and Associate Professionals' },
  { code: '4', display: 'Clerical Support Workers' },
  { code: '5', display: 'Service and Sales Workers' },
  { code: '6', display: 'Skilled Agricultural, Forestry and Fishery Workers' },
  { code: '7', display: 'Craft and Related Trades Workers' },
  { code: '8', display: 'Plant and Machine Operators and Assemblers' },
  { code: '9', display: 'Elementary Occupations' },
  { code: '0', display: 'Armed Forces Occupations' },
];

// ============================================================================
// Educational Attainment
// urn://example.com/ph-core/fhir/CodeSystem/educational-attainment
// ============================================================================
export const EDUCATIONAL_ATTAINMENT: CodingOption[] = [
  { code: '0', display: 'No Grade Completed' },
  { code: '1', display: 'Preschool' },
  { code: '2', display: 'Elementary' },
  { code: '3', display: 'High School (Old Curriculum)' },
  { code: '4', display: 'Junior High School (K-12)' },
  { code: '5', display: 'Senior High School (K-12)' },
  { code: '6', display: 'Post-Secondary Non-Tertiary' },
  { code: '7', display: 'College Undergraduate' },
  { code: '8', display: 'Academic Degree Holder' },
  { code: '9', display: 'Post-Baccalaureate' },
];

// ============================================================================
// Religious Affiliation
// http://terminology.hl7.org/ValueSet/v3-ReligiousAffiliation
// ============================================================================
export const RELIGIONS: CodingOption[] = [
  { code: '1013', display: 'Roman Catholic Church' },
  { code: '1020', display: 'Iglesia ni Cristo' },
  { code: '1023', display: 'Islam' },
  { code: '1014', display: 'Seventh Day Adventist' },
  { code: '1011', display: 'Born Again Christian' },
  { code: '1006', display: 'Baptist' },
  { code: '1027', display: 'Jehovah\'s Witness' },
  { code: '0000', display: 'None / Atheist' },
];

// ============================================================================
// Race
// http://terminology.hl7.org/CodeSystem/v3-Race
// ============================================================================
export const RACES: CodingOption[] = [
  { code: '2106-3', display: 'White' },
  { code: '2028-9', display: 'Asian' },
  { code: '2135-2', display: 'Hispanic or Latino' },
  { code: '1002-5', display: 'American Indian or Alaska Native' },
  { code: '2054-5', display: 'Black or African American' },
  { code: '2076-8', display: 'Native Hawaiian or Other Pacific Islander' },
  { code: '2131-1', display: 'Other Race' },
];