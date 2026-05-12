import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { updateProfile } from "@/domains/authorization/infrastructure/authApi";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { PageHeader } from "@/shared/ui/PageHeader";
import { colors, radius, spacing, typography } from "@/shared/config/theme";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
    setSaving(true);
    setMessage("");

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
    } catch {
      setMessage("Ошибка при обновлении профиля");
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
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <Input
              label="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Отчество"
            value={patronymic}
            onChange={(e) => setPatronymic(e.target.value)}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
            <Input
              label="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
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
