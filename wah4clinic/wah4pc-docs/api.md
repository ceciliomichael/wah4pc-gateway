# API Reference

Complete documentation of all WAH4PC Gateway API endpoints. Use these endpoints to discover providers, initiate FHIR transfers, and track transactions.

## Base URL

`
{config.gatewayUrl}
`

Replace with your gateway instance URL in production.

## Authentication

API Key Required

{authenticationInfo.description}

Header Format

`
{authenticationInfo.header}: YOUR_API_KEY_HERE
`

Alternative:
`
{authenticationInfo.alternativeHeader}
`

> **Getting Started**
Contact your system administrator to obtain an API key for accessing the gateway.

{iconMap[category.iconName]}

## {category.category}

{category.description}

{category.items.map((endpoint, idx) => (

))}

## Error Responses

All endpoints return consistent error responses in the following format:

## Rate Limiting

The gateway enforces per-API-key rate limiting to ensure fair usage and system stability.
Each API key has a configurable rate limit set during creation.

i

## Endpoints

### POST /api/v1/fhir/request/{resourceType}

Initiate a FHIR resource request to another provider. Uses FHIR-compliant identifiers (system + value) to identify the patient across different healthcare systems.

### POST /api/v1/fhir/receive/{resourceType}

Endpoint for target providers to send data back to the gateway

### POST /api/v1/fhir/push/{resourceType}

Push a FHIR resource directly to another provider without a prior request. Useful for sending referrals, appointments, or unsolicited results.

### GET /health

Check if the gateway is running and healthy. This endpoint does not require authentication.

### GET /api/v1/providers

List all registered healthcare providers

### GET /api/v1/transactions

List transactions. Admin keys see all transactions. User keys only see transactions where their linked provider is the requester or target.

### GET /api/v1/transactions/{id}

Get details of a specific transaction. User keys can only access transactions where their linked provider is involved.

### POST /fhir/process-query

Endpoint you must implement to receive data requests from the gateway. When another provider requests patient data, the gateway will call this endpoint on your system.

### POST /fhir/receive-results

Endpoint you must implement to receive requested data. When data you requested is ready, the gateway will deliver it to this endpoint on your system.

### POST /fhir/receive-push

Endpoint you must implement to receive unsolicited data pushes from other providers (e.g., incoming referrals or appointments).

## Webhook Payload Contracts (Canonical)

Use these shapes for provider-side webhooks:

### Incoming: `POST /fhir/process-query`

```json
{
  "transactionId": "txn_...",
  "requesterId": "provider-id",
  "identifiers": [{ "system": "http://...", "value": "..." }],
  "resourceType": "Patient",
  "gatewayReturnUrl": "https://.../api/v1/fhir/receive/Patient",
  "reason": "optional",
  "notes": "optional"
}
```

### Incoming: `POST /fhir/receive-results`

```json
{
  "transactionId": "txn_...",
  "status": "SUCCESS",
  "data": {}
}
```

For `REJECTED` and `ERROR`, `data` must be an `OperationOutcome`:

```json
{
  "transactionId": "txn_...",
  "status": "REJECTED",
  "data": {
    "resourceType": "OperationOutcome",
    "issue": [
      {
        "severity": "error",
        "code": "not-found",
        "details": { "text": "Patient not found" }
      }
    ]
  }
}
```

### Incoming: `POST /fhir/receive-push`

```json
{
  "transactionId": "txn_...",
  "senderId": "provider-id",
  "resourceType": "Appointment",
  "resource": {
    "resourceType": "Appointment"
  },
  "reason": "optional",
  "notes": "optional"
}
```

`/fhir/receive-push` uses `resource` (not `data`).
