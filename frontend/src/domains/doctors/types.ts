export interface Specialization {
  id: number;
  name: string;
  description: string;
}

export interface DoctorUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  patronymic: string;
}

export interface Doctor {
  id: number;
  user: DoctorUser;
  full_name: string;
  specializations: Specialization[];
  notes: string;
  preferred_weekdays: number[];
  created_at: string;
  updated_at?: string;
}

export interface NewUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  patronymic?: string;
  phone?: string;
}

export interface DoctorCreatePayload {
  user_id?: number;
  new_user?: NewUserPayload;
  specialization_ids?: number[];
  notes?: string;
  preferred_weekdays?: number[];
}

export interface DoctorUpdatePayload {
  user_id?: number;
  specialization_ids?: number[];
  notes?: string;
  preferred_weekdays?: number[];
}

export interface DoctorSelfUpdatePayload {
  specialization_ids?: number[];
  notes?: string;
  preferred_weekdays?: number[];
}
