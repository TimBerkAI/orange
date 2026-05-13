import { type FormEvent, useEffect, useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { PhoneInput, isValidPhoneNumber } from "@/shared/ui/PhoneInput";
import { colors, radius, spacing, typography } from "@/shared/config/theme";
import { updateUser } from "@/domains/authorization/infrastructure/authApi";
import { parseApiFieldErrors } from "@/shared/api/httpClient";
import type { User } from "@/shared/types";

interface UserEditModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: (updated: User) => void;
}

export function UserEditModal({ open, user, onClose, onSaved }: UserEditModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && user) {
      setFirstName(user.profile?.first_name ?? "");
      setLastName(user.profile?.last_name ?? "");
      setPatronymic(user.profile?.patronymic ?? "");
      setPhone(user.profile?.phone ?? "");
      setDateOfBirth(user.profile?.date_of_birth ?? "");
      setEmail(user.email);
      setFieldErrors({});
    }
  }, [open, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (phone && !isValidPhoneNumber(phone)) {
      setFieldErrors({ phone: "Введите корректный номер телефона" });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      const updated = await updateUser(user.id, {
        email,
        first_name: firstName,
        last_name: lastName,
        patronymic,
        phone,
        date_of_birth: dateOfBirth || null,
      });
      onSaved(updated);
    } catch (err: unknown) {
      setFieldErrors(parseApiFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title="Редактировать пользователя" width={460}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
          required
          error={fieldErrors.email}
        />

        <div style={{ display: "flex", gap: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <Input label="Фамилия" value={lastName} onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, last_name: "" })); }} placeholder="Иванов" error={fieldErrors.last_name} />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="Имя" value={firstName} onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, first_name: "" })); }} placeholder="Иван" error={fieldErrors.first_name} />
          </div>
        </div>

        <div style={{ display: "flex", gap: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <Input label="Отчество" value={patronymic} onChange={(e) => setPatronymic(e.target.value)} placeholder="Иванович" />
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

        <Input
          label="Дата рождения"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />

        {fieldErrors._general && (
          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.dangerLight,
              color: colors.danger,
              borderRadius: radius.md,
              fontSize: typography.caption.fontSize,
            }}
          >
            {fieldErrors._general}
          </div>
        )}

        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="submit" loading={saving}>Сохранить</Button>
        </div>
      </form>
    </Modal>
  );
}
