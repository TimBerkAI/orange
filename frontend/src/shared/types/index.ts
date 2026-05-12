export type Role = "admin" | "doctor" | "patient";

export interface UserProfile {
  first_name: string;
  last_name: string;
  patronymic: string;
  phone: string;
  date_of_birth: string | null;
}

export interface User {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
  date_joined: string;
  profile: UserProfile;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}
