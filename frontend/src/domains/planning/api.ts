import { apiFetch } from "@/shared/api/httpClient";
import type { Appointment, AppointmentCreatePayload, AppointmentUpdatePayload } from "./types";

export interface AppointmentListParams {
  date_from?: string;
  date_to?: string;
  doctor_id?: number;
  search?: string;
}

export function listAppointments(params?: AppointmentListParams): Promise<Appointment[]> {
  const query = new URLSearchParams();
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
  if (params?.doctor_id) query.set("doctor_id", String(params.doctor_id));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return apiFetch(`/planning/appointments/${qs ? `?${qs}` : ""}`);
}

export function getAppointment(id: number): Promise<Appointment> {
  return apiFetch(`/planning/appointments/${id}/`);
}

export function createAppointment(data: AppointmentCreatePayload): Promise<Appointment> {
  return apiFetch("/planning/appointments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAppointment(
  id: number,
  data: AppointmentUpdatePayload,
): Promise<Appointment> {
  return apiFetch(`/planning/appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAppointment(id: number): Promise<void> {
  return apiFetch(`/planning/appointments/${id}/`, { method: "DELETE" });
}

export interface DashboardStats {
  today_confirmed: number;
  tomorrow_pending: number;
}

export function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/planning/stats/");
}
