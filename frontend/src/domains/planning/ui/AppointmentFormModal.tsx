import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { RichTextEditor } from "@/shared/ui/RichTextEditor";
import { colors, spacing, typography, radius } from "@/shared/config/theme";
import { listDoctors } from "@/domains/doctors/api";
import { parseApiError } from "@/shared/api/httpClient";
import type { Doctor } from "@/domains/doctors/types";
import type { FormEvent } from "react";

interface AppointmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    phone: string;
    patient_name: string;
    reason: string;
    doctor_id: number;
    start_at: string;
    end_at: string;
  }) => Promise<void>;
  initialData?: {
    phone?: string;
    patient_name?: string;
    reason?: string;
    doctor_id?: number;
    start_date?: string;
    start_time?: string;
    end_time?: string;
  };
  title?: string;
  submitLabel?: string;
}

function toLocalDatetime(isoDate: string, isoTime: string): string {
  return `${isoDate}T${isoTime}:00`;
}

export function AppointmentFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  title = "Новая запись",
  submitLabel = "Записать",
}: AppointmentFormModalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [phone, setPhone] = useState("");
  const [patientName, setPatientName] = useState("");
  const [reason, setReason] = useState("");
  const [doctorId, setDoctorId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      listDoctors().then(setDoctors).catch(() => null);
      setPhone(initialData?.phone ?? "");
      setPatientName(initialData?.patient_name ?? "");
      setReason(initialData?.reason ?? "");
      setDoctorId(initialData?.doctor_id ?? "");
      setStartDate(initialData?.start_date ?? new Date().toISOString().slice(0, 10));
      setStartTime(initialData?.start_time ?? "09:00");
      setEndTime(initialData?.end_time ?? "09:30");
      setError("");
    }
  }, [open, initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      setError("Выберите врача");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const startIso = new Date(toLocalDatetime(startDate, startTime)).toISOString();
      const endIso = new Date(toLocalDatetime(startDate, endTime)).toISOString();
      await onSubmit({
        phone,
        patient_name: patientName,
        reason,
        doctor_id: Number(doctorId),
        start_at: startIso,
        end_at: endIso,
      });
      onClose();
    } catch (err: unknown) {
      setError(parseApiError(err, "Ошибка при сохранении"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} width={480}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        <Input
          label="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (900) 123-45-67"
          required
        />
        <Input
          label="ФИО пациента"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="Иванов Иван Иванович"
          required
        />
        <div>
          <label
            style={{
              display: "block",
              fontSize: typography.caption.fontSize,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: "4px",
            }}
          >
            Причина обращения
          </label>
          <RichTextEditor
            value={reason}
            onChange={setReason}
            placeholder="Осмотр, лечение и т.д."
            minHeight={50}
            maxHeight={120}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: typography.caption.fontSize,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: "4px",
            }}
          >
            Врач
          </label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : "")}
            required
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: radius.md,
              border: `1px solid ${colors.border}`,
              fontSize: typography.body.fontSize,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              cursor: "pointer",
              outline: "none",
              boxSizing: "border-box",
            }}
          >
            <option value="">Выберите врача</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Дата"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="Начало"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="Окончание"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.dangerLight,
              color: colors.danger,
              borderRadius: radius.md,
              fontSize: typography.caption.fontSize,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={saving}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
