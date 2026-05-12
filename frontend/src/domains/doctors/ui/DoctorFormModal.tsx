import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { colors, spacing, typography } from "@/shared/config/theme";
import { ALL_WEEKDAYS, WEEKDAY_LABELS } from "../weekdays";
import type { Doctor, Specialization } from "../types";

interface DoctorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    user_id?: number;
    specialization_ids: number[];
    notes: string;
    preferred_weekdays: number[];
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  doctor?: Doctor | null;
  specializations: Specialization[];
}

export function DoctorFormModal({
  open,
  onClose,
  onSave,
  onDelete,
  doctor,
  specializations,
}: DoctorFormModalProps) {
  const isEdit = !!doctor;

  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(ALL_WEEKDAYS);
  const [selectedSpecs, setSelectedSpecs] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setUserId(doctor ? String(doctor.user.id) : "");
      setNotes(doctor?.notes ?? "");
      setSelectedWeekdays(doctor?.preferred_weekdays ?? ALL_WEEKDAYS);
      setSelectedSpecs(doctor?.specializations.map((s) => s.id) ?? []);
      setError("");
      setConfirmDelete(false);
    }
  }, [open, doctor]);

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const toggleSpec = (id: number) => {
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({
        ...(!isEdit ? { user_id: Number(userId) } : {}),
        specialization_ids: selectedSpecs,
        notes,
        preferred_weekdays: selectedWeekdays,
      });
      onClose();
    } catch (err: unknown) {
      const detail = (err as Record<string, unknown>)?.detail;
      setError(typeof detail === "string" ? detail : "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete!();
      onClose();
    } catch {
      setError("Ошибка при удалении");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Редактировать врача" : "Добавить врача"}
      width={540}
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        {!isEdit && (
          <Input
            label="ID пользователя"
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Введите ID пользователя"
            required
          />
        )}

        {isEdit && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.primaryLight,
              borderRadius: "8px",
            }}
          >
            <div style={{ ...typography.caption, color: colors.textSecondary }}>Врач</div>
            <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: "500" }}>
              {doctor!.full_name || doctor!.user.email}
            </div>
            <div style={{ ...typography.caption, color: colors.textMuted }}>{doctor!.user.email}</div>
          </div>
        )}

        <div>
          <div
            style={{
              fontSize: typography.caption.fontSize,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: "8px",
            }}
          >
            Рабочие дни
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {Object.entries(WEEKDAY_LABELS).map(([day, label]) => {
              const d = Number(day);
              const active = selectedWeekdays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleWeekday(d)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: `1px solid ${active ? colors.primary : colors.border}`,
                    backgroundColor: active ? colors.primaryLight : colors.surface,
                    color: active ? colors.primaryDark : colors.textSecondary,
                    fontSize: typography.caption.fontSize,
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {specializations.length > 0 && (
          <div>
            <div
              style={{
                fontSize: typography.caption.fontSize,
                fontWeight: "500",
                color: colors.textSecondary,
                marginBottom: "8px",
              }}
            >
              Специальности
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {specializations.map((spec) => {
                const active = selectedSpecs.includes(spec.id);
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => toggleSpec(spec.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${active ? colors.primary : colors.border}`,
                      backgroundColor: active ? colors.primaryLight : colors.surface,
                      color: active ? colors.primaryDark : colors.textSecondary,
                      fontSize: typography.caption.fontSize,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {spec.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label
            style={{
              display: "block",
              fontSize: typography.caption.fontSize,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: "6px",
            }}
          >
            Заметки
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              fontSize: typography.body.fontSize,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: "1.5",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.dangerLight,
              color: colors.danger,
              borderRadius: "8px",
              fontSize: typography.caption.fontSize,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "space-between", marginTop: spacing.xs }}>
          {isEdit && onDelete && (
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              {confirmDelete ? "Подтвердить удаление" : "Удалить"}
            </Button>
          )}
          <div style={{ display: "flex", gap: spacing.sm, marginLeft: "auto" }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? "Сохранить" : "Добавить"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
