import { SyncMutex } from '../syncMutex';

describe('SyncMutex', () => {
  it('reports locked state while held', async () => {
    const mutex = new SyncMutex();

    expect(mutex.isLocked()).toBe(false);

    await mutex.acquire();

    expect(mutex.isLocked()).toBe(true);

    mutex.release();

    expect(mutex.isLocked()).toBe(false);
  });

  it('queues later acquires until release is called', async () => {
    const mutex = new SyncMutex();
    const sequence: string[] = [];

    await mutex.acquire();
    sequence.push('first');

    const secondAcquire = mutex.acquire().then(() => {
      sequence.push('second');
    });

    expect(sequence).toEqual(['first']);

    mutex.release();
    await secondAcquire;

    expect(sequence).toEqual(['first', 'second']);
    expect(mutex.isLocked()).toBe(true);

    mutex.release();
    expect(mutex.isLocked()).toBe(false);
  });
});
