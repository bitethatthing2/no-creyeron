// =============================================================================
// CENTRALIZED ERROR HANDLING FOR SIDE HUSTLE SERVICES
// =============================================================================

// Define the ServiceError interface
export interface ServiceError extends Error {
  code?: string;
  details?: unknown;
  statusCode?: number;
}

export class AppServiceError extends Error implements ServiceError {
  public code?: string;
  public details?: unknown;
  public statusCode?: number;

  constructor(
    message: string,
    code?: string,
    details?: unknown,
    statusCode?: number,
  ) {
    super(message);
    this.name = "AppServiceError";
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

// Specific error types
export class AuthenticationError extends AppServiceError {
  constructor(message = "Authentication required") {
    super(message, "AUTH_REQUIRED", null, 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppServiceError {
  constructor(message = "Insufficient permissions") {
    super(message, "INSUFFICIENT_PERMISSIONS", null, 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppServiceError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", { resource }, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppServiceError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details, 400);
    this.name = "ValidationError";
  }
}

export class DatabaseError extends AppServiceError {
  constructor(message: string, originalError?: unknown) {
    super(message, "DATABASE_ERROR", originalError, 500);
    this.name = "DatabaseError";
  }
}

export class RateLimitError extends AppServiceError {
  constructor(message = "Rate limit exceeded") {
    super(message, "RATE_LIMIT", null, 429);
    this.name = "RateLimitError";
  }
}

export class ContentError extends AppServiceError {
  constructor(message: string, details?: unknown) {
    super(message, "CONTENT_ERROR", details, 400);
    this.name = "ContentError";
  }
}

export class PaymentError extends AppServiceError {
  constructor(message: string, details?: unknown) {
    super(message, "PAYMENT_ERROR", details, 402);
    this.name = "PaymentError";
  }
}

// Type guard for error objects
function isErrorWithCode(
  error: unknown,
): error is { code: string; message?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string"
  );
}

// Error mapping utilities
export function mapSupabaseError(error: unknown): AppServiceError {
  if (!error) return new AppServiceError("Unknown error occurred");

  // Check if error has a code property
  if (isErrorWithCode(error)) {
    // Map common Supabase error codes
    switch (error.code) {
      case "42P01":
        return new NotFoundError("Table");
      case "23503":
        return new ValidationError("Foreign key constraint violation", error);
      case "23505":
        return new ValidationError("Unique constraint violation", error);
      case "PGRST116":
        return new NotFoundError("Record");
      case "42501":
        return new AuthorizationError("Database permission denied");
      default:
        return new DatabaseError(
          error.message || "Database operation failed",
          error,
        );
    }
  }

  // Handle non-error objects
  if (error instanceof Error) {
    return new DatabaseError(error.message, error);
  }

  // Fallback for unknown error types
  return new AppServiceError(
    "An unknown error occurred",
    "UNKNOWN_ERROR",
    error,
  );
}

// Error logging utility
export function logError(
  error: AppServiceError,
  context?: Record<string, unknown>,
) {
  const logData = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack,
  };

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.error("🚨 Service Error:", logData);
  }

  // In production, you might want to send to an error tracking service
  // Example: Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === "production") {
    // TODO: Integrate with error tracking service
  }
}

// Error handling wrapper for service methods
export function withErrorHandling<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  context?: string,
) {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof AppServiceError
        ? error
        : mapSupabaseError(error);

      logError(appError, { context, args: args.slice(0, 2) }); // Limit args for privacy
      throw appError;
    }
  };
}

// Response type definitions
export interface SuccessResponse<T> {
  success: true;
  data: T;
  error: undefined;
}

export interface ErrorResponse {
  success: false;
  data: undefined;
  error: string;
  code?: string;
}

export type ServiceResponse<T> = SuccessResponse<T> | ErrorResponse;

// Response wrapper utilities
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    error: undefined,
  };
}

export function createErrorResponse(
  error: AppServiceError | Error | string,
): ErrorResponse {
  const appError = typeof error === "string"
    ? new AppServiceError(error)
    : error instanceof AppServiceError
    ? error
    : new AppServiceError(error.message);

  return {
    success: false,
    data: undefined,
    error: appError.message,
    code: appError.code,
  };
}

// Validation utilities
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === null || value === undefined || value === "") {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }
}

export function validateUUID(id: string, fieldName = "ID"): void {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }
}

export function validatePhone(phone: string): void {
  // Matches your database constraint
  const phoneRegex = /^\+?1?\d{10}$|^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError("Invalid phone number format");
  }
}

export function validatePagination(
  page?: number,
  limit?: number,
): { page: number; limit: number } {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(Math.max(1, limit || 20), 100); // Max 100 items per page

  return { page: validatedPage, limit: validatedLimit };
}

export function validateUsername(username: string): void {
  if (!username || username.length < 3) {
    throw new ValidationError("Username must be at least 3 characters");
  }
  if (username.length > 30) {
    throw new ValidationError("Username must be less than 30 characters");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new ValidationError("Username can only contain letters, numbers, and underscores");
  }
}