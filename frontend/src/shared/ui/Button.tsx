import { type ButtonHTMLAttributes, type CSSProperties } from "react";
import { colors, radius, typography } from "@/shared/config/theme";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    backgroundColor: colors.primary,
    color: "#ffffff",
    border: "none",
  },
  secondary: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
  },
  danger: {
    backgroundColor: colors.danger,
    color: "#ffffff",
    border: "none",
  },
  ghost: {
    backgroundColor: "transparent",
    color: colors.textSecondary,
    border: "none",
  },
};

export function Button({
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: radius.md,
    fontSize: typography.body.fontSize,
    fontWeight: "500",
    lineHeight: "1.5",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "all 0.15s ease",
    width: fullWidth ? "100%" : "auto",
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button disabled={disabled || loading} style={baseStyle} {...props}>
      {loading ? "..." : children}
    </button>
  );
}
