/**
 * Form Validation Hook
 *
 * Generic form validation with field-level and form-level validation.
 * Supports async validation, custom validators, and accessibility-ready errors.
 *
 * **Features**:
 * - Field-level validation with real-time feedback
 * - Form-level validation on submit
 * - Async validator support (e.g., checking username availability)
 * - Accessibility-ready error messages
 * - Touch tracking for showing errors only after interaction
 *
 * @example
 * ```ts
 * const {
 *   values,
 *   errors,
 *   touched,
 *   handleChange,
 *   handleBlur,
 *   handleSubmit,
 *   isValid,
 * } = useFormValidation({
 *   initialValues: { email: '', password: '' },
 *   validators: {
 *     email: (v) => (!v ? 'Email required' : !v.includes('@') ? 'Invalid email' : null),
 *     password: (v) => (!v ? 'Password required' : v.length < 8 ? 'Min 8 characters' : null),
 *   },
 *   onSubmit: async (values) => {
 *     await login(values.email, values.password);
 *   },
 * });
 * ```
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { logger } from '../utils/logger';

type ValidationResult = string | null | undefined;
type Validator<T> = (value: T[keyof T], values: T) => ValidationResult | Promise<ValidationResult>;

interface FormValidationOptions<T extends Record<string, unknown>> {
  /** Initial form values */
  initialValues: T;
  /** Validators for each field */
  validators?: Partial<Record<keyof T, Validator<T>>>;
  /** Called when form is submitted and valid */
  onSubmit?: (values: T) => void | Promise<void>;
  /** Validate on change (default: true) */
  validateOnChange?: boolean;
  /** Validate on blur (default: true) */
  validateOnBlur?: boolean;
}

interface FormValidationState<T> {
  /** Current form values */
  values: T;
  /** Validation errors by field */
  errors: Partial<Record<keyof T, string>>;
  /** Fields that have been touched (blurred) */
  touched: Partial<Record<keyof T, boolean>>;
  /** Form is currently submitting */
  isSubmitting: boolean;
  /** Form has been submitted at least once */
  isSubmitted: boolean;
  /** All fields are valid */
  isValid: boolean;
  /** Form has unsaved changes */
  isDirty: boolean;
}

interface FormValidationActions<T> {
  /** Update a field value */
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Mark a field as touched (call on blur) */
  handleBlur: (field: keyof T) => void;
  /** Submit the form */
  handleSubmit: () => Promise<boolean>;
  /** Set a field error manually */
  setError: (field: keyof T, error: string | null) => void;
  /** Set multiple values at once */
  setValues: (values: Partial<T>) => void;
  /** Reset form to initial values */
  reset: () => void;
  /** Validate a single field */
  validateField: (field: keyof T) => Promise<string | null>;
  /** Validate all fields */
  validateAll: () => Promise<boolean>;
  /** Get error props for accessibility */
  getFieldErrorProps: (field: keyof T) => {
    accessibilityLabel: string;
    accessibilityInvalid: boolean;
    accessibilityDescribedBy: string | undefined;
  };
}

export function useFormValidation<T extends Record<string, unknown>>(
  options: FormValidationOptions<T>,
): FormValidationState<T> & FormValidationActions<T> {
  const {
    initialValues,
    validators = {},
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const initialValuesRef = useRef(initialValues);

  // Check if form is dirty (has changes)
  const isDirty = useMemo(() => {
    return Object.keys(values).some(
      (key) => values[key as keyof T] !== initialValuesRef.current[key as keyof T],
    );
  }, [values]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).every((key) => !errors[key as keyof T]);
  }, [errors]);

  // Validate a single field
  const validateField = useCallback(
    async (field: keyof T): Promise<string | null> => {
      const validator = (validators as Partial<Record<keyof T, Validator<T>>>)[field];
      if (!validator) return null;

      try {
        const result = await validator(values[field], values);
        return result || null;
      } catch (error) {
        logger.error('Validation error', { field, error });
        return 'Validation failed';
      }
    },
    [validators, values],
  );

  // Validate all fields
  const validateAll = useCallback(async (): Promise<boolean> => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasErrors = false;

    await Promise.all(
      Object.keys(validators).map(async (field) => {
        const error = await validateField(field as keyof T);
        if (error) {
          newErrors[field as keyof T] = error;
          hasErrors = true;
        }
      }),
    );

    setErrors(newErrors);
    return !hasErrors;
  }, [validators, validateField]);

  // Handle field change
  const handleChange = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      if (validateOnChange) {
        void (async () => {
          const validator = (validators as Partial<Record<keyof T, Validator<T>>>)[field];
          if (validator) {
            const error = await validator(value, { ...values, [field]: value });
            setErrors((prev) => ({ ...prev, [field]: error || undefined }));
          }
        })();
      }
    },
    [validateOnChange, validators, values],
  );

  // Handle field blur
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      if (validateOnBlur) {
        void (async () => {
          const error = await validateField(field);
          setErrors((prev) => ({ ...prev, [field]: error || undefined }));
        })();
      }
    },
    [validateOnBlur, validateField],
  );

  // Handle form submit
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    setIsSubmitted(true);
    setIsSubmitting(true);

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<keyof T, boolean>,
    );
    setTouched(allTouched);

    try {
      const isFormValid = await validateAll();

      if (!isFormValid) {
        setIsSubmitting(false);
        return false;
      }

      if (onSubmit) {
        await onSubmit(values);
      }

      setIsSubmitting(false);
      return true;
    } catch (error) {
      logger.error('Form submission failed', error);
      setIsSubmitting(false);
      return false;
    }
  }, [values, validateAll, onSubmit]);

  // Set error manually
  const setError = useCallback((field: keyof T, error: string | null) => {
    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  }, []);

  // Set multiple values
  const setValuesPartial = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setIsSubmitted(false);
  }, []);

  // Get accessibility props for a field
  const getFieldErrorProps = useCallback(
    (field: keyof T) => {
      const hasError = !!errors[field] && (touched[field] || isSubmitted);
      const errorId = hasError ? `${String(field)}-error` : undefined;

      return {
        accessibilityLabel: String(field),
        accessibilityInvalid: hasError,
        accessibilityDescribedBy: errorId,
      };
    },
    [errors, touched, isSubmitted],
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setError,
    setValues: setValuesPartial,
    reset,
    validateField,
    validateAll,
    getFieldErrorProps,
  };
}

/**
 * Common validators
 */
export const validators = {
  required:
    (message = 'This field is required') =>
    (value: unknown) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      return null;
    },

  email:
    (message = 'Please enter a valid email') =>
    (value: string) => {
      if (!value) return null; // Use required validator separately
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : message;
    },

  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return null;
    return value.length >= min ? null : message || `Must be at least ${min} characters`;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (!value) return null;
    return value.length <= max ? null : message || `Must be at most ${max} characters`;
  },

  pattern:
    (regex: RegExp, message = 'Invalid format') =>
    (value: string) => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    },

  range: (min: number, max: number, message?: string) => (value: number) => {
    if (value === null || value === undefined) return null;
    return value >= min && value <= max ? null : message || `Must be between ${min} and ${max}`;
  },

  match:
    <T extends Record<string, unknown>>(field: keyof T, message = 'Fields do not match') =>
    (value: unknown, values: T) => {
      return value === values[field] ? null : message;
    },

  compose:
    <T>(...fns: Array<(value: T, values: Record<string, unknown>) => ValidationResult>) =>
    (value: T, values: Record<string, unknown>) => {
      for (const fn of fns) {
        const error = fn(value, values);
        if (error) return error;
      }
      return null;
    },
};
