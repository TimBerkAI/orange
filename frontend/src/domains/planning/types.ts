export interface AppointmentDoctor {
  id: number;
  full_name: string;
  email: string;
}

export interface AppointmentPatient {
  id: number;
  full_name: string;
}

export interface Appointment {
  id: number;
  phone: string;
  patient_name: string;
  reason: string;
  doctor: AppointmentDoctor;
  patient: AppointmentPatient;
  start_at: string;
  end_at: string;
  visit_id: number;
  visit_status: "planned" | "confirmed"| "completed" | "cancelled";
  created_at: string;
  created_by_email?: string | null;
  updated_at?: string;
}

export interface AppointmentCreatePayload {
  phone: string;
  patient_name: string;
  reason?: string;
  doctor_id: number;
  start_at: string;
  end_at: string;
}

export interface AppointmentUpdatePayload {
  reason?: string;
  doctor_id?: number;
  start_at?: string;
  end_at?: string;
}
