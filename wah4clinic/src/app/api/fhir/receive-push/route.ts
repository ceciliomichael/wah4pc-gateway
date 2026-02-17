import { NextRequest, NextResponse } from "next/server";
import { IntegrationService } from "@/lib/server/integration-service";
import { TransactionType, TransactionStatus } from "@/lib/integration-types";

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

		const body = await request.json();

		// Validate required fields
		if (!body.transactionId || !body.data) {
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

		// Store the received data
		await IntegrationService.storeReceivedData(body.transactionId, body.data);

		// Update transaction status to SUCCESS
		await IntegrationService.updateTransactionStatus(body.transactionId, TransactionStatus.SUCCESS);

		return NextResponse.json({ message: "Data received successfully" }, { status: 200 });
	} catch (error) {
		console.error("Receive Push API Error:", error);
		return NextResponse.json(
			{ error: "Failed to receive push data" },
			{ status: 500 },
		);
	}
}