package service

import (
	"encoding/json"
	"fmt"
)

type operationOutcome struct {
	ResourceType string `json:"resourceType"`
}

func validateOperationOutcomeData(data json.RawMessage) error {
	if len(data) == 0 {
		return fmt.Errorf("data is required")
	}

	var outcome operationOutcome
	if err := json.Unmarshal(data, &outcome); err != nil {
		return fmt.Errorf("data must be valid JSON: %w", err)
	}
	if outcome.ResourceType != "OperationOutcome" {
		return fmt.Errorf("data.resourceType must be OperationOutcome for REJECTED/ERROR statuses")
	}

	return nil
}
