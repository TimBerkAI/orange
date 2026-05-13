import PhoneInputLib, { type Value } from "react-phone-number-input";
import { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { colors, radius, typography } from "@/shared/config/theme";
import type { CSSProperties } from "react";

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export { isValidPhoneNumber };

export function PhoneInput({ label, value, onChange, error, required, placeholder }: PhoneInputProps) {
  const inputId = label ? label.toLowerCase().replace(/\s+/g, "-") : "phone";

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

  const errorStyle: CSSProperties = {
    fontSize: typography.caption.fontSize,
    color: colors.danger,
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
          {required && <span style={{ color: colors.danger }}> *</span>}
        </label>
      )}
      <div
        style={{
          borderRadius: radius.md,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          backgroundColor: colors.surface,
          transition: "border-color 0.15s ease",
          overflow: "hidden",
        }}
      >
        <PhoneInputLib
          id={inputId}
          international
          defaultCountry="RU"
          value={value as Value}
          onChange={(v) => onChange(v ?? "")}
          placeholder={placeholder ?? "+7 (900) 123-45-67"}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 14px",
            gap: "8px",
          }}
        />
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
