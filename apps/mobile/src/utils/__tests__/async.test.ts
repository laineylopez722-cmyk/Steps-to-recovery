import { withTimeout } from '../async';

describe('withTimeout', () => {
  it('resolves when the wrapped promise finishes before timeout', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50, 'quick operation')).resolves.toBe('ok');
  });

  it('rejects when the wrapped promise exceeds the timeout', async () => {
    const neverResolvingPromise = new Promise<string>(() => {
      // Intentionally left pending.
    });

    await expect(withTimeout(neverResolvingPromise, 1, 'slow operation')).rejects.toThrow(
      'slow operation timed out after 1ms',
    );
  });
});
