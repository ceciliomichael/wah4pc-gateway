package model

// SystemSettings represents global system configuration that can be modified at runtime
type SystemSettings struct {
	ID                string `json:"id"` // Always "global"
	ValidatorDisabled bool   `json:"validatorDisabled"`
}

// GetID implements Identifiable interface
func (s SystemSettings) GetID() string {
	return s.ID
}

const SettingsIDGlobal = "global"