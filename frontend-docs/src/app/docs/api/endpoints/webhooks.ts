import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const webhookEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/api/fhir/practitioners",
    description:
      "Endpoint you should implement for practitioner directory sync. The gateway fetches this endpoint to keep your practitioner list current.",
    headers: [
      {
        name: "X-Gateway-Auth",
        value: "your-gateway-auth-key",
        required: true,
        description:
          "Secret key you provided during provider registration. Validate this to ensure the request is from the gateway.",
      },
    ],
    responseStatus: 200,
    responseBody: `[
  {
    "code": "prac-001",
    "display": "Dr. Maria Santos",
    "active": true
  },
  {
    "code": "prac-002",
    "display": "Dr. Jose Cruz",
    "active": false
  }
]`,
    notes: [
      "Register this relative path as your `practitionerListEndpoint` (for example `/api/fhir/practitioners`).",
      "Return practitioner items with `code`, `display`, and `active` fields.",
      "After practitioner changes, trigger `POST /api/v1/providers/{id}/practitioners/webhook` so gateway refreshes cached practitioners.",
    ],
  },
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
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requesterId": "requester-provider-uuid",
  "resourceType": "Patient",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    }
  ],
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
      "For appointment and routing workflows, keep your `/api/fhir/practitioners` list updated and trigger practitioner sync webhook on changes.",
      "Use the lookup data in the payload (`identifiers` and other provided fields) to resolve records in your local system.",
      "The payload format may evolve; process known lookup fields defensively.",
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
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [
      {
        "resource": {
          "resourceType": "MedicationRequest",
          "id": "medrx-1",
          "status": "active"
        }
      }
    ]
  }
}`,
    responseStatus: 200,
    responseBody: `{
  "message": "Data received successfully"
}`,
    notes: [
      "**You must implement this endpoint** on your server at the baseUrl you registered",
      "The transactionId corresponds to a request you previously initiated",
      "Current gateway behavior delivers `SUCCESS` and `ERROR` to requester webhook consumers.",
      "`REJECTED` is currently not relayed to requester `/fhir/receive-results` (it is logged in gateway transaction state).",
      "When status is SUCCESS, the data field contains a FHIR Bundle (type=collection)",
      "When status is ERROR, the data field contains error details (OperationOutcome or gateway-generated error object).",
      "Do not assume a single resource object for SUCCESS; always parse Bundle.entry[]",
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
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "senderId": "sender-provider-uuid",
  "resourceType": "Appointment",
  "resource": {
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
      "Process and store the received FHIR resource immediately",
      "Return 200 OK to acknowledge receipt",
    ],
  },
];
