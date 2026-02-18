import { NextRequest, NextResponse } from "next/server";
import { IntegrationService } from "@/lib/server/integration-service";
import {
	JsonValue,
	OperationOutcomePayload,
	ProcessQueryPayload,
	ReceiveResultsPayload,
	TransactionStatus,
	TransactionType,
} from "@/lib/integration-types";

function buildOperationOutcome(text: string, code: string): OperationOutcomePayload {
	return {
		resourceType: "OperationOutcome",
		issue: [
			{
				severity: "error",
				code,
				details: {
					text,
				},
			},
		],
	};
}

function isValidProcessQueryPayload(payload: Partial<ProcessQueryPayload>): payload is ProcessQueryPayload {
	return (
		typeof payload.transactionId === "string"
		&& payload.transactionId.length > 0
		&& Array.isArray(payload.identifiers)
		&& payload.identifiers.length > 0
		&& typeof payload.gatewayReturnUrl === "string"
		&& payload.gatewayReturnUrl.length > 0
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

		const callbackApiKey = process.env.WAH4PC_API_KEY;
		const callbackProviderId = process.env.WAH4PC_PROVIDER_ID;
		if (!callbackApiKey || !callbackProviderId) {
			return NextResponse.json(
				{ error: "Server misconfigured: WAH4PC_API_KEY and WAH4PC_PROVIDER_ID are required" },
				{ status: 500 },
			);
		}

		const body = (await request.json()) as Partial<ProcessQueryPayload>;

		// Validate required fields
		if (!isValidProcessQueryPayload(body)) {
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

				let responsePayload: ReceiveResultsPayload;
				if (!patient) {
					// Patient not found
					responsePayload = {
						transactionId: body.transactionId,
						status: "REJECTED",
						data: buildOperationOutcome("Patient not found", "not-found") as JsonValue,
					};
					await IntegrationService.updateTransactionStatusByInternalId(
						transaction.id,
						TransactionStatus.REJECTED,
					);
				} else {
					// Patient found: return requested resource type linked to this patient
					const resources = await IntegrationService.findResourcesByPatient(
						requestedResourceType,
						patient.id,
					);

					const responseData = (
						requestedResourceType === "Patient" ? patient : resources
					) as JsonValue;

					responsePayload = {
						transactionId: body.transactionId,
						status: "SUCCESS",
						data: responseData,
					};
					await IntegrationService.updateTransactionStatusByInternalId(
						transaction.id,
						TransactionStatus.SUCCESS,
					);
				}

				// Send response to gateway
				const gatewayResponse = await fetch(body.gatewayReturnUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-API-Key": callbackApiKey,
						"X-Provider-ID": callbackProviderId,
					},
					body: JSON.stringify(responsePayload),
				});

				if (!gatewayResponse.ok) {
					console.error(`[Process Query] Gateway callback failed: ${gatewayResponse.status}`);
					await IntegrationService.updateTransactionStatusByInternalId(
						transaction.id,
						TransactionStatus.ERROR,
						`Gateway returned ${gatewayResponse.status}`,
					);
				}
			} catch (error) {
				console.error(`[Process Query] Error processing ${body.transactionId}:`, error);
				await IntegrationService.updateTransactionStatusByInternalId(
					transaction.id,
					TransactionStatus.ERROR,
					error instanceof Error ? error.message : "Unknown error",
				);

				const errorPayload: ReceiveResultsPayload = {
					transactionId: body.transactionId,
					status: "ERROR",
					data: buildOperationOutcome(
						error instanceof Error ? error.message : "Unknown error",
						"exception",
					) as JsonValue,
				};

				try {
					await fetch(body.gatewayReturnUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"X-API-Key": callbackApiKey,
							"X-Provider-ID": callbackProviderId,
						},
						body: JSON.stringify(errorPayload),
					});
				} catch (callbackError) {
					console.error("[Process Query] Failed to send ERROR callback:", callbackError);
				}
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
