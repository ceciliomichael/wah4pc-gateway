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
// Codes must match CodeSystem-educational-attainment.json
// ============================================================================
export const EDUCATIONAL_ATTAINMENT: CodingOption[] = [
  { code: 'no-grade', display: 'No Grade Completed' },
  { code: 'elementary-undergraduate', display: 'Elementary Undergraduate' },
  { code: 'elementary-graduate', display: 'Elementary Graduate' },
  { code: 'highschool-undergraduate', display: 'High School Undergraduate' },
  { code: 'highschool-graduate', display: 'High School Graduate' },
  { code: 'vocational', display: 'Vocational/Technical' },
  { code: 'college-undergraduate', display: 'College Undergraduate' },
  { code: 'college-graduate', display: 'College Graduate' },
  { code: 'postgraduate', display: 'Post Graduate' },
  { code: 'masters', display: "Master's Degree" },
  { code: 'doctoral', display: 'Doctoral Degree' },
  { code: 'other', display: 'Other' },
];

// ============================================================================
// Religious Affiliation
// http://terminology.hl7.org/CodeSystem/v3-ReligiousAffiliation
// Display values must match CodeSystem-religion.json
// ============================================================================
export const RELIGIONS: CodingOption[] = [
  { code: '1013', display: 'Roman Catholic' },
  { code: '1020', display: 'Iglesia ni Cristo' },
  { code: '1023', display: 'Islam' },
  { code: '1014', display: 'Seventh Day Adventist' },
  { code: '1011', display: 'Born Again Christian' },
  { code: '1006', display: 'Baptist' },
  { code: '1027', display: 'Jehovah\'s Witness' },
  { code: '1036', display: 'Methodist' },
  { code: '1003', display: 'Aglipayan' },
  { code: '1019', display: 'Evangelical' },
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