import fs from 'fs';
import path from 'path';

const RESOURCES_DIR = path.join(process.cwd(), 'resources');

export function getResourcePath(filename: string): string {
  return path.join(RESOURCES_DIR, filename);
}

export function readJsonResource(filename: string): any {
  try {
    const filePath = getResourcePath(filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`Resource file not found: ${filename}`);
      return null;
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading resource ${filename}:`, error);
    return null;
  }
}