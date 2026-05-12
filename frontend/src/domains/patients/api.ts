import { apiFetch } from "@/shared/api/httpClient";
import type { Odontogram, Patient, SoapNote, Tooth, Visit } from "./types";

export function listTeeth(): Promise<Tooth[]> {
  return apiFetch("/patients/teeth/");
}

export function listPatients(search?: string): Promise<Patient[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/patients/${params}`);
}

export function getPatient(id: number): Promise<Patient> {
  return apiFetch(`/patients/${id}/`);
}

export function createPatient(data: {
  user_id: number;
  allergies?: string;
  status?: string;
}): Promise<Patient> {
  return apiFetch("/patients/", { method: "POST", body: JSON.stringify(data) });
}

export function updatePatient(
  id: number,
  data: { user_id?: number; allergies?: string; status?: string },
): Promise<Patient> {
  return apiFetch(`/patients/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deletePatient(id: number): Promise<void> {
  return apiFetch(`/patients/${id}/`, { method: "DELETE" });
}

export function listVisits(patientId: number): Promise<Visit[]> {
  return apiFetch(`/patients/${patientId}/visits/`);
}

export function createVisit(
  patientId: number,
  data: {
    doctor_id: number;
    start_at: string;
    end_at: string;
    reason?: string;
    tooth_ids?: number[];
    status?: string;
  },
): Promise<Visit> {
  return apiFetch(`/patients/${patientId}/visits/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getVisit(visitId: number): Promise<Visit> {
  return apiFetch(`/patients/visits/${visitId}/`);
}

export function updateVisit(
  visitId: number,
  data: {
    doctor_id?: number;
    start_at?: string;
    end_at?: string;
    reason?: string;
    tooth_ids?: number[];
    status?: string;
  },
): Promise<Visit> {
  return apiFetch(`/patients/visits/${visitId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getOdontogram(visitId: number): Promise<Odontogram> {
  return apiFetch(`/patients/visits/${visitId}/odontogram/`);
}

export function updateOdontogramEntry(
  visitId: number,
  toothId: number,
  status: string,
): Promise<Odontogram> {
  return apiFetch(`/patients/visits/${visitId}/odontogram/`, {
    method: "PATCH",
    body: JSON.stringify({ tooth_id: toothId, status }),
  });
}

export function getSoapNote(visitId: number): Promise<SoapNote> {
  return apiFetch(`/patients/visits/${visitId}/soap/`);
}

export function updateSoapNote(
  visitId: number,
  data: Partial<Record<"subjective" | "objective" | "assessment" | "plan", string>>,
): Promise<SoapNote> {
  return apiFetch(`/patients/visits/${visitId}/soap/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
