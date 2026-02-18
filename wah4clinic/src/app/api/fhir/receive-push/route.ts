import { type NextRequest, NextResponse } from "next/server";
import {
  type ReceivePushPayload,
  TransactionStatus,
  TransactionType,
} from "@/lib/integration-types";
import { IntegrationService } from "@/lib/server/integration-service";

function isValidReceivePushPayload(
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

    const body = (await request.json()) as Partial<ReceivePushPayload>;

    // Validate required fields
    if (!isValidReceivePushPayload(body)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Log the incoming push transaction
    await IntegrationService.logTransaction(TransactionType.PUSH, {
      transactionId: body.transactionId,
      senderId: body.senderId,
      resourceType: body.resourceType,
      reason: body.reason,
      notes: body.notes,
    });

    // Store the received data and route it to resource-specific JSON file
    await IntegrationService.storeReceivedPushData(
      body.transactionId,
      body.resourceType,
      body.resource,
    );

    // Update transaction status to SUCCESS
    await IntegrationService.updateTransactionStatus(
      body.transactionId,
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
