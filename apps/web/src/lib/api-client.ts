export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8008/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;
  isNetworkError: boolean;

  constructor(message: string, status: number, data?: any, isNetworkError: boolean = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

export interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, retries = 2, ...fetchOptions } = options;
  const token = typeof window !== "undefined" ? localStorage.getItem("neroute_token") : null;

  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const method = (fetchOptions.method || "GET").toUpperCase();
  const isIdempotent = method === "GET" || method === "HEAD";
  const maxAttempts = isIdempotent ? Math.max(1, retries + 1) : 1;

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // If caller provided an abort signal, respect it
    if (fetchOptions.signal) {
      fetchOptions.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }

        // Retry on 502, 503, 504 for idempotent requests
        if (isIdempotent && [502, 503, 504].includes(response.status) && attempt < maxAttempts) {
          const delay = attempt * 600;
          await sleep(delay);
          continue;
        }

        const message =
          typeof errorData === "object" && errorData?.detail
            ? typeof errorData.detail === "string"
              ? errorData.detail
              : JSON.stringify(errorData.detail)
            : `Request failed with status ${response.status}`;

        throw new ApiError(message, response.status, errorData);
      }

      // Return JSON if present
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      return {} as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      const isAbort = error.name === "AbortError";
      const errMsg = isAbort
        ? `Request timed out after ${timeoutMs / 1000}s`
        : error.message || "Network connection error";

      lastError = new ApiError(errMsg, isAbort ? 408 : 0, null, true);

      // Retry network failures on idempotent requests
      if (isIdempotent && attempt < maxAttempts && !fetchOptions.signal?.aborted) {
        const delay = attempt * 500;
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new ApiError("Failed after retries", 0);
}
