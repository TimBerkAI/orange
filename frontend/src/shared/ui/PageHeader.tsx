import { type CSSProperties, type ReactNode } from "react";
import { colors, spacing, typography } from "@/shared/config/theme";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const containerStyle: CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    flexWrap: "wrap",
    gap: spacing.sm,
  };

  const titleStyle: CSSProperties = {
    ...typography.heading,
    color: colors.textPrimary,
    margin: 0,
  };

  const subtitleStyle: CSSProperties = {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  };

  return (
    <div style={containerStyle}>
      <div style={{ minWidth: 0 }}>
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
