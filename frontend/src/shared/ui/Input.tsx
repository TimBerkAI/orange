import { type CSSProperties, type InputHTMLAttributes } from "react";
import { colors, radius, typography } from "@/shared/config/theme";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, style, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };

  const labelStyle: CSSProperties = {
    fontSize: typography.caption.fontSize,
    fontWeight: "500",
    color: colors.textSecondary,
  };

  const inputStyle: CSSProperties = {
    padding: "10px 14px",
    borderRadius: radius.md,
    border: `1px solid ${error ? colors.danger : colors.border}`,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    transition: "border-color 0.15s ease",
    outline: "none",
    width: "100%",
    ...style,
  };

  const errorStyle: CSSProperties = {
    fontSize: typography.caption.fontSize,
    color: colors.danger,
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <input id={inputId} style={inputStyle} {...props} />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
