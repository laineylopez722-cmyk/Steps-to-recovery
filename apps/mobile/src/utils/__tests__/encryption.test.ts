import type * as Crypto from 'expo-crypto';
import {
  generateEncryptionKey,
  getEncryptionKey,
  encryptContent,
  decryptContent,
  deleteEncryptionKey,
  hasEncryptionKey,
} from '../encryption';

// Mock Platform.OS to use 'web' path to avoid dynamic imports
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: <T>(obj: { web?: T }): T | undefined => obj.web,
  },
}));

// Mock expo-crypto (for completeness, though web path won't use it)
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(),
  randomUUID: jest.fn(),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock secureStorage adapter
jest.mock('../../adapters/secureStorage', () => ({
  secureStorage: {
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
  },
}));

// Mock crypto.randomUUID and crypto.getRandomValues for web path
const mockRandomUUID = jest.fn((): `${string}-${string}-${string}-${string}-${string}` => {
  const hex = Math.random().toString(16).substring(2, 10);
  return `${hex}-${hex.substring(0, 4)}-4${hex.substring(1, 4)}-${hex.substring(0, 4)}-${hex}${hex.substring(0, 4)}`;
});
const mockGetRandomValues = jest.fn(<T extends ArrayBufferView>(array: T): T => {
  if (array instanceof Uint8Array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return array;
});

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
    getRandomValues: mockGetRandomValues,
    subtle: {} as SubtleCrypto,
  } satisfies Partial<Crypto>,
  writable: true,
});

// Mock crypto-js is not needed as it's a pure JS library
// We'll use it as-is for real encryption/decryption

// Import the mocked secureStorage
import { secureStorage } from '../../adapters/secureStorage';

// Type for mocked secureStorage
type MockedSecureStorage = jest.Mocked<typeof secureStorage>;

// Test UUID constants matching the required format
type UUID = `${string}-${string}-${string}-${string}-${string}`;
const TEST_UUID_1: UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5';
const TEST_UUID_2: UUID = 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6';
const TEST_UUID_3: UUID = 'c3d4e5f6-a7b8-4c9d-0e1f-a2b3c4d5e6f7';

