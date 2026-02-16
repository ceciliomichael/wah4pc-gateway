package model

// QuerySelector defines how the requester identifies the subject of a query.
// It supports both patient-scoped and resource-scoped selectors.
type QuerySelector struct {
	PatientIdentifiers  []Identifier `json:"patientIdentifiers,omitempty" bson:"patientIdentifiers,omitempty"`
	PatientReference    string       `json:"patientReference,omitempty" bson:"patientReference,omitempty"`
	ResourceIdentifiers []Identifier `json:"resourceIdentifiers,omitempty" bson:"resourceIdentifiers,omitempty"`
	ResourceReference   string       `json:"resourceReference,omitempty" bson:"resourceReference,omitempty"`
}

// HasPatientSelector reports whether at least one patient selector field is set.
func (s QuerySelector) HasPatientSelector() bool {
	return len(s.PatientIdentifiers) > 0 || s.PatientReference != ""
}

// HasResourceSelector reports whether at least one resource selector field is set.
func (s QuerySelector) HasResourceSelector() bool {
	return len(s.ResourceIdentifiers) > 0 || s.ResourceReference != ""
}

// QuerySelectorsMatch performs order-independent selector comparison.
func QuerySelectorsMatch(a, b QuerySelector) bool {
	if a.PatientReference != b.PatientReference {
		return false
	}
	if a.ResourceReference != b.ResourceReference {
		return false
	}
	if !IdentifiersMatch(a.PatientIdentifiers, b.PatientIdentifiers) {
		return false
	}
	if !IdentifiersMatch(a.ResourceIdentifiers, b.ResourceIdentifiers) {
		return false
	}
	return true
}
