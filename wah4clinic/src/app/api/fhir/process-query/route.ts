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
		if (!body.transactionId || !body.identifiers || !body.gatewayReturnUrl) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Log the incoming transaction
		const transaction = await IntegrationService.logTransaction(TransactionType.QUERY, {
			transactionId: body.transactionId,
			identifiers: body.identifiers,
			gatewayReturnUrl: body.gatewayReturnUrl,
			resourceType: body.resourceType,
			reason: body.reason,
			notes: body.notes,
		});

		// Acknowledge immediately
		const response = NextResponse.json({ message: "Processing" }, { status: 200 });

		// Process asynchronously
		setImmediate(async () => {
			try {
				// Find patient by identifiers
				const patient = await IntegrationService.findPatientByIdentifiers(body.identifiers);
				const requestedResourceType = body.resourceType || "Patient";

				let responsePayload;
				if (!patient) {
					// Patient not found
					responsePayload = {
						transactionId: body.transactionId,
						status: "REJECTED",
						data: {
							error: "Patient not found",
							searchedIdentifiers: body.identifiers,
						},
					};
					await IntegrationService.updateTransactionStatus(
						transaction.id,
						TransactionStatus.REJECTED,
					);
				} else {
					// Patient found: return requested resource type linked to this patient
					const resources = await IntegrationService.findResourcesByPatient(
						requestedResourceType,
						patient.id,
					);

					const responseData =
						requestedResourceType === "Patient" ? patient : resources;

					responsePayload = {
						transactionId: body.transactionId,
						status: "SUCCESS",
						data: responseData,
					};
					await IntegrationService.updateTransactionStatus(
						transaction.id,
						TransactionStatus.SUCCESS,
					);
				}

				// Send response to gateway
				const gatewayResponse = await fetch(body.gatewayReturnUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-API-Key": process.env.WAH4PC_API_KEY || "",
						"X-Provider-ID": process.env.WAH4PC_PROVIDER_ID || "",
					},
					body: JSON.stringify(responsePayload),
				});

				if (!gatewayResponse.ok) {
					console.error(`[Process Query] Gateway callback failed: ${gatewayResponse.status}`);
					await IntegrationService.updateTransactionStatus(
						transaction.id,
						TransactionStatus.ERROR,
						`Gateway returned ${gatewayResponse.status}`,
					);
				}
			} catch (error) {
				console.error(`[Process Query] Error processing ${body.transactionId}:`, error);
				await IntegrationService.updateTransactionStatus(
					transaction.id,
					TransactionStatus.ERROR,
					error instanceof Error ? error.message : "Unknown error",
				);
			}
		});

		return response;
	} catch (error) {
		console.error("Process Query API Error:", error);
		return NextResponse.json(
			{ error: "Failed to process query" },
			{ status: 500 },
		);
	}
}
