package schemabuilder

import "testing"

func TestBuildSuccessBundle_Remaining17Resources(t *testing.T) {
	tests := []struct {
		name          string
		resourceType  string
		inputResource string
		requiredKeys  []string
	}{
		{
			name:          "location",
			resourceType:  "Location",
			inputResource: `{"locationName":"Main Clinic","identifierSystem":"http://example.org/location","identifierValue":"LOC-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "name"},
		},
		{
			name:          "organization",
			resourceType:  "Organization",
			inputResource: `{"organizationName":"Gateway Hospital","identifierSystem":"http://example.org/org","identifierValue":"ORG-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "name"},
		},
		{
			name:          "account",
			resourceType:  "Account",
			inputResource: `{"accountStatus":"active","patientReference":"Patient/p-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "status"},
		},
		{
			name:          "claim",
			resourceType:  "Claim",
			inputResource: `{"claimStatus":"active","claimUse":"claim","createdDate":"2026-02-17","patientReference":"Patient/p-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "status", "use", "created", "patient"},
		},
		{
			name:          "claim_response",
			resourceType:  "ClaimResponse",
			inputResource: `{"claimResponseStatus":"active","claimResponseUse":"claim","createdDate":"2026-02-17","patientReference":"Patient/p-1","claimOutcome":"complete"}`,
			requiredKeys:  []string{"resourceType", "meta", "status", "use", "created", "patient", "outcome"},
		},
		{
			name:          "charge_item",
			resourceType:  "ChargeItem",
			inputResource: `{"chargeItemStatus":"billable","chargeItemCodeSystem":"http://loinc.org","chargeItemCode":"1234-5","patientReference":"Patient/p-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "status", "code", "subject"},
		},
		{
			name:          "charge_item_definition",
			resourceType:  "ChargeItemDefinition",
			inputResource: `{"definitionUrl":"http://example.org/ChargeItemDefinition/1","definitionStatus":"active"}`,
			requiredKeys:  []string{"resourceType", "meta", "url", "status"},
		},
		{
			name:          "invoice",
			resourceType:  "Invoice",
			inputResource: `{"invoiceStatus":"issued","invoiceDate":"2026-02-17","patientReference":"Patient/p-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "status"},
		},
		{
			name:          "payment_notice",
			resourceType:  "PaymentNotice",
			inputResource: `{"paymentNoticeStatus":"active","createdDate":"2026-02-17","paymentReference":"PaymentReconciliation/pr-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "status", "created", "payment"},
		},
		{
			name:          "payment_reconciliation",
			resourceType:  "PaymentReconciliation",
			inputResource: `{"paymentReconciliationStatus":"active","createdDate":"2026-02-17"}`,
			requiredKeys:  []string{"resourceType", "meta", "status", "created"},
		},
		{
			name:          "allergy_intolerance",
			resourceType:  "AllergyIntolerance",
			inputResource: `{"allergyCodeSystem":"http://snomed.info/sct","allergyCode":"227493005","patientReference":"Patient/p-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "patient"},
		},
		{
			name:          "condition",
			resourceType:  "Condition",
			inputResource: `{"conditionCodeSystem":"http://snomed.info/sct","conditionCode":"44054006","patientReference":"Patient/p-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "subject"},
		},
		{
			name:          "diagnostic_report",
			resourceType:  "DiagnosticReport",
			inputResource: `{"diagnosticReportStatus":"final","reportCodeSystem":"http://loinc.org","reportCode":"58410-2"}`,
			requiredKeys:  []string{"resourceType", "meta", "status", "code"},
		},
		{
			name:          "medication_administration",
			resourceType:  "MedicationAdministration",
			inputResource: `{"medicationAdministrationStatus":"completed","medicationCodeSystem":"http://www.nlm.nih.gov/research/umls/rxnorm","medicationCode":"1049502","patientReference":"Patient/p-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "status", "medicationCodeableConcept", "subject"},
		},
		{
			name:          "medication_request",
			resourceType:  "MedicationRequest",
			inputResource: `{"medicationRequestStatus":"active","medicationRequestIntent":"order","medicationCodeSystem":"http://www.nlm.nih.gov/research/umls/rxnorm","medicationCode":"1049502","patientReference":"Patient/p-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "status", "intent", "medicationCodeableConcept", "subject"},
		},
		{
			name:          "nutrition_order",
			resourceType:  "NutritionOrder",
			inputResource: `{"patientReference":"Patient/p-1","orderDateTime":"2026-02-17T09:00:00Z","nutritionOrderStatus":"active"}`,
			requiredKeys:  []string{"resourceType", "meta", "patient", "dateTime"},
		},
		{
			name:          "practitioner_role",
			resourceType:  "PractitionerRole",
			inputResource: `{"practitionerReference":"Practitioner/pr-1","organizationReference":"Organization/org-1"}`,
			requiredKeys:  []string{"resourceType", "meta", "practitioner"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			input := []byte(`{"resourceType":"Bundle","type":"collection","entry":[{"resource":` + tc.inputResource + `}]}`)
			out, err := BuildSuccessBundle(tc.resourceType, input)
			if err != nil {
				t.Fatalf("expected no error, got %v", err)
			}

			resource := firstEntryResource(t, out)
			if got := asString(resource["resourceType"]); got != tc.resourceType {
				t.Fatalf("expected resourceType %s, got %s", tc.resourceType, got)
			}
			for _, key := range tc.requiredKeys {
				if _, ok := resource[key]; !ok {
					t.Fatalf("expected key %q in rebuilt resource", key)
				}
			}
		})
	}
}
