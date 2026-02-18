# Curl template: push an Appointment to WAH4PC Gateway
# Endpoint:
#   POST /api/v1/fhir/push/Appointment
#
# Edit values below, then run this file in PowerShell.

$gatewayUrl = "https://"
$apiKey = "wah_779238c3dd69f8ade2f0ae59f2f70a67d9139c5406b72c8c9148f44c902187f3"

$body = @"
{
  "senderId": "d222aba3-3fc3-46fa-a251-933dd8b87857",
  "targetId": "433b81f2-413d-4efa-9ce5-123198bfec6f",
  "reason": "New Appointment Request",
  "notes": "Optional notes",
  "resource": {
    "resourceType": "Appointment",
    "id": "appt-1001",
    "status": "booked",
    "start": "2026-02-18T09:00:00Z",
    "end": "2026-02-18T09:30:00Z",
    "participant": [
      {
        "actor": {
          "reference": "Patient/pat-001",
          "type": "Patient",
          "display": "Current Patient",
          "identifier": {
            "system": "http://wah4p.echosphere.cfd/patient-id",
            "value": "pat-001"
          }
        },
        "status": "accepted"
      },
      {
        "actor": {
          "reference": "Practitioner/prac-001",
          "type": "Practitioner",
          "display": "Dr. Sample",
          "identifier": {
            "system": "http://wah4p.echosphere.cfd/practitioner-id",
            "value": "prac-001"
          }
        },
        "type": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                "code": "PPRF",
                "display": "primary performer"
              }
            ]
          }
        ],
        "status": "accepted"
      }
    ]
  }
}
"@

curl.exe -X POST "$gatewayUrl/api/v1/fhir/push/Appointment" `
  -H "Content-Type: application/json" `
  -H "X-API-Key: $apiKey" `
  --data-raw $body
