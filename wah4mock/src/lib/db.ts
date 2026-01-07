/**
 * JSON File-Based Database Service
 * Handles CRUD operations for FHIR resources stored in data/*.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Resource, FHIRResourceType } from './types/fhir';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Get file path for a resource type
function getFilePath(resourceType: string): string {
  return path.join(DATA_DIR, `${resourceType}.json`);
}

// Initialize empty file if it doesn't exist
async function ensureFile(resourceType: string): Promise<void> {
  await ensureDataDir();
  const filePath = getFilePath(resourceType);
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]', 'utf-8');
  }
}

/**
 * Read all resources of a given type
 */
export async function readResources<T extends Resource>(
  resourceType: FHIRResourceType
): Promise<T[]> {
  await ensureFile(resourceType);
  const filePath = getFilePath(resourceType);
  const data = await fs.readFile(filePath, 'utf-8');
  try {
    return JSON.parse(data) as T[];
  } catch {
    return [];
  }
}

/**
 * Write all resources of a given type
 */
export async function writeResources<T extends Resource>(
  resourceType: FHIRResourceType,
  resources: T[]
): Promise<void> {
  await ensureDataDir();
  const filePath = getFilePath(resourceType);
  await fs.writeFile(filePath, JSON.stringify(resources, null, 2), 'utf-8');
}

/**
 * Get all resources
 */
export async function getAll<T extends Resource>(
  resourceType: FHIRResourceType
): Promise<T[]> {
  return readResources<T>(resourceType);
}

/**
 * Get a single resource by ID
 */
export async function getById<T extends Resource>(
  resourceType: FHIRResourceType,
  id: string
): Promise<T | null> {
  const resources = await readResources<T>(resourceType);
  return resources.find((r) => r.id === id) || null;
}

/**
 * Create a new resource
 */
export async function create<T extends Resource>(
  resourceType: FHIRResourceType,
  resource: T
): Promise<T> {
  const resources = await readResources<T>(resourceType);
  
  // Update meta
  const now = new Date().toISOString();
  resource.meta = {
    ...resource.meta,
    lastUpdated: now,
    versionId: '1',
  };
  
  resources.push(resource);
  await writeResources(resourceType, resources);
  return resource;
}

/**
 * Update an existing resource
 */
export async function update<T extends Resource>(
  resourceType: FHIRResourceType,
  id: string,
  resource: T
): Promise<T | null> {
  const resources = await readResources<T>(resourceType);
  const index = resources.findIndex((r) => r.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // Increment version and update timestamp
  const currentVersion = parseInt(resources[index].meta?.versionId || '1', 10);
  resource.meta = {
    ...resource.meta,
    lastUpdated: new Date().toISOString(),
    versionId: String(currentVersion + 1),
  };
  
  resources[index] = resource;
  await writeResources(resourceType, resources);
  return resource;
}

/**
 * Delete a resource by ID
 */
export async function remove<T extends Resource>(
  resourceType: FHIRResourceType,
  id: string
): Promise<boolean> {
  const resources = await readResources<T>(resourceType);
  const index = resources.findIndex((r) => r.id === id);
  
  if (index === -1) {
    return false;
  }
  
  resources.splice(index, 1);
  await writeResources(resourceType, resources);
  return true;
}

/**
 * Search resources with simple filters
 */
export async function search<T extends Resource>(
  resourceType: FHIRResourceType,
  params: Record<string, string>
): Promise<T[]> {
  const resources = await readResources<T>(resourceType);
  
  if (Object.keys(params).length === 0) {
    return resources;
  }
  
  return resources.filter((resource) => {
    return Object.entries(params).every(([key, value]) => {
      // Handle nested paths like "name.family"
      const keys = key.split('.');
      let current: unknown = resource;
      
      for (const k of keys) {
        if (current === null || current === undefined) {
          return false;
        }
        if (typeof current === 'object') {
          current = (current as Record<string, unknown>)[k];
        }
      }
      
      if (Array.isArray(current)) {
        return current.some((item) =>
          String(item).toLowerCase().includes(value.toLowerCase())
        );
      }
      
      return String(current).toLowerCase().includes(value.toLowerCase());
    });
  });
}

/**
 * Count resources of a given type
 */
export async function count(resourceType: FHIRResourceType): Promise<number> {
  const resources = await readResources(resourceType);
  return resources.length;
}

/**
 * Database service object for convenient access
 */
export const db = {
  getAll,
  getById,
  create,
  update,
  remove,
  search,
  count,
  readResources,
  writeResources,
};

export default db;