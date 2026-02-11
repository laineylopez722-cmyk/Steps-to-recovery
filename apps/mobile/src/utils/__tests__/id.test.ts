import { generateId } from '../id';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs across multiple calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('prepends prefix when provided', () => {
    const id = generateId('test');
    expect(id.startsWith('test_')).toBe(true);
  });

  it('returns ID without prefix when none provided', () => {
    const id = generateId();
    expect(id.startsWith('test_')).toBe(false);
  });

  it('works with empty string prefix', () => {
    const id = generateId('');
    // empty prefix is falsy, so no prefix added
    expect(id).not.toContain('_');
  });

  it('generates IDs with reasonable length', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThanOrEqual(10);
  });

  it('uses crypto.randomUUID when available', () => {
    // crypto.randomUUID is available in test environment
    const id = generateId();
    // UUID format: 8-4-4-4-12 hex chars
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(id)).toBe(true);
  });

  it('prefixed ID contains UUID portion', () => {
    const id = generateId('entry');
    const parts = id.split('_');
    expect(parts[0]).toBe('entry');
    // Remaining part should be a UUID
    const uuidPart = parts.slice(1).join('_');
    expect(uuidPart.length).toBeGreaterThan(0);
  });
});
