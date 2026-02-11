import { generateUUID, uuid } from '../uuid';

// jest.setup.js mocks uuid with: 'mock-uuid-' + random string

describe('uuid utilities', () => {
  describe('generateUUID', () => {
    it('returns a non-empty string', () => {
      const id = generateUUID();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('returns a string matching the mock pattern', () => {
      const id = generateUUID();
      expect(id).toMatch(/^mock-uuid-[a-z0-9]+$/);
    });

    it('generates unique UUIDs across multiple calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateUUID());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('uuid alias', () => {
    it('is a function', () => {
      expect(typeof uuid).toBe('function');
    });

    it('returns a string matching the mock pattern', () => {
      const id = uuid();
      expect(id).toMatch(/^mock-uuid-[a-z0-9]+$/);
    });

    it('generates unique values', () => {
      const id1 = uuid();
      const id2 = uuid();
      expect(id1).not.toBe(id2);
    });
  });
});
