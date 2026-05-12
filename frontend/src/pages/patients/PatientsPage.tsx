import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { colors, typography } from "@/shared/config/theme";

export function PatientsPage() {
  return (
    <div>
      <PageHeader
        title="Пациенты"
        subtitle="Управление карточками пациентов"
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
          Раздел управления пациентами в разработке
        </div>
      </Card>
    </div>
  );
}
