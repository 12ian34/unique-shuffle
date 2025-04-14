import { ErrorType, ErrorSeverity, createError, handleError } from './errors'

export type ValidationRule<T = string> = {
  validate: (value: T) => boolean
  message: string
}

// Common validation rules
export const requiredRule: ValidationRule = {
  validate: (value) => Boolean(value && value.toString().trim() !== ''),
  message: 'This field is required',
}

export const emailRule: ValidationRule = {
  validate: (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(value)),
  message: 'Please enter a valid email address',
}

export const minLengthRule = (length: number): ValidationRule => ({
  validate: (value) => String(value).trim().length >= length,
  message: `Must be at least ${length} characters`,
})

export const maxLengthRule = (length: number): ValidationRule => ({
  validate: (value) => String(value).trim().length <= length,
  message: `Must be at most ${length} characters`,
})

export const numberRule: ValidationRule = {
  validate: (value) => !isNaN(Number(value)),
  message: 'Please enter a valid number',
}

export const urlRule: ValidationRule = {
  validate: (value) => {
    try {
      new URL(String(value))
      return true
    } catch {
      return false
    }
  },
  message: 'Please enter a valid URL',
}

/**
 * Validates a single value against a set of rules
 * Returns undefined if valid, or the first error message if invalid
 */
export function validateValue<T>(value: T, rules: ValidationRule<T>[]): string | undefined {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message
    }
  }
  return undefined
}

/**
 * Validates a form data object against a set of rules
 * Returns an object with errors for each field that failed validation
 */
export function validateForm<T extends Record<string, any>>(
  formData: T,
  validationRules: Partial<Record<keyof T, ValidationRule<any>[]>>
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {}

  for (const field in validationRules) {
    const rules = validationRules[field]
    if (rules) {
      const error = validateValue(formData[field], rules)
      if (error) {
        errors[field] = error
      }
    }
  }

  return errors
}

/**
 * Checks if a validation result has any errors
 */
export function hasValidationErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((error) => Boolean(error))
}

/**
 * Handles form submission with validation
 * Returns true if validation passed, false otherwise
 */
export function handleFormSubmit<T extends Record<string, any>>(
  formData: T,
  validationRules: Partial<Record<keyof T, ValidationRule<any>[]>>,
  onValid: (data: T) => void
): boolean {
  const errors = validateForm(formData, validationRules)

  if (hasValidationErrors(errors)) {
    // Create a structured error with validation details
    const validationError = createError(
      'Please correct the validation errors',
      ErrorType.VALIDATION,
      ErrorSeverity.WARNING,
      { fields: errors }
    )

    handleError(validationError)
    return false
  }

  try {
    onValid(formData)
    return true
  } catch (error) {
    handleError(error)
    return false
  }
}
