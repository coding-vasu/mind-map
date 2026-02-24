import { type StateStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';

/**
 * IndexedDB storage adapter for Zustand persistence
 * Uses idb-keyval for a simple promise-based API
 */
export const idbStorage: StateStorage = {
  /**
   * Retrieve an item from IndexedDB
   * @param name - The key to retrieve
   * @returns The value as a string, or null if not found
   */
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },

  /**
   * Save an item to IndexedDB
   * @param name - The key to save under
   * @param value - The stringified value to save
   */
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },

  /**
   * Remove an item from IndexedDB
   * @param name - The key to remove
   */
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
