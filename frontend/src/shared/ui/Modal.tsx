import type { CSSProperties, ReactNode } from "react";
import { useEffect } from "react";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ title, open, onClose, children, width = 520 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: spacing.md,
  };

  const panelStyle: CSSProperties = {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    boxShadow: shadows.lg,
    width: "100%",
    maxWidth: width,
    maxHeight: "90vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${spacing.lg} ${spacing.lg} ${spacing.md}`,
    borderBottom: `1px solid ${colors.borderLight}`,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ ...typography.subheading, color: colors.textPrimary }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.textMuted,
              padding: "4px",
              lineHeight: 1,
              fontSize: "20px",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: spacing.lg }}>{children}</div>
      </div>
    </div>
  );
}
