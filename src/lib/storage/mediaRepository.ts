/**
 * IndexedDB Media Repository
 * Stores uploaded/pasted images offline directly in browser IndexedDB,
 * completely bypassing localStorage 5MB quota constraints.
 */

const DB_NAME = "quill_media_db";
const STORE_NAME = "images";
const DB_VERSION = 1;

export interface MediaRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open media database"));
  });
}

// In-memory cache for created object URLs to prevent creating duplicate blob URLs
const objectUrlCache = new Map<string, string>();

export const mediaRepository = {
  /**
   * Save a file or blob to IndexedDB
   * Returns a custom URI scheme: `quill-media://<id>`
   */
  async saveImage(file: Blob | File, filename = "image"): Promise<{ id: string; uri: string }> {
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record: MediaRecord = {
      id,
      name: filename,
      type: file.type || "image/png",
      size: file.size,
      blob: file,
      createdAt: Date.now(),
    };

    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    const uri = `quill-media://${id}`;
    // Pre-cache object URL
    const objectUrl = URL.createObjectURL(file);
    objectUrlCache.set(id, objectUrl);

    return { id, uri };
  },

  /**
   * Retrieve raw image Blob by ID
   */
  async getImageBlob(id: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const record = req.result as MediaRecord | undefined;
        resolve(record ? record.blob : null);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Resolves any image `src` string:
   * - If `quill-media://<id>`, resolves to a browser `blob:` Object URL.
   * - Otherwise returns the `src` untouched (for data: or https:).
   */
  async resolveMediaUrl(src: string): Promise<string> {
    if (!src.startsWith("quill-media://")) {
      return src;
    }

    const id = src.replace("quill-media://", "").trim();
    if (objectUrlCache.has(id)) {
      return objectUrlCache.get(id)!;
    }

    const blob = await this.getImageBlob(id);
    if (!blob) {
      return "";
    }

    const objectUrl = URL.createObjectURL(blob);
    objectUrlCache.set(id, objectUrl);
    return objectUrl;
  },

  /**
   * Delete an image from IndexedDB
   */
  async deleteImage(id: string): Promise<void> {
    if (objectUrlCache.has(id)) {
      URL.revokeObjectURL(objectUrlCache.get(id)!);
      objectUrlCache.delete(id);
    }
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
};
