import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { updateProfile } from "@/domains/authorization/infrastructure/authApi";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { PhoneInput, isValidPhoneNumber } from "@/shared/ui/PhoneInput";
import { PageHeader } from "@/shared/ui/PageHeader";
import { colors, radius, spacing, typography } from "@/shared/config/theme";
import { parseApiFieldErrors } from "@/shared/api/httpClient";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.profile) {
      setFirstName(user.profile.first_name);
      setLastName(user.profile.last_name);
      setPatronymic(user.profile.patronymic);
      setPhone(user.profile.phone);
      setDateOfBirth(user.profile.date_of_birth ?? "");
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (phone && !isValidPhoneNumber(phone)) {
      setFieldErrors({ phone: "Введите корректный номер телефона" });
      return;
    }
    setSaving(true);
    setMessage("");
    setFieldErrors({});

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        patronymic,
        phone,
        date_of_birth: dateOfBirth || null,
      });
      await refreshUser();
      setMessage("Профиль обновлен");
    } catch (err: unknown) {
      const errors = parseApiFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      } else {
        setMessage("Ошибка при обновлении профиля");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Профиль" subtitle="Редактирование личных данных" />

      <Card style={{ maxWidth: 560 }}>
        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
            <Input
              label="Фамилия"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, last_name: "" })); }}
              required
              error={fieldErrors.last_name}
            />
            <Input
              label="Имя"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, first_name: "" })); }}
              required
              error={fieldErrors.first_name}
            />
          </div>

          <Input
            label="Отчество"
            value={patronymic}
            onChange={(e) => setPatronymic(e.target.value)}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
            <PhoneInput
              label="Телефон"
              value={phone}
              onChange={(v) => { setPhone(v); setFieldErrors((p) => ({ ...p, phone: "" })); }}
              error={fieldErrors.phone}
            />
            <Input
              label="Дата рождения"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.primaryLight,
              borderRadius: radius.md,
            }}
          >
            <span style={{ ...typography.caption, color: colors.textSecondary }}>
              Email:{" "}
            </span>
            <span style={{ ...typography.caption, color: colors.textPrimary, fontWeight: "500" }}>
              {user?.email}
            </span>
          </div>

          {message && (
            <div
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: radius.md,
                backgroundColor: message.includes("Ошибка")
                  ? colors.dangerLight
                  : colors.successLight,
                color: message.includes("Ошибка") ? colors.danger : colors.success,
                ...typography.caption,
              }}
            >
              {message}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: spacing.sm }}>
            <Button type="submit" loading={saving}>
              Сохранить
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
