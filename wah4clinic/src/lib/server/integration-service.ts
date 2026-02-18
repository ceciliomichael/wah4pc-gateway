import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { DataService } from "@/lib/server/data-service";
import {
	Identifier,
	JsonValue,
	WebhookTransaction,
	ReceivedData,
	TransactionStatus,
	TransactionType,
} from "@/lib/integration-types";

class IntegrationServiceClass {
	private readonly dataPath: string;

	constructor() {
		this.dataPath = path.join(process.cwd(), "data");
		this.ensureDataDirectory();
	}

	private ensureDataDirectory(): void {
		if (!fs.existsSync(this.dataPath)) {
			fs.mkdirSync(this.dataPath, { recursive: true });
		}
	}

	private getFilePath(filename: string): string {
		return path.join(this.dataPath, filename);
	}

	private readJsonFile<T>(filename: string): T[] {
		const filePath = this.getFilePath(filename);

		if (!fs.existsSync(filePath)) {
			return [];
		}

		const fileContent = fs.readFileSync(filePath, "utf-8");
		return JSON.parse(fileContent) as T[];
	}

	private writeJsonFile<T>(filename: string, data: T[]): void {
		const filePath = this.getFilePath(filename);
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
	}

	async logTransaction(
		type: TransactionType,
		details: WebhookTransaction["details"],
	): Promise<WebhookTransaction> {
		const transaction: WebhookTransaction = {
			id: uuidv4(),
			type,
			status: TransactionStatus.PENDING,
			timestamp: new Date().toISOString(),
			details,
		};

		const transactions = this.readJsonFile<WebhookTransaction>("transactions.json");
		transactions.push(transaction);
		this.writeJsonFile("transactions.json", transactions);

		return transaction;
	}

	async updateTransactionStatus(
		transactionId: string,
		status: TransactionStatus,
		error?: string,
	): Promise<boolean> {
		const transactions = this.readJsonFile<WebhookTransaction>("transactions.json");
		const index = transactions.findIndex(
			(tx) => tx.details.transactionId === transactionId,
		);

		if (index === -1) {
			return false;
		}

		transactions[index].status = status;
		if (error) {
			transactions[index].error = error;
		}

		this.writeJsonFile("transactions.json", transactions);
		return true;
	}

	async updateTransactionStatusByInternalId(
		internalId: string,
		status: TransactionStatus,
		error?: string,
	): Promise<boolean> {
		const transactions = this.readJsonFile<WebhookTransaction>("transactions.json");
		const index = transactions.findIndex((tx) => tx.id === internalId);

		if (index === -1) {
			return false;
		}

		transactions[index].status = status;
		if (error) {
			transactions[index].error = error;
		}

		this.writeJsonFile("transactions.json", transactions);
		return true;
	}

	async getTransactions(): Promise<WebhookTransaction[]> {
		return this.readJsonFile<WebhookTransaction>("transactions.json");
	}

	async storeReceivedData(transactionId: string, data: JsonValue): Promise<void> {
		const receivedData: ReceivedData = {
			transactionId,
			data,
			receivedAt: new Date().toISOString(),
		};

		const allData = this.readJsonFile<ReceivedData>("received-data.json");
		allData.push(receivedData);
		this.writeJsonFile("received-data.json", allData);
	}

	/**
	 * Normalizes PhilHealth identifier system URLs to handle multiple formats.
	 * Supports both shortened and full FHIR-compliant URLs.
	 */
	private normalizePhilHealthSystem(system: string): string {
		const philhealthVariants = [
			"http://philhealth.gov.ph",
			"http://philhealth.gov.ph/fhir/Identifier/philhealth-id",
			"https://philhealth.gov.ph",
			"https://philhealth.gov.ph/fhir/Identifier/philhealth-id",
		];
		
		if (philhealthVariants.some(variant => system.includes("philhealth.gov.ph"))) {
			return "http://philhealth.gov.ph/fhir/Identifier/philhealth-id";
		}
		
		return system;
	}

	/**
	 * Checks if two identifier systems match, accounting for PhilHealth URL variations.
	 */
	private systemsMatch(system1: string, system2: string): boolean {
		const normalized1 = this.normalizePhilHealthSystem(system1);
		const normalized2 = this.normalizePhilHealthSystem(system2);
		return normalized1 === normalized2;
	}

	async findPatientByIdentifiers(identifiers: Identifier[]): Promise<any | null> {
		const patients = DataService.findAll<any>("Patient");
		
		// Search for patient by PhilHealth ID first (priority)
		for (const id of identifiers) {
			const normalizedSystem = this.normalizePhilHealthSystem(id.system);
			
			if (normalizedSystem === "http://philhealth.gov.ph/fhir/Identifier/philhealth-id") {
				const found = patients.find((p) =>
					p.identifier?.some(
						(identifier: any) =>
							this.systemsMatch(identifier.system, id.system) && identifier.value === id.value,
					),
				);
				if (found) return found;
			}
		}

		// Fallback: search by any identifier with system normalization
		for (const id of identifiers) {
			const found = patients.find((p) =>
				p.identifier?.some(
					(identifier: any) => 
						this.systemsMatch(identifier.system, id.system) && identifier.value === id.value,
				),
			);
			if (found) return found;
		}

		return null;
	}

	private getPatientReferences(patientId: string): Set<string> {
		return new Set([
			`Patient/${patientId}`,
			`patient/${patientId}`,
			patientId,
		]);
	}

	private matchesPatientReference(reference: unknown, patientReferences: Set<string>): boolean {
		return typeof reference === "string" && patientReferences.has(reference);
	}

	private matchesPatientParticipant(resource: any, patientReferences: Set<string>): boolean {
		if (!Array.isArray(resource?.participant)) {
			return false;
		}

		return resource.participant.some(
			(participant: any) =>
				this.matchesPatientReference(participant?.actor?.reference, patientReferences)
				|| this.matchesPatientReference(participant?.individual?.reference, patientReferences),
		);
	}

	async findResourcesByPatient(resourceType: string | undefined, patientId: string): Promise<any[]> {
		const requestedResourceType = resourceType?.trim() || "Patient";

		if (requestedResourceType === "Patient") {
			const patient = DataService.findById<any>("Patient", patientId);
			return patient ? [patient] : [];
		}

		const resources = DataService.findAll<any>(requestedResourceType);
		const patientReferences = this.getPatientReferences(patientId);

		return resources.filter(
			(resource: any) =>
				this.matchesPatientReference(resource?.subject?.reference, patientReferences)
				|| this.matchesPatientReference(resource?.patient?.reference, patientReferences)
				|| this.matchesPatientReference(resource?.beneficiary?.reference, patientReferences)
				|| this.matchesPatientParticipant(resource, patientReferences),
		);
	}
}

export const IntegrationService = new IntegrationServiceClass();
