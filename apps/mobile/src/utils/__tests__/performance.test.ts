jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  InteractionManager: {
    runAfterInteractions: jest.fn((cb: () => void) => {
      cb();
      return { then: jest.fn(), done: jest.fn(), cancel: jest.fn() };
    }),
  },
}));

import {
  trackRenderTime,
  measureAsync,
  measureSync,
  startMeasurement,
  endMeasurement,
  measureColdStart,
  measureScreenLoad,
  measureDatabaseInit,
  debounce,
  throttle,
  checkPerformanceBudget,
  runAfterInteractions,
  clearPerformanceMetrics,
  reportPerformanceMetrics,
  markPerformance,
  getMemoryInfo,
  FrameRateMonitor,
} from '../performance';
import { logger } from '../logger';

describe('performance utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearPerformanceMetrics();
  });

  describe('trackRenderTime', () => {
    it('returns a function that logs render time', () => {
      const end = trackRenderTime('TestComponent');
      expect(typeof end).toBe('function');
      end();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('warns for slow renders (>16ms)', () => {
      // Mock performance.now to simulate slow render
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(100); // start time in trackRenderTime
      const end = trackRenderTime('SlowComponent');

      mockNow.mockReturnValueOnce(120); // end time (20ms later)
      end();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Slow render detected'));
      mockNow.mockRestore();
    });
  });

  describe('measureAsync', () => {
    it('returns the result of the async operation', async () => {
      const result = await measureAsync('testOp', async () => 42);
      expect(result).toBe(42);
    });

    it('logs the operation duration', async () => {
      await measureAsync('fetchData', async () => 'data');
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('fetchData'));
    });

    it('throws and logs error on failure', async () => {
      const error = new Error('Network error');
      await expect(
        measureAsync('failOp', async () => {
          throw error;
        }),
      ).rejects.toThrow('Network error');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('failOp'),
        expect.anything(),
      );
    });
  });

  describe('measureSync', () => {
    it('returns the result of the sync operation', () => {
      const result = measureSync('compute', () => 100);
      expect(result).toBe(100);
    });

    it('logs the operation duration', () => {
      measureSync('calculate', () => 'done');
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('calculate'));
    });

    it('throws and logs error on failure', () => {
      expect(() =>
        measureSync('failSync', () => {
          throw new Error('Sync error');
        }),
      ).toThrow('Sync error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('startMeasurement / endMeasurement', () => {
    it('returns duration between start and end', () => {
      startMeasurement('myMetric');
      const duration = endMeasurement('myMetric');
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('returns 0 and warns when ending non-existent measurement', () => {
      const duration = endMeasurement('nonExistent');
      expect(duration).toBe(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No active measurement found'),
      );
    });
  });

  describe('measureColdStart', () => {
    it('marks start on first call and completes on second call', () => {
      // Need fresh module state - cold start tracks module-level state
      // First call marks start
      measureColdStart();
      expect(logger.debug).toHaveBeenCalledWith('Cold start measurement began');

      // Second call calculates duration
      measureColdStart();
      // Should log info or warn depending on speed
      const infoOrWarnCalled =
        (logger.info as jest.Mock).mock.calls.some(
          (call: unknown[]) =>
            typeof call[0] === 'string' && (call[0] as string).includes('Cold start'),
        ) ||
        (logger.warn as jest.Mock).mock.calls.some(
          (call: unknown[]) =>
            typeof call[0] === 'string' && (call[0] as string).includes('Cold start'),
        );
      expect(infoOrWarnCalled).toBe(true);
    });

    it('does nothing on subsequent calls after completion', () => {
      // After the test above, cold start is already complete
      jest.clearAllMocks();
      measureColdStart();
      // Should not log anything since already completed
      expect(logger.debug).not.toHaveBeenCalledWith('Cold start measurement began');
    });
  });

  describe('measureScreenLoad', () => {
    it('logs start and end for screen load', () => {
      measureScreenLoad('HomeScreen', 'start');
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('HomeScreen'));

      measureScreenLoad('HomeScreen', 'end');
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('HomeScreen'));
    });

    it('defaults to start stage', () => {
      measureScreenLoad('SettingsScreen');
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Screen load started: SettingsScreen'),
      );
    });

    it('does nothing for end if start was not recorded', () => {
      jest.clearAllMocks();
      measureScreenLoad('UnknownScreen', 'end');
      // No duration logged since start was never called
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('measureDatabaseInit', () => {
    it('logs start and end for database init', () => {
      measureDatabaseInit('start');
      expect(logger.debug).toHaveBeenCalledWith('Database initialization started');

      measureDatabaseInit('end');
      const logged =
        (logger.info as jest.Mock).mock.calls.some(
          (call: unknown[]) =>
            typeof call[0] === 'string' && (call[0] as string).includes('Database init'),
        ) ||
        (logger.warn as jest.Mock).mock.calls.some(
          (call: unknown[]) =>
            typeof call[0] === 'string' && (call[0] as string).includes('Database init'),
        );
      expect(logged).toBe(true);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('delays function execution by specified time', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 300);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('resets timer on subsequent calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 200);

      debounced();
      jest.advanceTimersByTime(100);
      debounced(); // Reset timer
      jest.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to the debounced function', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('only calls once for rapid fire calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      for (let i = 0; i < 10; i++) {
        debounced();
      }

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('executes immediately on first call', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 200);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('blocks subsequent calls within the limit period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 200);

      throttled();
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('allows execution again after the limit period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 200);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(200);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('passes arguments to the throttled function', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled('hello');
      expect(fn).toHaveBeenCalledWith('hello');
    });
  });

  describe('checkPerformanceBudget', () => {
    it('returns within budget for fast renders', () => {
      const result = checkPerformanceBudget('componentRender', 10);
      expect(result.withinBudget).toBe(true);
      expect(result.budget).toBe(16);
      expect(result.overBy).toBe(0);
    });

    it('returns over budget for slow renders', () => {
      const result = checkPerformanceBudget('componentRender', 20);
      expect(result.withinBudget).toBe(false);
      expect(result.overBy).toBe(4);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('checks screen transition budget (300ms)', () => {
      const result = checkPerformanceBudget('screenTransition', 100);
      expect(result.withinBudget).toBe(true);
      expect(result.budget).toBe(300);
    });

    it('checks cold start budget (2000ms)', () => {
      const result = checkPerformanceBudget('coldStart', 2500);
      expect(result.withinBudget).toBe(false);
      expect(result.overBy).toBe(500);
    });

    it('returns exactly within budget at boundary', () => {
      const result = checkPerformanceBudget('componentRender', 16);
      expect(result.withinBudget).toBe(true);
      expect(result.overBy).toBe(0);
    });
  });

  describe('runAfterInteractions', () => {
    it('resolves with the task result', async () => {
      const result = await runAfterInteractions(() => 'done');
      expect(result).toBe('done');
    });

    it('rejects if task throws', async () => {
      await expect(
        runAfterInteractions(() => {
          throw new Error('Task failed');
        }),
      ).rejects.toThrow('Task failed');
    });
  });

  describe('markPerformance', () => {
    it('calls performance.mark when available', () => {
      // performance.mark may not exist in test env, so define it
      const originalMark = performance.mark;
      performance.mark = jest.fn();
      markPerformance('testEvent');
      expect(performance.mark).toHaveBeenCalledWith('testEvent');
      performance.mark = originalMark;
    });
  });

  describe('getMemoryInfo', () => {
    it('returns null values when memory API is not available', () => {
      const info = getMemoryInfo();
      // In test env, performance.memory may not be available
      expect(info).toHaveProperty('usedJSHeapSize');
      expect(info).toHaveProperty('totalJSHeapSize');
      expect(info).toHaveProperty('jsHeapSizeLimit');
    });
  });

  describe('reportPerformanceMetrics', () => {
    it('returns a report with summary', () => {
      const report = reportPerformanceMetrics();
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('summary');
      expect(report.summary).toHaveProperty('totalMetrics');
      expect(report.summary).toHaveProperty('averageRenderTime');
      expect(report.summary).toHaveProperty('averageScreenLoadTime');
    });
  });

  describe('FrameRateMonitor', () => {
    it('can be instantiated with a callback', () => {
      const callback = jest.fn();
      const monitor = new FrameRateMonitor(callback);
      expect(monitor).toBeDefined();
    });

    it('starts and stops without errors', () => {
      const callback = jest.fn();
      const monitor = new FrameRateMonitor(callback);

      // Mock requestAnimationFrame and cancelAnimationFrame
      const originalRAF = globalThis.requestAnimationFrame;
      const originalCAF = globalThis.cancelAnimationFrame;
      globalThis.requestAnimationFrame = jest.fn().mockReturnValue(1);
      globalThis.cancelAnimationFrame = jest.fn();

      monitor.start();
      monitor.stop();

      expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(1);

      globalThis.requestAnimationFrame = originalRAF;
      globalThis.cancelAnimationFrame = originalCAF;
    });

    it('does not double-start', () => {
      const callback = jest.fn();
      const monitor = new FrameRateMonitor(callback);

      const originalRAF = globalThis.requestAnimationFrame;
      globalThis.requestAnimationFrame = jest.fn().mockReturnValue(1);

      monitor.start();
      monitor.start(); // Should not call rAF again

      expect(globalThis.requestAnimationFrame).toHaveBeenCalledTimes(1);

      monitor.stop();
      globalThis.requestAnimationFrame = originalRAF;
    });
  });
});
