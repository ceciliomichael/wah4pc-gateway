export interface Identifier {
	system: string;
	value: string;
}

export enum TransactionType {
	QUERY = "QUERY",
	RESULT = "RESULT",
	PUSH = "PUSH",
}

export enum TransactionStatus {
	PENDING = "PENDING",
	SUCCESS = "SUCCESS",
	REJECTED = "REJECTED",
	ERROR = "ERROR",
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
	[key: string]: JsonValue;
}

export interface ProcessQueryPayload {
	transactionId: string;
	requesterId: string;
	identifiers: Identifier[];
	resourceType: string;
	gatewayReturnUrl: string;
	reason?: string;
	notes?: string;
}

export interface ReceiveResultsPayload {
	transactionId: string;
	status: "SUCCESS" | "REJECTED" | "ERROR";
	data: JsonValue;
}

export interface ReceivePushPayload {
	transactionId: string;
	senderId: string;
	resourceType: string;
	resource: JsonValue;
	reason?: string;
	notes?: string;
}

export type ResourceOriginMetadata = JsonObject & {
	source: "gateway-push";
	senderId: string;
	transactionId: string;
	receivedAt: string;
	resourceType: string;
};

export type LocalIntegrationMetadata = JsonObject & {
	origin?: ResourceOriginMetadata;
};

export type SourceTrackedResource = JsonObject & {
	resourceType: string;
	id?: string;
	_integration?: LocalIntegrationMetadata;
};

export interface GatewayPushRequest {
	senderId: string;
	targetId: string;
	resource: JsonValue;
	reason?: string;
	notes?: string;
}

// Direct push shape received from sender-facing gateway endpoint payloads.
export interface DirectPushPayload {
	senderId: string;
	targetId?: string;
	resource: JsonValue;
	reason?: string;
	notes?: string;
}

export interface OperationOutcomePayload {
	[key: string]: JsonValue;
	resourceType: "OperationOutcome";
	issue: Array<{
		severity: "fatal" | "error" | "warning" | "information";
		code: string;
		details: {
			text: string;
		};
	}>;
}

export interface WebhookTransaction {
	id: string;
	type: TransactionType;
	status: TransactionStatus;
	timestamp: string;
	details: {
		transactionId: string;
		identifiers?: Identifier[];
		gatewayReturnUrl?: string;
		resourceType?: string;
		senderId?: string;
		reason?: string;
		notes?: string;
	};
	error?: string;
}

export interface ReceivedData {
	transactionId: string;
	data: JsonValue;
	receivedAt: string;
}
