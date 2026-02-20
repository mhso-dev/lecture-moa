import type { ApiResponse, ApiError } from "@shared";
import { env } from "~/src/env";

/**
 * API Client Configuration
 *
 * A fetch-based API client with:
 * - Base URL from environment variables
 * - Request/response interceptors
 * - Type-safe responses using generics
 * - Error handling with typed error responses
 * - Automatic JSON parsing
 * - Auth token injection via module-level setter
 */

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
  cache?: RequestCache;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ErrorResponse {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

// Default error response when parsing fails
const DEFAULT_ERROR: ApiError = {
  code: "NETWORK_ERROR",
  message: "Network error occurred",
};

// Module-level auth token storage
let _authToken: string | null = null;

/**
 * Set the auth token for API requests.
 * Called by AuthProvider when session changes.
 */
export function setApiAuthToken(token: string | null): void {
  _authToken = token;
}

/**
 * Get the current auth token.
 */
export function getApiAuthToken(): string | null {
  return _authToken;
}

/**
 * Type guard to check if an object is an ErrorResponse
 */
function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    ("code" in value || "message" in value || "details" in value)
  );
}

class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = env.NEXT_PUBLIC_API_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Get authentication token from module-level storage
   */
  private getAuthToken(): string | null {
    return _authToken;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Build headers with auth token
   */
  private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API error responses
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: ApiError = DEFAULT_ERROR;

    try {
      // response.json() returns unknown, we validate it with type guard
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const raw = await response.json();
      if (isErrorResponse(raw)) {
        errorData = {
          code: raw.code ?? "UNKNOWN_ERROR",
          message: raw.message ?? `HTTP Error: ${String(response.status)}`,
          details: raw.details,
        };
      }
    } catch {
      // Keep default error data
      errorData = {
        code: "NETWORK_ERROR",
        message: response.statusText.length > 0 ? response.statusText : "Network error occurred",
      };
    }

    throw new ApiClientError(errorData, response.status);
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, config?.params);
    const headers = this.buildHeaders(config?.headers);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: config?.signal,
      cache: config?.cache,
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    // Parse JSON and cast to expected type
    // Note: We trust the API to return correctly typed responses
    // Runtime validation can be added if needed
    const data = (await response.json()) as ApiResponse<T>;
    return data;
  }

  // HTTP method shortcuts

  async get<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, undefined, config);
  }

  async post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body, config);
  }

  async put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body, config);
  }

  async patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body, config);
  }

  async delete<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, undefined, config);
  }
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly statusCode: number;

  constructor(error: ApiError, statusCode: number) {
    super(error.message);
    this.name = "ApiClientError";
    this.code = error.code;
    this.details = error.details;
    this.statusCode = statusCode;
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing
export { ApiClient };
