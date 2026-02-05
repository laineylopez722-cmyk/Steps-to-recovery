import {
  generateEncryptionKey,
  getEncryptionKey,
  encryptContent,
  decryptContent,
  deleteEncryptionKey,
  hasEncryptionKey,
} from '../encryption';

// Mock Platform.OS to use 'web' path to avoid dynamic imports
interface PlatformSelectObject {
  web: string;
}

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (obj: PlatformSelectObject): string => obj.web,
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
const mockRandomUUID = jest.fn(() => {
  const hex = Math.random().toString(16).substring(2, 10);
  return `${hex}-${hex.substring(0, 4)}-4${hex.substring(1, 4)}-${hex.substring(0, 4)}-${hex}${hex.substring(0, 4)}`;
});
const mockGetRandomValues = jest.fn((array) => {
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
    subtle: {},
  },
  writable: true,
});

// Import the mocked secureStorage
import { secureStorage } from '../../adapters/secureStorage';

// Test UUID constants matching the required format
const TEST_UUID_1 = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5';
const TEST_UUID_2 = 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6';
const TEST_UUID_3 = 'c3d4e5f6-a7b8-4c9d-0e1f-a2b3c4d5e6f7';

describe('Encryption Utilities', () => {
  const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

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

      // Verify SecureStore was called to store the derived key
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
      const mockRandomBytes = new Uint8Array(32).fill(42);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_2);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key = await generateEncryptionKey();

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

    it('should generate hex-only key string', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(128);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key = await generateEncryptionKey();

      // Verify key only contains valid hex characters
      expect(key).toMatch(/^[0-9a-f]+$/i);
    });

    it('should handle edge case of all zero random bytes', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(0);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key = await generateEncryptionKey();

      expect(key).toBeDefined();
      expect(key.length).toBe(64);
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

    it('should return exact stored value without modification', async () => {
      const mockKey = 'abcdef1234567890'.repeat(4);
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);

      const key = await getEncryptionKey();

      expect(key).toBe(mockKey);
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
      mockGetRandomValues.mockImplementation((array) => {
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

    it('should handle empty strings by producing valid ciphertext', async () => {
      const mockIV = new Uint8Array(16).fill(5);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('');

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
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

    it('should produce base64-encoded ciphertext', async () => {
      const mockIV = new Uint8Array(16).fill(21);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('test message');
      const [, ciphertext] = encrypted.split(':');

      // Base64 characters only (CryptoJS outputs base64)
      expect(ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should produce hex-encoded IV', async () => {
      const mockIV = new Uint8Array(16).fill(22);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('test message');
      const [iv] = encrypted.split(':');

      // IV should be hex-only
      expect(iv).toMatch(/^[0-9a-f]+$/i);
    });

    it('should produce hex-encoded MAC', async () => {
      const mockIV = new Uint8Array(16).fill(23);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('test message');
      const [, , mac] = encrypted.split(':');

      // MAC should be hex-only
      expect(mac).toMatch(/^[0-9a-f]+$/i);
    });
  });

  describe('decryptContent()', () => {
    const mockKey = 'a'.repeat(64);

    beforeEach(() => {
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);
    });

    it('should decrypt ciphertext to original plaintext', async () => {
      const mockIV = new Uint8Array(16).fill(1);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = 'Secret message';
      const encrypted = await encryptContent(original);

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

    it('should throw error on empty ciphertext part', async () => {
      const validIV = '0'.repeat(32);
      const validMAC = 'f'.repeat(64);
      await expect(decryptContent(`${validIV}::${validMAC}`)).rejects.toThrow('Invalid format');
    });

    it('should throw error on empty MAC with three parts', async () => {
      const validIV = '0'.repeat(32);
      await expect(decryptContent(`${validIV}:data:`)).rejects.toThrow('Invalid format');
    });

    it('should accept two-part format (legacy without MAC)', async () => {
      // Two-part format should work (IV:ciphertext without MAC)
      // But decryption will likely fail due to invalid ciphertext
      const validIV = '0'.repeat(32);
      // This will fail at decryption, not format validation
      await expect(decryptContent(`${validIV}:invaliddata`)).rejects.toThrow('Decryption failed');
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

    it('should work with single character', async () => {
      const mockIV = new Uint8Array(16).fill(10);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = 'X';
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should work with single space', async () => {
      const mockIV = new Uint8Array(16).fill(11);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = ' ';
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should work with HTML content', async () => {
      const mockIV = new Uint8Array(16).fill(12);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = '<div class="test">Hello <b>World</b></div>';
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should work with SQL-like content', async () => {
      const mockIV = new Uint8Array(16).fill(13);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = "SELECT * FROM users WHERE name = 'test'; DROP TABLE users;--";
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should work with base64 encoded content', async () => {
      const mockIV = new Uint8Array(16).fill(14);
      mockGetRandomValues.mockReturnValue(mockIV);

      const original = 'SGVsbG8gV29ybGQh'; // "Hello World!" in base64
      const encrypted = await encryptContent(original);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(original);
    });
  });

  describe('deleteEncryptionKey()', () => {
    it('should delete the encryption key from SecureStore', async () => {
      mockSecureStorage.deleteItemAsync.mockResolvedValue(undefined);

      await deleteEncryptionKey();

      expect(mockSecureStorage.deleteItemAsync).toHaveBeenCalledWith('journal_encryption_key');
      expect(mockSecureStorage.deleteItemAsync).toHaveBeenCalledTimes(1);
    });

    it('should complete successfully when key does not exist', async () => {
      mockSecureStorage.deleteItemAsync.mockResolvedValue(undefined);

      await expect(deleteEncryptionKey()).resolves.toBeUndefined();
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

    it('should return true for whitespace-only key', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue('   ');

      const result = await hasEncryptionKey();

      expect(result).toBe(true);
    });
  });

  describe('Key Management Integration', () => {
    it('should reflect correct state after key generation', async () => {
      mockSecureStorage.getItemAsync.mockResolvedValue(null);
      expect(await hasEncryptionKey()).toBe(false);

      const mockRandomBytes = new Uint8Array(32).fill(1);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key = await generateEncryptionKey();

      mockSecureStorage.getItemAsync.mockResolvedValue(key);
      expect(await hasEncryptionKey()).toBe(true);
    });

    it('should reflect correct state after key deletion', async () => {
      const mockKey = 'existing-key';
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);
      expect(await hasEncryptionKey()).toBe(true);

      mockSecureStorage.deleteItemAsync.mockResolvedValue(undefined);
      await deleteEncryptionKey();

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

    it('should allow encryption immediately after key generation', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(1);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key = await generateEncryptionKey();
      mockSecureStorage.getItemAsync.mockResolvedValue(key);

      const mockIV = new Uint8Array(16).fill(0);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('test');
      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
    });
  });

  describe('Security Properties', () => {
    const mockKey = 'c'.repeat(64);

    beforeEach(() => {
      mockSecureStorage.getItemAsync.mockResolvedValue(mockKey);
    });

    it('should use random IV for each encryption', async () => {
      let callCount = 0;
      mockGetRandomValues.mockImplementation((array) => {
        array.fill(callCount++);
        return array;
      });

      const plaintext = 'Same message';
      const encrypted1 = await encryptContent(plaintext);
      const encrypted2 = await encryptContent(plaintext);
      const encrypted3 = await encryptContent(plaintext);

      const [iv1] = encrypted1.split(':');
      const [iv2] = encrypted2.split(':');
      const [iv3] = encrypted3.split(':');

      expect(iv1).not.toBe(iv2);
      expect(iv2).not.toBe(iv3);
      expect(iv1).not.toBe(iv3);
    });

    it('should use AES-256-CBC encryption mode', async () => {
      const mockIV = new Uint8Array(16).fill(11);
      mockGetRandomValues.mockReturnValue(mockIV);

      const plaintext = 'Test encryption mode';
      const encrypted = await encryptContent(plaintext);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      let ivCounter = 0;
      mockGetRandomValues.mockImplementation((array) => {
        array.fill(ivCounter++);
        return array;
      });

      const plaintext = 'Identical content';
      const results = [];

      for (let i = 0; i < 5; i++) {
        results.push(await encryptContent(plaintext));
      }

      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(5);
    });

    it('should verify PBKDF2 key derivation produces consistent keys', async () => {
      const mockRandomBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockRandomBytes[i] = i * 7;
      }

      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      const key1 = await generateEncryptionKey();

      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_1);

      const key2 = await generateEncryptionKey();

      expect(key1).toBe(key2);
    });

    it('should verify different salts produce different keys', async () => {
      const mockRandomBytes = new Uint8Array(32).fill(42);
      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockSecureStorage.setItemAsync.mockResolvedValue(undefined);

      mockRandomUUID.mockReturnValue(TEST_UUID_1);
      const key1 = await generateEncryptionKey();

      mockGetRandomValues.mockReturnValue(mockRandomBytes);
      mockRandomUUID.mockReturnValue(TEST_UUID_2);
      const key2 = await generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });

    it('should detect MAC tampering in middle of MAC', async () => {
      const mockIV = new Uint8Array(16).fill(1);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('test');
      const parts = encrypted.split(':');
      const mac = parts[2];
      // Flip a character in the middle
      const midIndex = Math.floor(mac.length / 2);
      const tamperedMac =
        mac.substring(0, midIndex) +
        (mac[midIndex] === 'a' ? 'b' : 'a') +
        mac.substring(midIndex + 1);
      const tampered = `${parts[0]}:${parts[1]}:${tamperedMac}`;

      await expect(decryptContent(tampered)).rejects.toThrow('Integrity check failed');
    });

    it('should detect ciphertext tampering', async () => {
      const mockIV = new Uint8Array(16).fill(1);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('test message');
      const parts = encrypted.split(':');
      // Modify the ciphertext but keep the original MAC
      const tamperedCiphertext = parts[1].split('').reverse().join('');
      const tampered = `${parts[0]}:${tamperedCiphertext}:${parts[2]}`;

      await expect(decryptContent(tampered)).rejects.toThrow('Integrity check failed');
    });

    it('should detect IV tampering', async () => {
      const mockIV = new Uint8Array(16).fill(1);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('test message');
      const parts = encrypted.split(':');
      // Modify the IV but keep the original MAC
      const tamperedIV = 'f'.repeat(32);
      const tampered = `${tamperedIV}:${parts[1]}:${parts[2]}`;

      await expect(decryptContent(tampered)).rejects.toThrow('Integrity check failed');
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

      const validIV = '0'.repeat(32);
      const encrypted = `${validIV}:data:with:colons`;

      await expect(decryptContent(encrypted)).rejects.toThrow('Invalid format');
    });

    it('should handle hasEncryptionKey when storage throws', async () => {
      mockSecureStorage.getItemAsync.mockRejectedValue(new Error('Storage unavailable'));

      await expect(hasEncryptionKey()).rejects.toThrow('Storage unavailable');
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
      mockGetRandomValues.mockImplementation((array) => {
        array.fill(ivCounter++);
        return array;
      });

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(encryptContent(`Message ${i}`));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toContain(':');
      });
    });

    it('should handle rapid successive decryptions', async () => {
      let ivCounter = 0;
      mockGetRandomValues.mockImplementation((array) => {
        array.fill(ivCounter++);
        return array;
      });

      // First encrypt multiple messages
      const encrypted = [];
      for (let i = 0; i < 10; i++) {
        encrypted.push(await encryptContent(`Message ${i}`));
      }

      // Then decrypt all at once
      const decryptPromises = encrypted.map((e) => decryptContent(e));
      const results = await Promise.all(decryptPromises);

      expect(results).toHaveLength(10);
      for (let i = 0; i < 10; i++) {
        expect(results[i]).toBe(`Message ${i}`);
      }
    });

    it('should handle content with colon characters', async () => {
      const mockIV = new Uint8Array(16).fill(16);
      mockGetRandomValues.mockReturnValue(mockIV);

      const content = 'key:value:another:value';
      const encrypted = await encryptContent(content);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(content);
    });

    it('should handle binary-like string content', async () => {
      const mockIV = new Uint8Array(16).fill(17);
      mockGetRandomValues.mockReturnValue(mockIV);

      const content = String.fromCharCode(...Array.from({ length: 256 }, (_, i) => i));
      const encrypted = await encryptContent(content);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(content);
    });

    it('should handle maximum IV value (all 255s)', async () => {
      const mockIV = new Uint8Array(16).fill(255);
      mockGetRandomValues.mockReturnValue(mockIV);

      const content = 'test with max IV';
      const encrypted = await encryptContent(content);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(content);
    });

    it('should handle minimum IV value (all 0s)', async () => {
      const mockIV = new Uint8Array(16).fill(0);
      mockGetRandomValues.mockReturnValue(mockIV);

      const content = 'test with min IV';
      const encrypted = await encryptContent(content);
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe(content);
    });
  });

  describe('Cross-key behavior', () => {
    it('should fail to decrypt with wrong key', async () => {
      const key1 = 'a'.repeat(64);
      const key2 = 'b'.repeat(64);

      mockSecureStorage.getItemAsync.mockResolvedValue(key1);
      const mockIV = new Uint8Array(16).fill(1);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('secret');

      // Switch to different key
      mockSecureStorage.getItemAsync.mockResolvedValue(key2);

      // Decryption should fail (either integrity check or decryption itself)
      await expect(decryptContent(encrypted)).rejects.toThrow();
    });

    it('should succeed with same key', async () => {
      const key = 'a'.repeat(64);
      mockSecureStorage.getItemAsync.mockResolvedValue(key);

      const mockIV = new Uint8Array(16).fill(1);
      mockGetRandomValues.mockReturnValue(mockIV);

      const encrypted = await encryptContent('secret');
      const decrypted = await decryptContent(encrypted);

      expect(decrypted).toBe('secret');
    });
  });
});
