package service

import (
	"encoding/json"
	"errors"
	"fmt"
)

// validatePushData performs specific business rule validation for pushed resources.
// It enforces stricter rules than standard FHIR validation for certain resource types.
func (s *GatewayService) validatePushData(resourceType string, data json.RawMessage) error {
	switch resourceType {
	case "Appointment":
		return s.validateAppointment(data)
	default:
		// No specific additional validation for other types yet
		return nil
	}
}

// validateAppointment enforces that Appointment participants use logical identifiers.
func (s *GatewayService) validateAppointment(data json.RawMessage) error {
	// Define minimal structure needed for validation
	type identifier struct {
		System string `json:"system"`
		Value  string `json:"value"`
	}

	type actor struct {
		Reference  string      `json:"reference"`
		Identifier *identifier `json:"identifier"`
	}

	type participant struct {
		Actor actor `json:"actor"`
	}

	type appointment struct {
		Participant []participant `json:"participant"`
	}

	var appt appointment
	if err := json.Unmarshal(data, &appt); err != nil {
		return fmt.Errorf("failed to parse appointment data: %w", err)
	}

	if len(appt.Participant) == 0 {
		return errors.New("appointment must have at least one participant")
	}

	for i, p := range appt.Participant {
		// Check if identifier is present
		if p.Actor.Identifier == nil {
			return fmt.Errorf("participant[%d].actor must use a logical identifier (not just a direct reference)", i)
		}

		// Check if identifier has required fields
		if p.Actor.Identifier.System == "" || p.Actor.Identifier.Value == "" {
			return fmt.Errorf("participant[%d].actor.identifier must have both system and value", i)
		}
	}

	return nil
}