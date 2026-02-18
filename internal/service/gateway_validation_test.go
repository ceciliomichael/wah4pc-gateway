package service

import (
	"encoding/json"
	"testing"
)

func TestValidateAppointment(t *testing.T) {
	svc := &GatewayService{}

	tests := []struct {
		name      string
		resource  string
		wantError bool
	}{
		{
			name: "valid with actor reference only",
			resource: `{
				"resourceType":"Appointment",
				"status":"booked",
				"participant":[
					{
						"actor":{"reference":"Patient/pat-1"},
						"status":"accepted"
					}
				]
			}`,
			wantError: false,
		},
		{
			name: "valid with actor identifier only",
			resource: `{
				"resourceType":"Appointment",
				"status":"booked",
				"participant":[
					{
						"actor":{"identifier":{"system":"https://example.org/mrn","value":"123"}},
						"status":"accepted"
					}
				]
			}`,
			wantError: false,
		},
		{
			name: "valid with participant type only",
			resource: `{
				"resourceType":"Appointment",
				"status":"booked",
				"participant":[
					{
						"type":[{"text":"attendee"}],
						"status":"needs-action"
					}
				]
			}`,
			wantError: false,
		},
		{
			name: "missing appointment status",
			resource: `{
				"resourceType":"Appointment",
				"participant":[
					{
						"actor":{"reference":"Patient/pat-1"},
						"status":"accepted"
					}
				]
			}`,
			wantError: true,
		},
		{
			name: "missing participants",
			resource: `{
				"resourceType":"Appointment",
				"status":"booked"
			}`,
			wantError: true,
		},
		{
			name: "missing actor and type",
			resource: `{
				"resourceType":"Appointment",
				"status":"booked",
				"participant":[
					{
						"status":"accepted"
					}
				]
			}`,
			wantError: true,
		},
		{
			name: "missing participant status",
			resource: `{
				"resourceType":"Appointment",
				"status":"booked",
				"participant":[
					{
						"actor":{"reference":"Patient/pat-1"}
					}
				]
			}`,
			wantError: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			raw := json.RawMessage(tc.resource)
			err := svc.validateAppointment(raw)
			if tc.wantError && err == nil {
				t.Fatalf("expected error, got nil")
			}
			if !tc.wantError && err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
		})
	}
}
