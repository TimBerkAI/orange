import type { ToothStatusValue } from "./types";

export const TOOTH_STATUS_LABELS: Record<ToothStatusValue, string> = {
  healthy: "Здоровый",
  caries: "Кариес",
  treated: "Пролечен",
  crown: "Коронка",
  extracted: "Удален",
  implant: "Имплант",
  filling: "Пломба",
};

export const TOOTH_STATUS_COLORS: Record<ToothStatusValue, string> = {
  healthy: "#FFFFFF",
  caries: "#FDE68A",
  treated: "#BBF7D0",
  crown: "#BFDBFE",
  extracted: "#E5E7EB",
  implant: "#99F6E4",
  filling: "#FED7AA",
};

export const TOOTH_STATUS_BORDER: Record<ToothStatusValue, string> = {
  healthy: "#D1D5DB",
  caries: "#F59E0B",
  treated: "#16A34A",
  crown: "#3B82F6",
  extracted: "#9CA3AF",
  implant: "#14B8A6",
  filling: "#F97316",
};

export const VISIT_STATUS_LABELS: Record<string, string> = {
  planned: "Запланировано",
  confirmed: "Подтверждено",
  cancelled: "Отменено",
};

export const VISIT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  planned: { bg: "#DBEAFE", text: "#1E40AF" },
  confirmed: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

export const PATIENT_STATUS_LABELS: Record<string, string> = {
  active: "Активный",
  archived: "Архивный",
};

export const SOAP_TABS = [
  { key: "subjective", label: "S", title: "Субъективно" },
  { key: "objective", label: "O", title: "Объективно" },
  { key: "assessment", label: "A", title: "Оценка" },
  { key: "plan", label: "P", title: "План" },
] as const;
