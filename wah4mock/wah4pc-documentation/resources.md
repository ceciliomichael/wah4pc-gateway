# FHIR Resources

The WAH4PC Gateway supports 24 FHIR resource types, categorized into Philippine Core (PH Core) and Base R4 (Financial/Administrative & Clinical).

## Supported Resources

### PH Core Resources
- **PH Core Patient** (`resources/patient`) - Patient resource schema with required extensions (indigenousPeople), PH Core Address profile, PhilHealth ID identifiers, and complete JSON template
- **PH Core Encounter** (`resources/encounter`) - Encounter resource schema with status codes, class codes (AMB, IMP), subject reference to PH Core Patient, and participant references
- **PH Core Procedure** (`resources/procedure`) - Procedure resource schema with SNOMED CT codes, subject/encounter references to PH Core profiles, performer details, and body site coding
- **PH Core Immunization** (`resources/immunization`) - Immunization resource schema with CVX vaccine codes, patient/encounter references, dose quantity, lot number, and funding source
- **PH Core Observation** (`resources/observation`) - Observation resource schema with LOINC codes for vital signs/labs, subject/encounter references, component values (e.g., blood pressure systolic/diastolic)
- **PH Core Medication** (`resources/medication`) - Medication resource schema with PH Core drugs ValueSet binding, form codes, ingredient details, and batch information
- **PH Core Location** (`resources/location`) - Location resource schema localized for Philippines with PSGC coding for region, province, city/municipality, and barangay
- **PH Core Organization** (`resources/organization`) - Organization resource schema with DOH National Health Facilities Registry (NHFR) code support and PSGC address extensions
- **PH Core Practitioner** (`resources/practitioner`) - Practitioner resource schema with PRC license identifier support and PH Core address extensions

### Base R4 Resources
- **Account** (`resources/account`) - Financial account for tracking charges for a patient or cost center
- **Claim** (`resources/claim`) - Provider-issued list of services and products for insurance reimbursement (e.g., PhilHealth)
- **ClaimResponse** (`resources/claim-response`) - Adjudication details and payment advice from an insurer in response to a Claim
- **ChargeItem** (`resources/charge-item`) - Itemized record of provided product or service for billing purposes
- **ChargeItemDefinition** (`resources/charge-item-definition`) - Definition of billing codes, prices, and rules for charge items
- **Invoice** (`resources/invoice`) - List of ChargeItems with calculated totals for billing a patient or organization
- **PaymentNotice** (`resources/payment-notice`) - Notification of payment status or clearing details
- **PaymentReconciliation** (`resources/payment-reconciliation`) - Bulk payment details and references to Claims being settled
- **AllergyIntolerance** (`resources/allergy-intolerance`) - Record of patient allergies and adverse reactions to substances
- **Condition** (`resources/condition`) - Clinical condition, diagnosis, problem, or issue that has risen to a level of concern
- **DiagnosticReport** (`resources/diagnostic-report`) - Findings and interpretation of diagnostic tests (lab, imaging, etc.)
- **MedicationAdministration** (`resources/medication-administration`) - Record of a medication actually given to a patient
- **MedicationRequest** (`resources/medication-request`) - Order or prescription for medication to be supplied and instructions for use
- **NutritionOrder** (`resources/nutrition-order`) - Request for diet, formula feeding, or nutritional supplements
- **PractitionerRole** (`resources/practitioner-role`) - Roles, specialties, and services a practitioner performs at an organization

## Common Code Systems

- **SNOMED CT** (`http://snomed.info/sct`): Systematized Nomenclature of Medicine - Clinical Terms for clinical concepts
- **LOINC** (`http://loinc.org`): Logical Observation Identifiers Names and Codes for laboratory and clinical observations
- **CVX** (`http://hl7.org/fhir/sid/cvx`): CDC Vaccine Administered codes for immunizations
- **RxNorm** (`http://www.nlm.nih.gov/research/umls/rxnorm`): Normalized names for clinical drugs
- **PSGC** (`urn://example.com/ph-core/fhir/CodeSystem/PSGC`): Philippine Standard Geographic Code for location references
- **PSOC** (`urn://example.com/ph-core/fhir/CodeSystem/PSOC`): Philippine Standard Occupational Classification
- **PSCED** (`urn://example.com/ph-core/fhir/CodeSystem/PSCED`): Philippine Standard Classification of Education