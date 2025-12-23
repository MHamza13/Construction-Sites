/**
 * Utility functions for handling API errors and validation messages
 */

// ✅ Interfaces for error objects
export interface ValidationError {
  PropertyName: string;
  ErrorMessage: string;
}

export interface ApiError {
  status?: number;
  message?: string;
  errors?: ValidationError[];
}

/**
 * Parses API validation errors and maps them to form field names
 * @param error - The error object from API
 * @param fieldMapping - Mapping of API field names to form field names
 * @returns Object with form field names as keys and error messages as values
 */
export const parseValidationErrors = (
  error: ApiError,
  fieldMapping: Record<string, string> = {}
): Record<string, string> => {
  const defaultFieldMapping: Record<string, string> = {
    DeadlineDate: "deadline",
    StartDate: "startDate",
    Name: "name",
    Description: "description",
    Budget: "budget",
    ClientName: "client",
    Location: "location",
    ManagerId: "managerId",
    Status: "status",
    // Additional common field mappings
    ProjectName: "name",
    ProjectDescription: "description",
    ProjectBudget: "budget",
    Client: "client",
    ProjectLocation: "location",
    Deadline: "deadline",
    Start: "startDate",
  };

  const mapping = { ...defaultFieldMapping, ...fieldMapping };
  const apiErrors: Record<string, string> = {};

  if (error?.status === 400 && error?.errors && Array.isArray(error.errors)) {
    error.errors.forEach((validationError) => {
      const fieldName =
        mapping[validationError.PropertyName] ||
        validationError.PropertyName?.toLowerCase() ||
        "unknown";
      apiErrors[fieldName] = validationError.ErrorMessage;
    });
  }

  return apiErrors;
};

/**
 * Gets a user-friendly error message from an API error
 * @param error - The error object from API
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: ApiError): string => {
  if (error?.message) {
    return error.message;
  }

  if (error?.status === 400 && error?.errors && Array.isArray(error.errors)) {
    return "Please fix the validation errors below and try again.";
  }

  if (error?.status === 401) {
    return "You are not authorized to perform this action.";
  }

  if (error?.status === 403) {
    return "You don't have permission to perform this action.";
  }

  if (error?.status === 404) {
    return "The requested resource was not found.";
  }

  if (error?.status === 500) {
    return "A server error occurred. Please try again later.";
  }

  return "An unexpected error occurred. Please try again.";
};

/**
 * Checks if an error is a validation error
 * @param error - The error object from API
 * @returns True if it's a validation error
 */
export const isValidationError = (error: ApiError): boolean => {
  return error?.status === 400 && error?.errors !== undefined && Array.isArray(error.errors);
};
