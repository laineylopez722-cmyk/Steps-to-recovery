/**
 * Platform-agnostic synchronous key-value storage interface.
 */
export interface KVStorePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  getAllKeys(): string[];
  multiSet(pairs: [string, string][]): void;
  multiRemove(keys: string[]): void;
}
