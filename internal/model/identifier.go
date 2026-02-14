package model

// Identifier represents a FHIR-compliant identifier with system and value
// This follows the HL7 FHIR Identifier datatype specification
// See: https://www.hl7.org/fhir/datatypes.html#Identifier
type Identifier struct {
	// System is the namespace URI that defines the identifier's scope
	// Examples:
	//   - "http://philhealth.gov.ph" (PhilHealth ID)
	//   - "http://psa.gov.ph/birth-certificate" (PSA Birth Certificate)
	//   - "http://hospital-a.com/mrn" (Hospital A's Medical Record Number)
	System string `json:"system" bson:"system"`

	// Value is the actual identifier value within the system's namespace
	Value string `json:"value" bson:"value"`
}

// CommonIdentifierSystems defines well-known identifier systems for the Philippines
var CommonIdentifierSystems = struct {
	PhilHealth          string
	PSABirthCert        string
	PhilHealthDependent string
	Passport            string
}{
	PhilHealth:          "http://philhealth.gov.ph",
	PSABirthCert:        "http://psa.gov.ph/birth-certificate",
	PhilHealthDependent: "http://philhealth.gov.ph/dependent",
	Passport:            "http://icao.int/passport",
}

// HasSystem checks if an identifier with the given system exists in the slice
func HasSystem(identifiers []Identifier, system string) bool {
	for _, id := range identifiers {
		if id.System == system {
			return true
		}
	}
	return false
}

// GetBySystem retrieves the first identifier matching the given system
func GetBySystem(identifiers []Identifier, system string) (Identifier, bool) {
	for _, id := range identifiers {
		if id.System == system {
			return id, true
		}
	}
	return Identifier{}, false
}

// IdentifiersMatch checks if two identifier slices contain the same set of identifiers
// Order independent - treats slices as sets for comparison
func IdentifiersMatch(a, b []Identifier) bool {
	if len(a) != len(b) {
		return false
	}

	// Check that every identifier in 'a' exists in 'b'
	for _, idA := range a {
		found := false
		for _, idB := range b {
			if idA.System == idB.System && idA.Value == idB.Value {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	return true
}
