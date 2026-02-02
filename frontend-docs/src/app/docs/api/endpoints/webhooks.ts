import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const webhookEndpoints: EndpointCardProps[] = [
  {
    method: "POST",
    path: "/fhir/process-query",
    description:
      "Endpoint you must implement to receive data requests from the gateway. When another provider requests patient data, the gateway will call this endpoint on your system.",
    headers: [
      {
        name: "X-Gateway-Auth",
        value: "your-gateway-auth-key",
        required: true,
        description:
          "Secret key you provided during provider registration. Validate this to ensure the request is from the gateway.",
      },
    ],
    requestBody: `{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "requesterId": "requester-provider-uuid",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    },
    {
      "system": "http://hospital-b.com/mrn",
      "value": "MRN-12345"
    }
  ],
  "resourceType": "Patient",
  "gatewayReturnUrl": "https://gateway.wah4pc.com/api/v1/fhir/receive/Patient",
  "reason": "Referral consultation",
  "notes": "Patient transferring for specialized care"
}`,
    responseStatus: 200,
    responseBody: `{
  "message": "Processing"
}`,
    notes: [
      "**You must implement this endpoint** on your server at the baseUrl you registered",
      "Respond with 200 OK immediately to acknowledge receipt",
      "Process the request asynchronously and send results to the gatewayReturnUrl",
      "Use the transactionId when sending results back to correlate the response",
      "Validate the X-Gateway-Auth header matches your registered gatewayAuthKey",
      "Search your database using the provided identifiers array",
      "The reason and notes fields provide context about why data is being requested",
    ],
  },
  {
    method: "POST",
    path: "/fhir/receive-results",
    description:
      "Endpoint you must implement to receive requested data. When data you requested is ready, the gateway will deliver it to this endpoint on your system.",
    headers: [
      {
        name: "X-Gateway-Auth",
        value: "your-gateway-auth-key",
        required: true,
        description:
          "Secret key you provided during provider registration. Validate this to ensure the request is from the gateway.",
      },
    ],
    requestBody: `{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Patient",
    "id": "patient-123",
    "identifier": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      }
    ],
    "name": [{ "family": "Dela Cruz", "given": ["Juan"] }],
    "birthDate": "1990-05-15",
    "gender": "male"
  }
}`,
    responseStatus: 200,
    responseBody: `{
  "message": "Data received successfully"
}`,
    notes: [
      "**You must implement this endpoint** on your server at the baseUrl you registered",
      "The transactionId corresponds to a request you previously initiated",
      "Status values: SUCCESS (data found), REJECTED (patient not found), ERROR (processing failed)",
      "When status is SUCCESS, the data field contains the FHIR resource",
      "When status is REJECTED or ERROR, the data field contains error details",
      "Store the received data and update your pending transaction status",
      "Validate the X-Gateway-Auth header matches your registered gatewayAuthKey",
    ],
  },
  {
    method: "POST",
    path: "/fhir/receive-push",
    description: "Endpoint you must implement to receive unsolicited data pushes from other providers (e.g., incoming referrals or appointments).",
    headers: [
      {
        name: "X-Gateway-Auth",
        value: "your-gateway-auth-key",
        required: true,
        description:
          "Secret key you provided during provider registration. Validate this to ensure the request is from the gateway.",
      },
    ],
    requestBody: `{
  "transactionId": "transaction-uuid",
  "senderId": "sender-provider-uuid",
  "resourceType": "Appointment",
  "data": {
    "resourceType": "Appointment",
    "status": "proposed",
    "description": "Consultation",
    "participant": [
      {
        "actor": {
          "type": "Patient",
          "identifier": {
            "system": "http://philhealth.gov.ph",
            "value": "12-345678901-2"
          }
        },
        "status": "accepted"
      }
    ]
  },
  "reason": "New Appointment Request",
  "notes": "Please confirm availability"
}`,
    responseStatus: 200,
    responseBody: `{
  "message": "Data received successfully"
}`,
    notes: [
      "**Implement this to support receiving data you didn't explicitly request**",
      "This is critical for receiving referrals, appointments, or unsolicited lab results",
      "Validate the X-Gateway-Auth header",
      "Process and store the received resource immediately",
      "Return 200 OK to acknowledge receipt",
    ],
  },
];