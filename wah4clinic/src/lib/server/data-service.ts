import fs from "node:fs";
import path from "node:path";

interface ResourceRecord {
  resourceType: string;
  id?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

interface DataStore<T> {
  data: T[];
  meta: {
    lastUpdated: string;
    count: number;
  };
}

class DataServiceClass {
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

  private getFilePath(resourceType: string): string {
    return path.join(this.dataPath, `${resourceType.toLowerCase()}.json`);
  }

  private readStore<T>(resourceType: string): DataStore<T> {
    const filePath = this.getFilePath(resourceType);

    if (!fs.existsSync(filePath)) {
      return {
        data: [],
        meta: {
          lastUpdated: new Date().toISOString(),
          count: 0,
        },
      };
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent) as DataStore<T>;
  }

  private writeStore<T>(resourceType: string, store: DataStore<T>): void {
    const filePath = this.getFilePath(resourceType);
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
  }

  create<T extends ResourceRecord>(resource: T): T {
    const resourceType = resource.resourceType;
    const store = this.readStore<T>(resourceType);

    const now = new Date().toISOString();
    const resourceWithMeta = {
      ...resource,
      meta: {
        ...resource.meta,
        lastUpdated: now,
      },
    };

    store.data.push(resourceWithMeta);
    store.meta.lastUpdated = now;
    store.meta.count = store.data.length;

    this.writeStore(resourceType, store);

    return resourceWithMeta;
  }

  findAll<T>(resourceType: string): T[] {
    const store = this.readStore<T>(resourceType);
    return store.data;
  }

  findById<T extends ResourceRecord>(
    resourceType: string,
    id: string,
  ): T | null {
    const store = this.readStore<T>(resourceType);
    const resource = store.data.find(
      (item) => (item as ResourceRecord).id === id,
    );
    return resource ? (resource as T) : null;
  }

  update<T extends ResourceRecord>(resource: T): T | null {
    const resourceType = resource.resourceType;
    const store = this.readStore<T>(resourceType);

    const index = store.data.findIndex(
      (item) => (item as ResourceRecord).id === resource.id,
    );

    if (index === -1) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedResource = {
      ...resource,
      meta: {
        ...resource.meta,
        lastUpdated: now,
      },
    };

    store.data[index] = updatedResource;
    store.meta.lastUpdated = now;

    this.writeStore(resourceType, store);

    return updatedResource;
  }

  delete(resourceType: string, id: string): boolean {
    const store = this.readStore<ResourceRecord>(resourceType);

    const index = store.data.findIndex((item) => item.id === id);

    if (index === -1) {
      return false;
    }

    store.data.splice(index, 1);
    store.meta.lastUpdated = new Date().toISOString();
    store.meta.count = store.data.length;

    this.writeStore(resourceType, store);

    return true;
  }
}

export const DataService = new DataServiceClass();
