import { NextRequest, NextResponse } from "next/server";
import { IntegrationService } from "@/lib/server/integration-service";
import { ReceiveResultsPayload, TransactionStatus } from "@/lib/integration-types";

function isValidReceiveResultsPayload(
	payload: Partial<ReceiveResultsPayload>,
): payload is ReceiveResultsPayload {
	return (
		typeof payload.transactionId === "string"
		&& payload.transactionId.length > 0
		&& (payload.status === "SUCCESS" || payload.status === "REJECTED" || payload.status === "ERROR")
		&& payload.data !== undefined
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

		const body = (await request.json()) as Partial<ReceiveResultsPayload>;

		// Validate required fields
		if (!isValidReceiveResultsPayload(body)) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Store the received data
		await IntegrationService.storeReceivedData(body.transactionId, body.data);

		// Update transaction status
		const success = await IntegrationService.updateTransactionStatus(
			body.transactionId,
			body.status === "SUCCESS"
				? TransactionStatus.SUCCESS
				: body.status === "REJECTED"
				  ? TransactionStatus.REJECTED
				  : TransactionStatus.ERROR,
		);

		if (!success) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ message: "Data received successfully" }, { status: 200 });
	} catch (error) {
		console.error("Receive Results API Error:", error);
		return NextResponse.json(
			{ error: "Failed to receive results" },
			{ status: 500 },
		);
	}
}
