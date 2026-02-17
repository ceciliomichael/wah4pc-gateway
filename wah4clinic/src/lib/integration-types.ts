export interface Identifier {
    system: string;
    value: string;
}

export enum TransactionType {
    QUERY = 'QUERY',
    RESULT = 'RESULT',
    PUSH = 'PUSH'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    REJECTED = 'REJECTED',
    ERROR = 'ERROR'
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
    data: unknown;
    receivedAt: string;
}