import { apiFetch } from "@/shared/api/httpClient";
import type { AuthTokens, PaginatedResponse, User, UserProfile } from "@/shared/types";

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

export function searchUsers(search: string): Promise<User[]> {
  return apiFetch<PaginatedResponse<User>>(`/auth/users/?search=${encodeURIComponent(search)}&page_size=50`).then((r) => r.results);
}

export function listUsers(params?: { search?: string; page?: number; page_size?: number }): Promise<PaginatedResponse<User>> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  q.set("page_size", String(params?.page_size ?? 50));
  return apiFetch<PaginatedResponse<User>>(`/auth/users/?${q.toString()}`);
}

export function createUser(data: {
  email: string;
  password?: string;
  role: string;
  first_name: string;
  last_name: string;
  patronymic?: string;
  phone?: string;
  date_of_birth?: string | null;
}): Promise<User> {
  return apiFetch<User>("/auth/users/", { method: "POST", body: JSON.stringify(data) });
}

export function updateUser(
  id: number,
  data: {
    email?: string;
    role?: string;
    is_active?: boolean;
    password?: string;
    first_name?: string;
    last_name?: string;
    patronymic?: string;
    phone?: string;
    date_of_birth?: string | null;
  },
): Promise<User> {
  return apiFetch<User>(`/auth/users/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteUser(id: number): Promise<void> {
  return apiFetch<void>(`/auth/users/${id}/`, { method: "DELETE" });
}
