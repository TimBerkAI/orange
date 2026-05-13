import { apiFetch } from "@/shared/api/httpClient";
import type {
  Doctor,
  DoctorCreatePayload,
  DoctorSelfUpdatePayload,
  DoctorUpdatePayload,
  Specialization,
} from "./types";

export function listDoctors(search?: string): Promise<Doctor[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/doctors/${params}`);
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
  return apiFetch("/doctors/specializations/");
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
