import {
	type GatewayPushRequest,
	type JsonObject,
	type JsonValue,
	type SourceTrackedResource,
} from "@/lib/integration-types";

interface AppointmentOriginSyncResult {
	attempted: boolean;
	ok: boolean;
	status?: number;
	error?: string;
	targetId?: string;
}

function buildGatewayPushUrl(gatewayBaseUrl: string): string {
	const normalizedBaseUrl = gatewayBaseUrl.replace(/\/+$/, "");
	return `${normalizedBaseUrl}/api/v1/fhir/push/Appointment`;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: JsonValue | undefined): string {
	return typeof value === "string" ? value.trim() : "";
}

function readOriginSenderId(appointment: SourceTrackedResource): string {
	if (!isJsonObject(appointment._integration)) {
		return "";
	}

	const origin = appointment._integration.origin;
	if (!isJsonObject(origin)) {
		return "";
	}

	return readString(origin.senderId);
}

function stripLocalIntegrationMetadata(
	appointment: SourceTrackedResource,
): JsonObject {
	const { _integration: _ignoredIntegration, ...resourceWithoutIntegration } =
		appointment;
	return resourceWithoutIntegration;
}

export async function syncUpdatedAppointmentToOrigin(
	appointment: SourceTrackedResource,
): Promise<AppointmentOriginSyncResult> {
	const targetId = readOriginSenderId(appointment);
	if (!targetId) {
		return {
			attempted: false,
			ok: true,
		};
	}

	const apiKey = process.env.WAH4PC_API_KEY;
	const providerId = process.env.WAH4PC_PROVIDER_ID;
	const gatewayUrl = process.env.WAH4PC_GATEWAY_URL;

	if (!apiKey || !providerId || !gatewayUrl) {
		return {
			attempted: true,
			ok: false,
			targetId,
			error:
				"WAH4PC_API_KEY, WAH4PC_PROVIDER_ID, and WAH4PC_GATEWAY_URL are required",
		};
	}

	const payload: GatewayPushRequest = {
		senderId: providerId,
		targetId,
		resource: stripLocalIntegrationMetadata(appointment),
		reason: "Appointment updated in wah4clinic",
		notes: "Auto-sync of received appointment update",
	};

	try {
		const response = await fetch(buildGatewayPushUrl(gatewayUrl), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-Key": apiKey,
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			return {
				attempted: true,
				ok: false,
				targetId,
				status: response.status,
				error: `Gateway push failed with status ${response.status}${
					errorBody ? `: ${errorBody}` : ""
				}`,
			};
		}

		return {
			attempted: true,
			ok: true,
			targetId,
			status: response.status,
		};
	} catch (error) {
		return {
			attempted: true,
			ok: false,
			targetId,
			error: error instanceof Error ? error.message : "Unknown push error",
		};
	}
}

export type { AppointmentOriginSyncResult };
