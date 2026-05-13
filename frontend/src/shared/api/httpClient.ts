import { API_BASE_URL } from "@/shared/config/api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/domains/authorization/infrastructure/tokenStorage";

/**
 * Extracts a human-readable Russian error message from a DRF error response.
 * Handles: { detail }, { non_field_errors }, { field: [msg] }, plain strings.
 */
export function parseApiError(err: unknown, fallback = "Произошла ошибка"): string {
  if (!err || typeof err !== "object") return fallback;
  const e = err as Record<string, unknown>;

  if (typeof e.detail === "string") return e.detail;

  if (Array.isArray(e.non_field_errors) && e.non_field_errors.length > 0) {
    return String(e.non_field_errors[0]);
  }

  const fieldMessages: string[] = [];
  for (const [key, val] of Object.entries(e)) {
    if (key === "status") continue;
    if (Array.isArray(val) && val.length > 0) {
      fieldMessages.push(`${key}: ${String(val[0])}`);
    } else if (typeof val === "string") {
      fieldMessages.push(val);
    }
  }
  if (fieldMessages.length > 0) return fieldMessages.join("; ");

  return fallback;
}

/**
 * Returns a map of field name → first error message from a DRF validation error response.
 * Also returns a `_general` key for non-field errors.
 */
export function parseApiFieldErrors(err: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!err || typeof err !== "object") return result;
  const e = err as Record<string, unknown>;

  if (typeof e.detail === "string") {
    result._general = e.detail;
    return result;
  }

  for (const [key, val] of Object.entries(e)) {
    if (key === "status") continue;
    if (key === "non_field_errors" && Array.isArray(val) && val.length > 0) {
      result._general = String(val[0]);
    } else if (Array.isArray(val) && val.length > 0) {
      result[key] = String(val[0]);
    } else if (typeof val === "string") {
      result[key] = val;
    }
  }

  return result;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as { access: string; refresh?: string };
  const newRefresh = data.refresh ?? refresh;
  setTokens(data.access, newRefresh);
  return data.access;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, ...error };
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}
