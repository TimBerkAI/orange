import { useEffect, useState } from "react";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { colors, radius, spacing, typography } from "@/shared/config/theme";
import { getDashboardStats, type DashboardStats } from "@/domains/planning/api";
import { getVisitStats, type VisitStatEntry } from "@/domains/patients/api";

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  doctor: "Врач",
  patient: "Пациент",
};

function StatCard({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: number;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
        <div style={{ ...typography.caption, color: colors.textSecondary }}>{label}</div>
        <div
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color,
            lineHeight: "1",
            letterSpacing: "-1px",
          }}
        >
          {loading ? "—" : value}
        </div>
      </div>
    </Card>
  );
}

function VisitStatsChart({
  data,
  loading,
}: {
  data: VisitStatEntry[];
  loading: boolean;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const barWidth = data.length > 0 ? Math.floor(100 / data.length) : 10;

  const firstEntry = data[0];
  const lastEntry = data[data.length - 1];

  return (
    <div>
      {loading ? (
        <div
          style={{
            height: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.textMuted,
            ...typography.caption,
          }}
        >
          Загрузка...
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: 160 }}>
          {data.map((entry) => {
            const heightPct = (entry.count / maxCount) * 100;
            const barH = Math.max(heightPct * 1.4, entry.count > 0 ? 4 : 0);
            return (
              <div
                key={entry.date}
                title={`${formatDate(entry.date)}: ${entry.count}`}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${barH}px`,
                    backgroundColor: entry.count > 0 ? colors.primary : colors.borderLight,
                    borderRadius: `${radius.sm} ${radius.sm} 0 0`,
                    transition: "background-color 0.15s",
                    minHeight: entry.count > 0 ? "4px" : "2px",
                  }}
                />
                {data.length <= 14 && (
                  <div
                    style={{
                      fontSize: "9px",
                      color: colors.textMuted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: `${barWidth + 4}px`,
                      textAlign: "center",
                    }}
                  >
                    {new Date(entry.date).getDate()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!loading && firstEntry && lastEntry && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: spacing.xs,
          }}
        >
          <span style={{ ...typography.caption, color: colors.textMuted, fontSize: "10px" }}>
            {formatDate(firstEntry.date)}
          </span>
          <span style={{ ...typography.caption, color: colors.textMuted, fontSize: "10px" }}>
            {formatDate(lastEntry.date)}
          </span>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const isAdminOrDoctor = user?.role === "admin" || user?.role === "doctor";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [visitData, setVisitData] = useState<VisitStatEntry[]>([]);
  const [visitPeriod, setVisitPeriod] = useState<"week" | "month">("week");
  const [visitLoading, setVisitLoading] = useState(true);

  const greeting = user?.profile?.first_name
    ? `${user.profile.first_name} ${user.profile.patronymic ?? ""}`.trim()
    : user?.email;

  useEffect(() => {
    if (!isAdminOrDoctor) return;
    setStatsLoading(true);
    getDashboardStats()
      .then(setStats)
      .finally(() => setStatsLoading(false));
  }, [isAdminOrDoctor]);

  useEffect(() => {
    if (!isAdminOrDoctor) return;
    setVisitLoading(true);
    getVisitStats(visitPeriod)
      .then(setVisitData)
      .finally(() => setVisitLoading(false));
  }, [visitPeriod, isAdminOrDoctor]);

  return (
    <div>
      <PageHeader
        title={`Добро пожаловать, ${greeting}`}
        subtitle="Рабочее пространство Orange Office"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <Card>
          <div
            style={{
              ...typography.subheading,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
            }}
          >
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
          <div
            style={{
              ...typography.subheading,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
            }}
          >
            Email
          </div>
          <div style={{ ...typography.body, color: colors.textSecondary }}>{user?.email}</div>
        </Card>

        <Card>
          <div
            style={{
              ...typography.subheading,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
            }}
          >
            Дата регистрации
          </div>
          <div style={{ ...typography.body, color: colors.textSecondary }}>
            {user?.date_joined ? new Date(user.date_joined).toLocaleDateString("ru-RU") : "---"}
          </div>
        </Card>

        {isAdminOrDoctor && (
          <StatCard
            label="Подтверждённые сегодня"
            value={stats?.today_confirmed ?? 0}
            color={colors.success}
            loading={statsLoading}
          />
        )}

        {isAdminOrDoctor && (
          <StatCard
            label="Ожидают подтверждения"
            value={stats?.tomorrow_pending ?? 0}
            color={colors.primary}
            loading={statsLoading}
          />
        )}
      </div>

      {isAdminOrDoctor && (
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: spacing.md,
            }}
          >
            <div style={{ ...typography.subheading, color: colors.textPrimary }}>
              Статистика посещений
            </div>
            <div
              style={{
                display: "flex",
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                overflow: "hidden",
              }}
            >
              {(["week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setVisitPeriod(p)}
                  style={{
                    padding: "5px 14px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: typography.caption.fontSize,
                    fontWeight: visitPeriod === p ? "600" : "400",
                    backgroundColor: visitPeriod === p ? colors.primary : "transparent",
                    color: visitPeriod === p ? "#fff" : colors.textSecondary,
                    transition: "all 0.15s ease",
                  }}
                >
                  {p === "week" ? "Неделя" : "Месяц"}
                </button>
              ))}
            </div>
          </div>
          <VisitStatsChart data={visitData} loading={visitLoading} />
        </Card>
      )}
    </div>
  );
}
