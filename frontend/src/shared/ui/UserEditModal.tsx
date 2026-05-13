import { type FormEvent, useEffect, useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { colors, radius, spacing, typography } from "@/shared/config/theme";
import { updateUser } from "@/domains/authorization/infrastructure/authApi";
import { parseApiError } from "@/shared/api/httpClient";
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
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && user) {
      setFirstName(user.profile?.first_name ?? "");
      setLastName(user.profile?.last_name ?? "");
      setPatronymic(user.profile?.patronymic ?? "");
      setPhone(user.profile?.phone ?? "");
      setDateOfBirth(user.profile?.date_of_birth ?? "");
      setEmail(user.email);
      setError("");
    }
  }, [open, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
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
      setError(parseApiError(err, "Ошибка при сохранении"));
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
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div style={{ display: "flex", gap: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <Input label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Иванов" />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Иван" />
          </div>
        </div>

        <div style={{ display: "flex", gap: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <Input label="Отчество" value={patronymic} onChange={(e) => setPatronymic(e.target.value)} placeholder="Иванович" />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (900) 123-45-67" />
          </div>
        </div>

        <Input
          label="Дата рождения"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />

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
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="submit" loading={saving}>Сохранить</Button>
        </div>
      </form>
    </Modal>
  );
}
