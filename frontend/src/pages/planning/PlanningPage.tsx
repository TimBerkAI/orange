import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { colors, typography } from "@/shared/config/theme";

export function PlanningPage() {
  return (
    <div>
      <PageHeader
        title="Планирование"
        subtitle="Управление расписанием и записями на прием"
      />
      <Card>
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: colors.textMuted,
            ...typography.body,
          }}
        >
          Раздел планирования в разработке
        </div>
      </Card>
    </div>
  );
}
