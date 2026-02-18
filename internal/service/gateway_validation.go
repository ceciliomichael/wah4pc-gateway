package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

// validatePushData performs specific business rule validation for pushed resources.
// It enforces stricter rules than standard FHIR validation for certain resource types.
func (s *GatewayService) validatePushData(resourceType string, resource json.RawMessage) error {
	switch resourceType {
	case "Appointment":
		return s.validateAppointment(resource)
	default:
		// No specific additional validation for other types yet
		return nil
	}
}

// validateAppointment enforces a minimal set of real FHIR Appointment invariants
// to keep push payloads predictable for downstream systems.
func (s *GatewayService) validateAppointment(resource json.RawMessage) error {
	type participant struct {
		Type   []json.RawMessage `json:"type"`
		Actor  *json.RawMessage  `json:"actor"`
		Status string            `json:"status"`
	}

	type appointment struct {
		Status      string        `json:"status"`
		Participant []participant `json:"participant"`
	}

	var appt appointment
	if err := json.Unmarshal(resource, &appt); err != nil {
		return fmt.Errorf("failed to parse appointment resource: %w", err)
	}

	if strings.TrimSpace(appt.Status) == "" {
		return errors.New("appointment.status is required")
	}

	if len(appt.Participant) == 0 {
		return errors.New("appointment must have at least one participant")
	}

	for i, p := range appt.Participant {
		// FHIR app-1 invariant: either participant.type or participant.actor SHALL be present.
		if len(p.Type) == 0 && p.Actor == nil {
			return fmt.Errorf("participant[%d] must include either actor or type", i)
		}

		if strings.TrimSpace(p.Status) == "" {
			return fmt.Errorf("participant[%d].status is required", i)
		}
	}

	return nil
}
