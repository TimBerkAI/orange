import { useAuth } from "@/domains/authorization/application/AuthContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { colors, spacing, typography } from "@/shared/config/theme";

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  doctor: "Врач",
  patient: "Пациент",
};

export function DashboardPage() {
  const { user } = useAuth();

  const greeting = user?.profile.first_name
    ? `${user.profile.first_name} ${user.profile.patronymic ?? ""}`.trim()
    : user?.email;

  return (
    <div>
      <PageHeader
        title={`Добро пожаловать, ${greeting}`}
        subtitle="Рабочее пространство Dental Office"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: spacing.md,
        }}
      >
        <Card>
          <div style={{ ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm }}>
            Ваша роль
          </div>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "9999px",
              backgroundColor: colors.primaryLight,
              color: colors.primaryDark,
              fontSize: typography.caption.fontSize,
              fontWeight: "500",
            }}
          >
            {roleLabels[user?.role ?? ""] ?? user?.role}
          </div>
        </Card>

        <Card>
          <div style={{ ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm }}>
            Email
          </div>
          <div style={{ ...typography.body, color: colors.textSecondary }}>
            {user?.email}
          </div>
        </Card>

        <Card>
          <div style={{ ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm }}>
            Дата регистрации
          </div>
          <div style={{ ...typography.body, color: colors.textSecondary }}>
            {user?.date_joined
              ? new Date(user.date_joined).toLocaleDateString("ru-RU")
              : "---"}
          </div>
        </Card>
      </div>
    </div>
  );
}
