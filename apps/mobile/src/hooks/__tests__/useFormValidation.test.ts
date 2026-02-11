/**
 * useFormValidation Hook Test Suite
 *
 * Tests form validation functionality including:
 * - Initial values
 * - Field change handling
 * - Validation on change/blur
 * - Submit with valid/invalid state
 * - isValid computation
 * - Reset to initial values
 * - Async validator support
 */

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { renderHook, act } from '@testing-library/react-native';
import { useFormValidation, validators } from '../useFormValidation';

interface TestFormValues {
  email: string;
  password: string;
}

const initialValues: TestFormValues = { email: '', password: '' };

describe('useFormValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set initial values correctly', () => {
    const { result } = renderHook(() => useFormValidation({ initialValues }));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSubmitted).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('should update values on handleChange', () => {
    const { result } = renderHook(() => useFormValidation({ initialValues }));

    act(() => {
      result.current.handleChange('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
    expect(result.current.isDirty).toBe(true);
  });

  it('should run validator and set error for invalid input', async () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validators: {
          email: (value: unknown) => (!value ? 'Email required' : null),
        },
        validateOnChange: true,
      }),
    );

    await act(async () => {
      result.current.handleChange('email', '');
      // Allow the async void validation to settle
      await Promise.resolve();
    });

    expect(result.current.errors.email).toBe('Email required');
  });

  it('should clear error when valid input is provided', async () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validators: {
          email: (value: unknown) => (!value ? 'Email required' : null),
        },
        validateOnChange: true,
      }),
    );

    await act(async () => {
      result.current.handleChange('email', '');
      await Promise.resolve();
    });

    expect(result.current.errors.email).toBe('Email required');

    await act(async () => {
      result.current.handleChange('email', 'test@example.com');
      await Promise.resolve();
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('should mark field as touched on handleBlur', () => {
    const { result } = renderHook(() => useFormValidation({ initialValues }));

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.touched.email).toBe(true);
    expect(result.current.touched.password).toBeUndefined();
  });

  it('should validate on blur when validateOnBlur is true', async () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validators: {
          email: (value: unknown) => (!value ? 'Email required' : null),
        },
        validateOnBlur: true,
      }),
    );

    await act(async () => {
      result.current.handleBlur('email');
      await Promise.resolve();
    });

    expect(result.current.errors.email).toBe('Email required');
  });

  it('should call onSubmit when form is valid', async () => {
    const mockOnSubmit = jest.fn();
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { email: 'test@example.com', password: 'password123' },
        validators: {
          email: (value: unknown) => (!value ? 'Required' : null),
          password: (value: unknown) => (!value ? 'Required' : null),
        },
        onSubmit: mockOnSubmit,
      }),
    );

    let submitResult: boolean | undefined;
    await act(async () => {
      submitResult = await result.current.handleSubmit();
    });

    expect(submitResult).toBe(true);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should not call onSubmit when form is invalid', async () => {
    const mockOnSubmit = jest.fn();
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validators: {
          email: (value: unknown) => (!value ? 'Email required' : null),
        },
        onSubmit: mockOnSubmit,
      }),
    );

    let submitResult: boolean | undefined;
    await act(async () => {
      submitResult = await result.current.handleSubmit();
    });

    expect(submitResult).toBe(false);
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBe('Email required');
  });

  it('should mark all fields as touched on submit', async () => {
    const { result } = renderHook(() => useFormValidation({ initialValues }));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.touched.email).toBe(true);
    expect(result.current.touched.password).toBe(true);
    expect(result.current.isSubmitted).toBe(true);
  });

  it('should return isValid true when there are no errors', () => {
    const { result } = renderHook(() => useFormValidation({ initialValues }));

    expect(result.current.isValid).toBe(true);
  });

  it('should return isValid false after validation produces errors', async () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validators: {
          email: (value: unknown) => (!value ? 'Required' : null),
        },
        validateOnChange: true,
      }),
    );

    await act(async () => {
      result.current.handleChange('email', '');
      await Promise.resolve();
    });

    expect(result.current.errors.email).toBe('Required');
    expect(result.current.isValid).toBe(false);
  });

  it('should reset form to initial values', async () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validators: {
          email: (value: unknown) => (!value ? 'Required' : null),
        },
        validateOnChange: true,
      }),
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.handleBlur('email');
    });

    // Verify dirty state
    expect(result.current.values.email).toBe('test@example.com');
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitted).toBe(false);
  });

  it('should support async validators', async () => {
    const asyncValidator = async (value: unknown): Promise<string | null> => {
      return value === 'taken@example.com' ? 'Email already taken' : null;
    };

    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validators: { email: asyncValidator },
        validateOnChange: true,
      }),
    );

    await act(async () => {
      result.current.handleChange('email', 'taken@example.com');
      await Promise.resolve();
    });

    expect(result.current.errors.email).toBe('Email already taken');
  });

  it('should handle submit failure gracefully', async () => {
    const mockOnSubmit = jest.fn().mockImplementation(async () => {
      throw new Error('Network error');
    });

    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { email: 'test@example.com', password: 'pass1234' },
        onSubmit: mockOnSubmit,
      }),
    );

    let submitResult: boolean | undefined;
    await act(async () => {
      submitResult = await result.current.handleSubmit();
    });

    expect(submitResult).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should set error manually via setError', () => {
    const { result } = renderHook(() => useFormValidation({ initialValues }));

    act(() => {
      result.current.setError('email', 'Custom error');
    });

    expect(result.current.errors.email).toBe('Custom error');
  });

  it('should provide accessibility error props', () => {
    const { result } = renderHook(() => useFormValidation({ initialValues }));

    const props = result.current.getFieldErrorProps('email');
    expect(props.accessibilityLabel).toBe('email');
    expect(props.accessibilityInvalid).toBe(false);
    expect(props.accessibilityDescribedBy).toBeUndefined();
  });

  describe('built-in validators', () => {
    it('required validator returns error for empty value', () => {
      const validate = validators.required('Field is required');
      expect(validate('')).toBe('Field is required');
      expect(validate(null)).toBe('Field is required');
      expect(validate(undefined)).toBe('Field is required');
      expect(validate('hello')).toBeNull();
    });

    it('email validator checks format', () => {
      const validate = validators.email();
      expect(validate('bad')).toBe('Please enter a valid email');
      expect(validate('test@example.com')).toBeNull();
      expect(validate('')).toBeNull(); // empty passes (use required separately)
    });

    it('minLength validator checks minimum length', () => {
      const validate = validators.minLength(8);
      expect(validate('short')).toBe('Must be at least 8 characters');
      expect(validate('longenough')).toBeNull();
      expect(validate('')).toBeNull(); // empty passes
    });

    it('maxLength validator checks maximum length', () => {
      const validate = validators.maxLength(5);
      expect(validate('toolong')).toBe('Must be at most 5 characters');
      expect(validate('ok')).toBeNull();
    });

    it('pattern validator checks regex', () => {
      const validate = validators.pattern(/^\d+$/, 'Must be numeric');
      expect(validate('abc')).toBe('Must be numeric');
      expect(validate('123')).toBeNull();
    });

    it('range validator checks min/max', () => {
      const validate = validators.range(1, 10);
      expect(validate(0)).toBe('Must be between 1 and 10');
      expect(validate(11)).toBe('Must be between 1 and 10');
      expect(validate(5)).toBeNull();
    });
  });
});
