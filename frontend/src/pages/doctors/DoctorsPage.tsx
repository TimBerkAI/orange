import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { colors, typography } from "@/shared/config/theme";

export function DoctorsPage() {
  return (
    <div>
      <PageHeader
        title="Врачи"
        subtitle="Управление профилями и расписанием врачей"
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
          Раздел управления врачами в разработке
        </div>
      </Card>
    </div>
  );
}
