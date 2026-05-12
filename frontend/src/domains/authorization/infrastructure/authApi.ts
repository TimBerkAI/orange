import { apiFetch } from "@/shared/api/httpClient";
import type { AuthTokens, User, UserProfile } from "@/shared/types";

export function login(email: string, password: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(): Promise<User> {
  return apiFetch<User>("/auth/me/");
}

export function updateProfile(
  data: Partial<UserProfile>,
): Promise<User> {
  return apiFetch<User>("/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function refreshToken(refresh: string): Promise<{ access: string }> {
  return apiFetch<{ access: string }>("/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}
