"use client";

const DB_NAME = "wah4pc-dashboard-cache";
const DB_VERSION = 1;
const STORE_NAME = "kv_cache";

interface CacheRecord<T> {
  key: string;
  value: T;
  updatedAt: number;
  expiresAt: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("indexeddb unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("failed to open indexeddb"));
  });
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
  if (!isBrowser()) return null;

  const db = await openDB();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const record = request.result as CacheRecord<T> | undefined;
        if (!record) {
          resolve(null);
          return;
        }
        if (Date.now() > record.expiresAt) {
          resolve(null);
          return;
        }
        resolve(record.value);
      };
      request.onerror = () => reject(request.error ?? new Error("failed to read cache"));
    });
  } finally {
    db.close();
  }
}

export async function setCachedValue<T>(key: string, value: T, ttlMs: number): Promise<void> {
  if (!isBrowser()) return;

  const now = Date.now();
  const record: CacheRecord<T> = {
    key,
    value,
    updatedAt: now,
    expiresAt: now + ttlMs,
  };

  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("failed to write cache"));
    });
  } finally {
    db.close();
  }
}

export async function clearCachedValues(): Promise<void> {
  if (!isBrowser()) return;

  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("failed to clear cache"));
    });
  } finally {
    db.close();
  }
}
