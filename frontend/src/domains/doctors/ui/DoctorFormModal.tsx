import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { PhoneInput, isValidPhoneNumber } from "@/shared/ui/PhoneInput";
import { Modal } from "@/shared/ui/Modal";
import { RichTextEditor } from "@/shared/ui/RichTextEditor";
import { UserSearchInput } from "@/shared/ui/UserSearchInput";
import { colors, radius, spacing, typography } from "@/shared/config/theme";
import { parseApiFieldErrors } from "@/shared/api/httpClient";
import { ALL_WEEKDAYS, WEEKDAY_LABELS } from "../weekdays";
import type { Doctor, DoctorCreatePayload, NewUserPayload, Specialization } from "../types";

interface DoctorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: DoctorCreatePayload) => Promise<void>;
  onDelete?: () => Promise<void>;
  doctor?: Doctor | null;
  specializations: Specialization[];
}

type UserMode = "existing" | "new";

export function DoctorFormModal({
  open,
  onClose,
  onSave,
  onDelete,
  doctor,
  specializations,
}: DoctorFormModalProps) {
  const isEdit = !!doctor;

  const [userMode, setUserMode] = useState<UserMode>("new");
  const [userId, setUserId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(ALL_WEEKDAYS);
  const [selectedSpecs, setSelectedSpecs] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setUserMode("new");
      setUserId(doctor ? doctor.user.id : null);
      setEmail("");
      setFirstName("");
      setLastName("");
      setPatronymic("");
      setPhone("");
      setNotes(doctor?.notes ?? "");
      setSelectedWeekdays(doctor?.preferred_weekdays ?? ALL_WEEKDAYS);
      setSelectedSpecs(doctor?.specializations.map((s) => s.id) ?? []);
      setFieldErrors({});
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
    if (!isEdit && userMode === "new" && phone && !isValidPhoneNumber(phone)) {
      setFieldErrors({ phone: "Введите корректный номер телефона" });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const payload: DoctorCreatePayload = {
        specialization_ids: selectedSpecs,
        notes,
        preferred_weekdays: selectedWeekdays,
      };
      if (!isEdit) {
        if (userMode === "existing") {
          payload.user_id = userId ?? undefined;
        } else {
          const newUser: NewUserPayload = {
            email,
            first_name: firstName,
            last_name: lastName,
          };
          if (patronymic) newUser.patronymic = patronymic;
          if (phone) newUser.phone = phone;
          payload.new_user = newUser;
        }
      }
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      setFieldErrors(parseApiFieldErrors(err));
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
      setFieldErrors({ _general: "Ошибка при удалении" });
    } finally {
      setDeleting(false);
    }
  };

  const tabStyle = (active: boolean) => ({
    padding: "6px 14px",
    border: `1px solid ${active ? colors.primary : colors.border}`,
    borderRadius: radius.md,
    backgroundColor: active ? colors.primaryLight : colors.surface,
    color: active ? colors.primaryDark : colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: "500" as const,
    cursor: "pointer" as const,
    transition: "all 0.15s ease",
  });

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
          <div>
            <div
              style={{
                fontSize: typography.caption.fontSize,
                fontWeight: "500",
                color: colors.textSecondary,
                marginBottom: spacing.sm,
              }}
            >
              Пользователь
            </div>
            <div style={{ display: "flex", gap: spacing.xs, marginBottom: spacing.sm }}>
              <button
                type="button"
                onClick={() => setUserMode("new")}
                style={tabStyle(userMode === "new")}
              >
                Создать нового
              </button>
              <button
                type="button"
                onClick={() => setUserMode("existing")}
                style={tabStyle(userMode === "existing")}
              >
                Поиск пользователя
              </button>
            </div>

            {userMode === "existing" ? (
              <UserSearchInput
                label="Поиск пользователя"
                value={userId}
                onChange={(id) => setUserId(id)}
                placeholder="Введите email, ФИО или телефон..."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                  placeholder="doctor@clinic.ru"
                  required
                  error={fieldErrors.email}
                />
                <div style={{ display: "flex", gap: spacing.sm }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Фамилия"
                      value={lastName}
                      onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, last_name: "" })); }}
                      placeholder="Иванов"
                      required
                      error={fieldErrors.last_name}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Имя"
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, first_name: "" })); }}
                      placeholder="Иван"
                      required
                      error={fieldErrors.first_name}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: spacing.sm }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Отчество"
                      value={patronymic}
                      onChange={(e) => setPatronymic(e.target.value)}
                      placeholder="Иванович"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <PhoneInput
                      label="Телефон"
                      value={phone}
                      onChange={(v) => { setPhone(v); setFieldErrors((p) => ({ ...p, phone: "" })); }}
                      error={fieldErrors.phone}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
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
          <RichTextEditor
            value={notes}
            onChange={setNotes}
            placeholder="Заметки о враче"
            minHeight={60}
          />
        </div>

        {fieldErrors._general && (
          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.dangerLight,
              color: colors.danger,
              borderRadius: "8px",
              fontSize: typography.caption.fontSize,
            }}
          >
            {fieldErrors._general}
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
