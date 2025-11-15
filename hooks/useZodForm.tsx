import React, { useState, useCallback } from 'react';
import { ZodType } from 'zod';

// Allows for partial error records for any object shape T
type FormErrors<T> = Partial<Record<keyof T, string | undefined>>;

/**
 * A custom hook for managing form state, validation with Zod, and error handling.
 * @param schema The Zod schema to validate the form data against.
 * @param initialData The initial state of the form data.
 * @returns An object containing form state and helper functions.
 */
export const useZodForm = <T extends {}>(
  schema: ZodType<T>,
  initialData: T
) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<FormErrors<T>>({});

  /**
   * Handles changes for standard input, textarea, and select elements.
   * Updates form data and clears the error for the changed field.
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name as keyof T]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );
  
  /**
   * Allows setting a specific field's value directly.
   * Useful for custom components like multi-selects or date pickers.
   * @param fieldName The name of the field to update.
   * @param value The new value for the field.
   */
  const setField = useCallback(
    (fieldName: keyof T, value: any) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
      }
    },
    [errors]
  );


  /**
   * Validates the current form data against the provided Zod schema.
   * Updates the errors state if validation fails.
   * @returns `true` if validation is successful, `false` otherwise.
   */
  const validate = useCallback(() => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const errorMap: FormErrors<T> = {};
      // Zod's fieldErrors can be an array of strings, we only want the first one.
      for (const key in fieldErrors) {
        errorMap[key as keyof T] = (
          fieldErrors[key as keyof typeof fieldErrors] as string[] | undefined
        )?.[0];
      }
      setErrors(errorMap);
      return false;
    }
    setErrors({});
    return true;
  }, [formData, schema]);

  return {
    formData,
    errors,
    setFormData, // Expose for complex resets or direct manipulation
    handleChange,
    setField,
    validate,
  };
};