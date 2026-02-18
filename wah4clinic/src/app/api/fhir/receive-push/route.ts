import { type NextRequest, NextResponse } from "next/server";
import {
  type DirectPushPayload,
  type JsonObject,
  type JsonValue,
  type ReceivePushPayload,
  TransactionStatus,
  TransactionType,
} from "@/lib/integration-types";
import { IntegrationService } from "@/lib/server/integration-service";

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasGatewayEnvelopeFields(
  payload: Partial<ReceivePushPayload>,
): payload is ReceivePushPayload {
  return (
    typeof payload.transactionId === "string" &&
    payload.transactionId.length > 0 &&
    typeof payload.senderId === "string" &&
    payload.senderId.length > 0 &&
    typeof payload.resourceType === "string" &&
    payload.resourceType.length > 0 &&
    payload.resource !== undefined
  );
}

function hasDirectPushFields(
  payload: Partial<DirectPushPayload>,
): payload is DirectPushPayload {
  return (
    typeof payload.senderId === "string" &&
    payload.senderId.length > 0 &&
    payload.resource !== undefined
  );
}

function extractResourceTypeFromResource(resource: JsonValue): string | null {
  if (!isJsonObject(resource)) {
    return null;
  }

  const value = resource.resourceType;
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeIncomingPushPayload(
  payload: Partial<ReceivePushPayload & DirectPushPayload>,
): ReceivePushPayload | null {
  if (hasGatewayEnvelopeFields(payload)) {
    const resourceTypeFromResource = extractResourceTypeFromResource(
      payload.resource,
    );
    if (
      resourceTypeFromResource &&
      resourceTypeFromResource !== payload.resourceType
    ) {
      return null;
    }

    return payload;
  }

  if (!hasDirectPushFields(payload)) {
    return null;
  }

  const resourceType = extractResourceTypeFromResource(payload.resource);
  if (!resourceType) {
    return null;
  }

  return {
    transactionId: crypto.randomUUID(),
    senderId: payload.senderId,
    resourceType,
    resource: payload.resource,
    reason: payload.reason,
    notes: payload.notes,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate Gateway Authentication
    const authHeader = request.headers.get("X-Gateway-Auth");
    const expectedKey = process.env.GATEWAY_AUTH_KEY;

    if (expectedKey && authHeader !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid gateway authentication" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Partial<
      ReceivePushPayload & DirectPushPayload
    >;
    const normalizedPayload = normalizeIncomingPushPayload(body);

    // Validate required fields
    if (!normalizedPayload) {
      return NextResponse.json(
        {
          error:
            "Invalid push payload. Required: senderId and resource.resourceType. For gateway envelope: transactionId and resourceType are also required.",
        },
        { status: 400 },
      );
    }

    // Log the incoming push transaction
    await IntegrationService.logTransaction(TransactionType.PUSH, {
      transactionId: normalizedPayload.transactionId,
      senderId: normalizedPayload.senderId,
      resourceType: normalizedPayload.resourceType,
      reason: normalizedPayload.reason,
      notes: normalizedPayload.notes,
    });

    // Store the received data and route it to resource-specific JSON file
    await IntegrationService.storeReceivedPushData(
      normalizedPayload.transactionId,
      normalizedPayload.resourceType,
      normalizedPayload.resource,
    );

    // Update transaction status to SUCCESS
    await IntegrationService.updateTransactionStatus(
      normalizedPayload.transactionId,
      TransactionStatus.SUCCESS,
    );

    return NextResponse.json(
      { message: "Data received successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Receive Push API Error:", error);
    return NextResponse.json(
      { error: "Failed to receive push data" },
      { status: 500 },
    );
  }
}
