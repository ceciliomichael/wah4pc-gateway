import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import {
  type Identifier,
  type JsonObject,
  type JsonValue,
  type ReceivedData,
  TransactionStatus,
  type TransactionType,
  type WebhookTransaction,
} from "@/lib/integration-types";
import { DataService } from "@/lib/server/data-service";

interface HumanName {
  family?: string;
  given?: string[];
  prefix?: string[];
}

interface FHIRPersonResource {
  [key: string]: unknown;
  resourceType: string;
  id?: string;
  name?: HumanName[];
  identifier?: Identifier[];
}

type StoredResource = JsonObject & { resourceType: string };

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

    const transactions =
      this.readJsonFile<WebhookTransaction>("transactions.json");
    transactions.push(transaction);
    this.writeJsonFile("transactions.json", transactions);

    return transaction;
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    error?: string,
  ): Promise<boolean> {
    const transactions =
      this.readJsonFile<WebhookTransaction>("transactions.json");
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
    const transactions =
      this.readJsonFile<WebhookTransaction>("transactions.json");
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

  async storeReceivedData(
    transactionId: string,
    data: JsonValue,
  ): Promise<void> {
    const receivedData: ReceivedData = {
      transactionId,
      data,
      receivedAt: new Date().toISOString(),
    };

    const allData = this.readJsonFile<ReceivedData>("received-data.json");
    allData.push(receivedData);
    this.writeJsonFile("received-data.json", allData);
  }

  private isJsonObject(value: JsonValue): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private normalizeResourceType(resourceType: string): string {
    return resourceType.trim();
  }

  async storeReceivedPushData(
    transactionId: string,
    resourceType: string,
    resource: JsonValue,
  ): Promise<void> {
    await this.storeReceivedData(transactionId, resource);

    if (!this.isJsonObject(resource)) {
      throw new Error("Push resource must be a JSON object");
    }

    const normalizedResourceType = this.normalizeResourceType(resourceType);
    const resourceForStore = this.normalizePushResourceForStore(
      normalizedResourceType,
      resource,
    );

    DataService.create(resourceForStore);
  }

  private normalizePushResourceForStore(
    resourceType: string,
    resource: JsonObject,
  ): StoredResource {
    const base: StoredResource = {
      ...resource,
      resourceType,
    };

    if (resourceType !== "Appointment") {
      return base;
    }

    return this.normalizeAppointmentParticipantDisplays(base);
  }

  private normalizeAppointmentParticipantDisplays(
    appointment: JsonObject,
  ): StoredResource {
    const resourceType = this.readString(appointment.resourceType) || "Appointment";
    const participants = appointment.participant;
    if (!Array.isArray(participants)) {
      return {
        ...appointment,
        resourceType,
      };
    }

    const normalizedParticipants = participants.map((participant) => {
      if (!this.isJsonObject(participant)) {
        return participant;
      }

      const actorValue = participant.actor;
      if (!this.isJsonObject(actorValue)) {
        return participant;
      }

      const canonicalDisplay = this.resolveParticipantActorDisplay(actorValue);
      if (!canonicalDisplay) {
        return participant;
      }

      return {
        ...participant,
        actor: {
          ...actorValue,
          display: canonicalDisplay,
        },
      };
    });

    return {
      ...appointment,
      resourceType,
      participant: normalizedParticipants,
    };
  }

  private resolveParticipantActorDisplay(actor: JsonObject): string | null {
    const reference = this.readString(actor.reference);
    const { resourceType, id } = this.parseReference(reference);

    if (resourceType === "Patient" && id) {
      const patient = DataService.findById<FHIRPersonResource>("Patient", id);
      const display = this.buildPatientDisplay(patient);
      if (display) {
        return display;
      }
    }

    if (resourceType === "Practitioner" && id) {
      const practitioner = DataService.findById<FHIRPersonResource>(
        "Practitioner",
        id,
      );
      const display = this.buildPractitionerDisplay(practitioner);
      if (display) {
        return display;
      }
    }

    const actorIdentifier = this.readIdentifier(actor.identifier);
    if (!actorIdentifier) {
      return null;
    }

    if (resourceType === "Patient" || resourceType === "") {
      const patient = this.findByIdentifier("Patient", actorIdentifier);
      const display = this.buildPatientDisplay(patient);
      if (display) {
        return display;
      }
    }

    if (resourceType === "Practitioner" || resourceType === "") {
      const practitioner = this.findByIdentifier(
        "Practitioner",
        actorIdentifier,
      );
      const display = this.buildPractitionerDisplay(practitioner);
      if (display) {
        return display;
      }
    }

    return null;
  }

  private findByIdentifier(
    resourceType: "Patient" | "Practitioner",
    identifier: Identifier,
  ): FHIRPersonResource | null {
    const people = DataService.findAll<FHIRPersonResource>(resourceType);
    return (
      people.find((person) =>
        person.identifier?.some(
          (item) =>
            typeof item.system === "string" &&
            item.system.length > 0 &&
            item.value === identifier.value &&
            this.systemsMatch(item.system, identifier.system),
        ),
      ) || null
    );
  }

  private buildPatientDisplay(patient: FHIRPersonResource | null): string {
    if (!patient?.name?.[0]) {
      return "";
    }
    const firstName = patient.name[0].given?.join(" ") || "";
    const familyName = patient.name[0].family || "";
    return `${firstName} ${familyName}`.trim();
  }

  private buildPractitionerDisplay(
    practitioner: FHIRPersonResource | null,
  ): string {
    if (!practitioner?.name?.[0]) {
      return "";
    }
    const prefix = practitioner.name[0].prefix?.[0] || "";
    const given = practitioner.name[0].given?.join(" ") || "";
    const family = practitioner.name[0].family || "";
    return `${prefix} ${given} ${family}`.trim();
  }

  private parseReference(
    reference: string,
  ): { resourceType: "Patient" | "Practitioner" | ""; id: string } {
    if (!reference) {
      return { resourceType: "", id: "" };
    }

    const [rawType, rawId] = reference.split("/");
    const id = rawId?.trim() || "";

    if (rawType === "Patient") {
      return { resourceType: "Patient", id };
    }
    if (rawType === "Practitioner") {
      return { resourceType: "Practitioner", id };
    }

    return { resourceType: "", id: "" };
  }

  private readIdentifier(value: JsonValue | undefined): Identifier | null {
    if (!value || !this.isJsonObject(value)) {
      return null;
    }

    const system = this.readString(value.system);
    const identifierValue = this.readString(value.value);
    if (!system || !identifierValue) {
      return null;
    }

    return { system, value: identifierValue };
  }

  private readString(value: JsonValue | undefined): string {
    return typeof value === "string" ? value.trim() : "";
  }

  /**
   * Normalizes PhilHealth identifier system URLs to handle multiple formats.
   * Supports both shortened and full FHIR-compliant URLs.
   */
  private normalizePhilHealthSystem(system: string): string {
    if (system.includes("philhealth.gov.ph")) {
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

  async findPatientByIdentifiers(
    identifiers: Identifier[],
  ): Promise<any | null> {
    const patients = DataService.findAll<any>("Patient");

    // Search for patient by PhilHealth ID first (priority)
    for (const id of identifiers) {
      const normalizedSystem = this.normalizePhilHealthSystem(id.system);

      if (
        normalizedSystem ===
        "http://philhealth.gov.ph/fhir/Identifier/philhealth-id"
      ) {
        const found = patients.find((p) =>
          p.identifier?.some(
            (identifier: any) =>
              this.systemsMatch(identifier.system, id.system) &&
              identifier.value === id.value,
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
            this.systemsMatch(identifier.system, id.system) &&
            identifier.value === id.value,
        ),
      );
      if (found) return found;
    }

    return null;
  }

  private getPatientReferences(patientId: string): Set<string> {
    return new Set([`Patient/${patientId}`, `patient/${patientId}`, patientId]);
  }

  private matchesPatientReference(
    reference: unknown,
    patientReferences: Set<string>,
  ): boolean {
    return typeof reference === "string" && patientReferences.has(reference);
  }

  private matchesPatientParticipant(
    resource: any,
    patientReferences: Set<string>,
  ): boolean {
    if (!Array.isArray(resource?.participant)) {
      return false;
    }

    return resource.participant.some(
      (participant: any) =>
        this.matchesPatientReference(
          participant?.actor?.reference,
          patientReferences,
        ) ||
        this.matchesPatientReference(
          participant?.individual?.reference,
          patientReferences,
        ),
    );
  }

  async findResourcesByPatient(
    resourceType: string | undefined,
    patientId: string,
  ): Promise<any[]> {
    const requestedResourceType = resourceType?.trim() || "Patient";

    if (requestedResourceType === "Patient") {
      const patient = DataService.findById<any>("Patient", patientId);
      return patient ? [patient] : [];
    }

    const resources = DataService.findAll<any>(requestedResourceType);
    const patientReferences = this.getPatientReferences(patientId);

    return resources.filter(
      (resource: any) =>
        this.matchesPatientReference(
          resource?.subject?.reference,
          patientReferences,
        ) ||
        this.matchesPatientReference(
          resource?.patient?.reference,
          patientReferences,
        ) ||
        this.matchesPatientReference(
          resource?.beneficiary?.reference,
          patientReferences,
        ) ||
        this.matchesPatientParticipant(resource, patientReferences),
    );
  }
}

export const IntegrationService = new IntegrationServiceClass();
