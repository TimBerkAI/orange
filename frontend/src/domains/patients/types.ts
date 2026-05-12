export interface Tooth {
  id: number;
  number: number;
  name: string;
}

export interface PatientUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  patronymic: string;
  phone: string;
  date_of_birth: string | null;
}

export interface Patient {
  id: number;
  user: PatientUser;
  full_name: string;
  allergies: string;
  status: "active" | "archived";
  created_at: string;
  updated_at?: string;
  last_visit?: {
    id: number;
    scheduled_at: string;
    status: string;
  } | null;
}

export interface VisitTooth {
  id: number;
  number: number;
  name: string;
}

export interface DoctorBrief {
  id: number;
  full_name: string;
  email: string;
}

export interface Visit {
  id: number;
  patient_id: number;
  scheduled_at: string;
  doctor: DoctorBrief;
  reason: string;
  teeth: VisitTooth[];
  status: "planned" | "confirmed" | "cancelled";
  has_odontogram: boolean;
  has_soap: boolean;
  created_at: string;
  updated_at?: string;
}

export interface OdontogramEntry {
  id: number;
  tooth: Tooth;
  status: ToothStatusValue;
}

export interface Odontogram {
  id: number;
  visit_id: number;
  entries: OdontogramEntry[];
}

export interface SoapNote {
  id: number;
  visit_id: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export type ToothStatusValue =
  | "healthy"
  | "caries"
  | "treated"
  | "crown"
  | "extracted"
  | "implant"
  | "filling";
