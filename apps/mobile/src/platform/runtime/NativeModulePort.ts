/**
 * Shared runtime abstraction for optional native module loading.
 * Keeps module import failures isolated behind a single interface.
 */
export interface NativeModulePort {
  loadOptional<T>(loader: () => T): T | null;
}

export const nativeModulePort: NativeModulePort = {
  loadOptional<T>(loader: () => T): T | null {
    try {
      return loader();
    } catch {
      return null;
    }
  },
};