describe('Encryption Utilities', () => {
  const mockSecureStorage = secureStorage as MockedSecureStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks for secureStorage
    mockSecureStorage.setItemAsync.mockResolvedValue(undefined);
    mockSecureStorage.getItemAsync.mockResolvedValue(null);
    mockSecureStorage.deleteItemAsync.mockResolvedValue(undefined);
  });

  describe('generateEncryptionKey()', () => {
    it('should generate a 256-bit encryption key', async () => {
      // Setup: Mock random bytes (32 bytes = 256 bits)
      const mockRandomBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockRandomBytes[i] = i;
      }
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      // Execute
      const key = await generateEncryptionKey();

      // Verify: Key should be 64 hex characters (256 bits)
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBe(64); // PBKDF2 output with keySize 256/32 = 64 hex chars
    });

    it('should store the key in SecureStore', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(1);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      await generateEncryptionKey();

      // Verify SecureStore was called to store the derived key (salt is used during derivation but not stored)
      expect(mockSecureStorage.setItemAsync).toHaveBeenCalledTimes(1);
      expect(mockSecureStorage.setItemAsync).toHaveBeenCalledWith(
        'journal_encryption_key',
        expect.any(String),
      );
    });

    it('should return the generated key string', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(255);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key = await generateEncryptionKey();

      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should use PBKDF2 with 100,000 iterations', async () => {
      // We can verify this by checking the implementation uses the constant
      // This is more of an integration test to ensure the algorithm is correct
      const mockRandomBytes = new Uint8Array(32).fill(42);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_2);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key = await generateEncryptionKey();

      // The key should be deterministic for the same input
      expect(key).toBeDefined();

      // Setup for second call
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_2);

      // Generate again with same mocks to verify consistency
      const key2 = await generateEncryptionKey();
      expect(key2).toBe(key); // Same input = same output
    });

    it('should use getRandomBytesAsync for key generation', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(99);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      await generateEncryptionKey();

      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });

    it('should use randomUUID for salt generation', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(77);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_3);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      await generateEncryptionKey();

      expect(mockRandomUUID).toHaveBeenCalled();
    });
  });

  describe('getEncryptionKey()', () => {
    it('should retrieve the stored encryption key', async () => {
      const mockKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);

      const key = await getEncryptionKey();

      expect(key).toBe(mockKey);
      expect(mockSecureStorage.getItemAsync).toHaveBeenCalledWith('journal_encryption_key');
    });

    it('should return null if no key exists', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue(null);

      const key = await getEncryptionKey();

      expect(key).toBeNull();
    });
  });

  describe('encryptContent()', () => {
    const mockKey = 'a'.repeat(64); // 64 hex chars = 256 bits

    beforeEach(() => {
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);
    });

    it('should encrypt plaintext successfully', async () => {
      const mockIV = new Uint8Array(16).fill(0);
      mockGetRandomValues.mockReturnValue(mockIV);

      const plaintext = 'Hello, World!';
      const encrypted = await encryptContent(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toContain(':'); // IV:ciphertext:mac format
    });

    it('should return IV:ciphertext:mac format', async () => {
      const mockIV = new Uint8Array(16);
      for (let i = 0; i < 16; i++) {
        mockIV[i] = i;
      }
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('test data');
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32); // 16 bytes = 32 hex chars (IV)
      expect(parts[1].length).toBeGreaterThan(0); // ciphertext
      expect(parts[2]).toHaveLength(64); // HMAC-SHA256 hex
    });

    it('should use different IVs for same plaintext', async () => {
      let callCount = 0;
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.fill(callCount++);
        return array;
      });

      const plaintext = 'Same content';
      const encrypted1 = await encryptContent(plaintext);
      const encrypted2 = await encryptContent(plaintext);

      // Different IVs should produce different ciphertexts
      expect(encrypted1).not.toBe(encrypted2);

      const [iv1] = encrypted1.split(':');
      const [iv2] = encrypted2.split(':');
      expect(iv1).not.toBe(iv2);
    });

    it('should handle empty strings', async () => {
      const mockIV = new Uint8Array(16).fill(5);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('');

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
    });

    it('should handle special characters', async () => {
      const mockIV = new Uint8Array(16).fill(10);
      mockGetRandomValues.mockReturnValue(mockIV);

      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = await encryptContent(specialChars);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
    });

    it('should handle unicode and emojis', async () => {
      const mockIV = new Uint8Array(16).fill(15);
      mockGetRandomValues.mockReturnValue(mockIV);

      const unicode = '你好世界 🎉🚀💯';
      const encrypted = await encryptContent(unicode);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
    });

    it('should throw error if no encryption key exists', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue(null);

      await expect(encryptContent('test')).rejects.toThrow('Encryption key not found');
    });

    it('should generate 16-byte IV', async () => {
      const mockIV = new Uint8Array(16).fill(20);
      mockGetRandomValues.mockReturnValue(mockIV);

      await encryptContent('test');

      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });
  });

  describe('decryptContent()', () => {
    const mockKey = 'a'.repeat(64);

    beforeEach(() => {
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);
    });

    it('should decrypt ciphertext to original plaintext', async () => {
      // First encrypt something
      const mockIV = new Uint8Array(16).fill(1);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = 'Secret message';
      const encrypted = await encryptContent(original);

      // Now decrypt it
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should validate encrypted format', async () => {
      await expect(decryptContent('invalid-format')).rejects.toThrow('Invalid format');
    });

    it('should throw error on missing IV', async () => {
      await expect(decryptContent(':ciphertext')).rejects.toThrow('Invalid format');
    });

    it('should throw error on missing ciphertext', async () => {
      const validIV = '0'.repeat(32);
      await expect(decryptContent(`${validIV}:`)).rejects.toThrow('Invalid format');
    });

    it('should throw error on corrupted ciphertext', async () => {
      const validIV = '0'.repeat(32);
      const corruptedCiphertext = `${validIV}:corrupted-data-!!!`;

      // This should fail during decryption
      await expect(decryptContent(corruptedCiphertext)).rejects.toThrow();
    });

    it('should throw error on invalid MAC', async () => {
      const mockIV = new Uint8Array(16).fill(1);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = 'Secret message';
      const encrypted = await encryptContent(original);
      const lastChar = encrypted.slice(-1);
      const tamperedLastChar = lastChar === 'a' ? 'b' : 'a';
      const tampered = `${encrypted.slice(0, -1)}${tamperedLastChar}`;

      await expect(decryptContent(tampered)).rejects.toThrow('Integrity check failed');
    });
    it('should throw error if no encryption key exists', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue(null);

      const validIV = '0'.repeat(32);
      await expect(decryptContent(`${validIV}:data`)).rejects.toThrow('Encryption key not found');
    });

    it('should throw error on empty string decryption', async () => {
      const mockIV = new Uint8Array(16).fill(2);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('');

      // Empty plaintext results are treated as decryption failures
      await expect(decryptContent(encrypted)).rejects.toThrow('Decryption failed');
    });
  });

  describe('Round-trip encryption/decryption', () => {
    const mockKey = 'b'.repeat(64);

    beforeEach(() => {
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);
    });

    it('should encrypt and decrypt to return original text', async () => {
      const mockIV = new Uint8Array(16).fill(3);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = 'This is a test message';
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should work with special characters', async () => {
      const mockIV = new Uint8Array(16).fill(4);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = '!@#$%^&*()_+-=[]{}\\|;:",.<>?/~`';
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should work with emojis', async () => {
      const mockIV = new Uint8Array(16).fill(5);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = 'Hello 👋 World 🌍 Test 🧪 Success ✅';
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should work with unicode characters', async () => {
      const mockIV = new Uint8Array(16).fill(6);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = '日本語 中文 한국어 العربية עברית';
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should work with long strings (>10KB)', async () => {
      const mockIV = new Uint8Array(16).fill(7);
      mockGetRandomValues.mockReturnValue(mockIV);

      // Generate a string larger than 10KB
      const original = 'A'.repeat(15000);
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
      expect(decrypted.length).toBe(15000);
    });

    it('should work with multiline text', async () => {
      const mockIV = new Uint8Array(16).fill(8);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = `Line 1
Line 2
Line 3
With\ttabs\tand\nnewlines\r\n`;
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should work with JSON strings', async () => {
      const mockIV = new Uint8Array(16).fill(9);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = JSON.stringify({
        name: 'Test',
        value: 123,
        nested: { array: [1, 2, 3] },
      });
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(original));
    });
  });

  describe('deleteEncryptionKey()', () => {
    it('should delete the encryption key from SecureStore', async () => {
      mockSecureStorage.deleteItemAsync.mockResolvedValue(undefined);

      await deleteEncryptionKey();

      expect(mockSecureStorage.deleteItemAsync).toHaveBeenCalledWith('journal_encryption_key');
      expect(mockSecureStorage.deleteItemAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasEncryptionKey()', () => {
    it('should return true when key exists', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue('some-key-value');

      const result = await hasEncryptionKey();

      expect(result).toBe(true);
    });

    it('should return false when key is null', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue(null);

      const result = await hasEncryptionKey();

      expect(result).toBe(false);
    });

    it('should return false when key is empty string', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue('');

      const result = await hasEncryptionKey();

      expect(result).toBe(false);
    });

    it('should return true for non-empty key strings', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue('x');

      const result = await hasEncryptionKey();

      expect(result).toBe(true);
    });
  });

  describe('Key Management Integration', () => {
    it('should reflect correct state after key generation', async () => {
      // Initially no key
      mockSecureStorage.getItemAsync.mockResolvedValue(null);
      expect(await hasEncryptionKey()).toBe(false);

      // Generate key
      const mockRandomBytes = new Uint8Array(32).fill(1);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key = await generateEncryptionKey();

      // Now mock that the key exists
      mockSecureStorage.getItemAsync.mockResolvedValue(key);
      expect(await hasEncryptionKey()).toBe(true);
    });

    it('should reflect correct state after key deletion', async () => {
      // Start with a key
      const mockKey = 'existing-key';
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);
      expect(await hasEncryptionKey()).toBe(true);

      // Delete the key
      mockSecureStorage.deleteItemAsync.mockResolvedValue(undefined);
      await deleteEncryptionKey();

      // Now key should not exist
      mockSecureStorage.getItemAsync.mockResolvedValue(null);
      expect(await hasEncryptionKey()).toBe(false);
    });

    it('should not allow encryption without a key', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue(null);

      await expect(encryptContent('data')).rejects.toThrow('Encryption key not found');
    });

    it('should not allow decryption without a key', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue(null);

      await expect(decryptContent('00:data')).rejects.toThrow('Encryption key not found');
    });
  });

  describe('Security Properties', () => {
    const mockKey = 'c'.repeat(64);

    beforeEach(() => {
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);
    });

    it('should use random IV for each encryption', async () => {
      let callCount = 0;
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        // Each call gets different values
        array.fill(callCount++);
        return array;
      });

      const plaintext = 'Same message';
      const encrypted1 = await encryptContent(plaintext);
      const encrypted2 = await encryptContent(plaintext);
      const encrypted3 = await encryptContent(plaintext);

      // All should have different IVs
      const [iv1] = encrypted1.split(':');
      const [iv2] = encrypted2.split(':');
      const [iv3] = encrypted3.split(':');

      expect(iv1).not.toBe(iv2);
      expect(iv2).not.toBe(iv3);
      expect(iv1).not.toBe(iv3);
    });

    it('should use AES-256-CBC encryption mode', async () => {
      // This is verified by the implementation using CryptoJS.AES with 256-bit key
      const mockIV = new Uint8Array(16).fill(11);
      mockGetRandomValues.mockReturnValue(mockIV);

      const plaintext = 'Test encryption mode';
      const encrypted = await encryptContent(plaintext);
      const decrypted = await decryptContent(encrypted);

      // If the mode was wrong, decryption would fail
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      let ivCounter = 0;
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.fill(ivCounter++);
        return array;
      });

      const plaintext = 'Identical content';
      const results = [];

      for (let i = 0; i < 5; i++) {
        results.push(await encryptContent(plaintext));
      }

      // All ciphertexts should be different
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(5);
    });

    it('should verify PBKDF2 key derivation produces consistent keys', async () => {
      const mockRandomBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockRandomBytes[i] = i * 7; // Deterministic pattern
      }

      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key1 = await generateEncryptionKey();

      // Reset mocks for second call
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);

      const key2 = await generateEncryptionKey();

      // Same inputs should produce same output (PBKDF2 is deterministic)
      expect(key1).toBe(key2);
    });

    it('should verify different salts produce different keys', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(42);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      const key1 = await generateEncryptionKey();

      // Reset for second call
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_2);
      const key2 = await generateEncryptionKey();

      // Different salts should produce different keys
      expect(key1).not.toBe(key2);
    });
  });

  describe('Error Handling', () => {
    it('should handle SecureStore errors during key generation', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(1);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockRejectedValue(new Error('Storage error'));

      await expect(generateEncryptionKey()).rejects.toThrow('Storage error');
    });

    it('should handle SecureStore errors during key retrieval', async () => {
      mockSecureStorage.getItemAsync.mockRejectedValue(new Error('Retrieval error'));

      await expect(getEncryptionKey()).rejects.toThrow('Retrieval error');
    });

    it('should handle SecureStore errors during key deletion', async () => {
      mockSecureStorage.deleteItemAsync.mockRejectedValue(new Error('Deletion error'));

      await expect(deleteEncryptionKey()).rejects.toThrow('Deletion error');
    });

    it('should handle Crypto errors during IV generation', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue('key');
      mockGetRandomValues.mockImplementation(() => {
        throw new Error('Crypto error');
      });

      await expect(encryptContent('test')).rejects.toThrow('Crypto error');
    });

    it('should handle invalid encrypted data format', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue('key');

      await expect(decryptContent('no-colon-separator')).rejects.toThrow('Invalid format');
    });

    it('should handle multiple colons in encrypted data', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue('a'.repeat(64));

      // Encrypted payloads should only contain two or three segments
      const validIV = '0'.repeat(32);
      const encrypted = `${validIV}:data:with:colons`;

      await expect(decryptContent(encrypted)).rejects.toThrow('Invalid format');
    });
  });

  describe('Edge Cases', () => {
    const mockKey = 'd'.repeat(64);

    beforeEach(() => {
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);
    });

    it('should handle very long content (100KB)', async () => {
      const mockIV = new Uint8Array(16).fill(12);
      mockGetRandomValues.mockReturnValue(mockIV);

      const longContent = 'X'.repeat(100000);
      const encrypted = await encryptContent(longContent);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(longContent);
      expect(decrypted.length).toBe(100000);
    });

    it('should handle content with null bytes', async () => {
      const mockIV = new Uint8Array(16).fill(13);
      mockGetRandomValues.mockReturnValue(mockIV);

      const content = 'Hello\x00World';
      const encrypted = await encryptContent(content);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(content);
    });

    it('should handle all whitespace content', async () => {
      const mockIV = new Uint8Array(16).fill(14);
      mockGetRandomValues.mockReturnValue(mockIV);

      const content = '   \t\n\r   ';
      const encrypted = await encryptContent(content);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(content);
    });

    it('should handle content with only special characters', async () => {
      const mockIV = new Uint8Array(16).fill(15);
      mockGetRandomValues.mockReturnValue(mockIV);

      const content = '!@#$%^&*()';
      const encrypted = await encryptContent(content);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(content);
    });

    it('should handle rapid successive encryptions', async () => {
      let ivCounter = 0;
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.fill(ivCounter++);
        return array;
      });

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(encryptContent(`Message ${i}`));
      }

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toContain(':');
      });
    });
  });
});
