package service

import "testing"

func TestParseAndValidateResourceType(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		path    string
		prefix  string
		want    string
		wantErr bool
	}{
		{
			name:   "valid type",
			path:   "/api/v1/fhir/request/Patient",
			prefix: "/api/v1/fhir/request/",
			want:   "Patient",
		},
		{
			name:   "valid type with trailing slash",
			path:   "/api/v1/fhir/request/Observation/",
			prefix: "/api/v1/fhir/request/",
			want:   "Observation",
		},
		{
			name:    "missing resource type",
			path:    "/api/v1/fhir/request/",
			prefix:  "/api/v1/fhir/request/",
			wantErr: true,
		},
		{
			name:    "unknown resource type",
			path:    "/api/v1/fhir/request/encoutner23n32jnsd",
			prefix:  "/api/v1/fhir/request/",
			wantErr: true,
		},
		{
			name:    "extra segment",
			path:    "/api/v1/fhir/request/Patient/extra",
			prefix:  "/api/v1/fhir/request/",
			wantErr: true,
		},
		{
			name:    "wrong case",
			path:    "/api/v1/fhir/request/patient",
			prefix:  "/api/v1/fhir/request/",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got, err := ParseAndValidateResourceType(tt.path, tt.prefix)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error for path %q, got none", tt.path)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error for path %q: %v", tt.path, err)
			}
			if got != tt.want {
				t.Fatalf("expected %q, got %q", tt.want, got)
			}
		})
	}
}
