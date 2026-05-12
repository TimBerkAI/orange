import { type CSSProperties, type ReactNode } from "react";
import { colors, radius, shadows, spacing } from "@/shared/config/theme";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Card({ children, style }: CardProps) {
  const cardStyle: CSSProperties = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    border: `1px solid ${colors.borderLight}`,
    boxShadow: shadows.sm,
    padding: spacing.lg,
    ...style,
  };

  return <div style={cardStyle}>{children}</div>;
}
