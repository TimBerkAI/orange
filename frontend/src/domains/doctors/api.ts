import { apiFetch } from "@/shared/api/httpClient";
import type { PaginatedResponse } from "@/shared/types";
import type {
  Doctor,
  DoctorCreatePayload,
  DoctorSelfUpdatePayload,
  DoctorUpdatePayload,
  Specialization,
} from "./types";

export interface DoctorListParams {
  search?: string;
  page?: number;
  page_size?: number;
}

export function listDoctors(searchOrParams?: string | DoctorListParams): Promise<Doctor[]> {
  if (typeof searchOrParams === "string" || searchOrParams === undefined) {
    const params = searchOrParams ? `?search=${encodeURIComponent(searchOrParams)}&page_size=200` : "?page_size=200";
    return apiFetch<PaginatedResponse<Doctor>>(`/doctors/${params}`).then((r) => r.results);
  }
  const q = new URLSearchParams();
  if (searchOrParams.search) q.set("search", searchOrParams.search);
  if (searchOrParams.page) q.set("page", String(searchOrParams.page));
  if (searchOrParams.page_size) q.set("page_size", String(searchOrParams.page_size));
  return apiFetch<PaginatedResponse<Doctor>>(`/doctors/?${q.toString()}`).then((r) => r.results);
}

export function listDoctorsPaginated(params?: DoctorListParams): Promise<PaginatedResponse<Doctor>> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  q.set("page_size", String(params?.page_size ?? 25));
  return apiFetch<PaginatedResponse<Doctor>>(`/doctors/?${q.toString()}`);
}

export function getDoctor(id: number): Promise<Doctor> {
  return apiFetch(`/doctors/${id}/`);
}

export function createDoctor(data: DoctorCreatePayload): Promise<Doctor> {
  return apiFetch("/doctors/", { method: "POST", body: JSON.stringify(data) });
}

export function updateDoctor(id: number, data: DoctorUpdatePayload): Promise<Doctor> {
  return apiFetch(`/doctors/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteDoctor(id: number): Promise<void> {
  return apiFetch(`/doctors/${id}/`, { method: "DELETE" });
}

export function getDoctorMe(): Promise<Doctor> {
  return apiFetch("/doctors/me/");
}

export function updateDoctorMe(data: DoctorSelfUpdatePayload): Promise<Doctor> {
  return apiFetch("/doctors/me/", { method: "PATCH", body: JSON.stringify(data) });
}

export function listSpecializations(): Promise<Specialization[]> {
  return apiFetch<Specialization[] | { results: Specialization[] }>("/doctors/specializations/").then(
    (r) => (Array.isArray(r) ? r : r.results ?? []),
  );
}

export function createSpecialization(data: { name: string; description: string }): Promise<Specialization> {
  return apiFetch("/doctors/specializations/", { method: "POST", body: JSON.stringify(data) });
}

export function updateSpecialization(
  id: number,
  data: { name?: string; description?: string },
): Promise<Specialization> {
  return apiFetch(`/doctors/specializations/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteSpecialization(id: number): Promise<void> {
  return apiFetch(`/doctors/specializations/${id}/`, { method: "DELETE" });
}
