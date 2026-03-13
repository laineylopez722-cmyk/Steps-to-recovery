/**
 * @deprecated Use `generateId` from `./id` instead.
 * This module wraps the `uuid` library; prefer the crypto-first `generateId`
 * which avoids the extra dependency when `crypto.randomUUID` is available.
 */
import { v4 as uuidv4 } from 'uuid';

/** @deprecated Use `generateId` from `./id` instead. */
export function generateUUID(): string {
  return uuidv4();
}

/** @deprecated Use `generateId` from `./id` instead. */


export { v4 as uuid } from 'uuid';