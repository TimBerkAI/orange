import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { colors, radius, spacing, typography } from "@/shared/config/theme";

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  doctor: "Врач",
  patient: "Пациент",
};

export function UserIndicator() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const displayName = user.profile?.last_name
    ? `${user.profile.last_name} ${user.profile.first_name.charAt(0)}.`
    : user.email;

  const initials = user.profile?.first_name && user.profile?.last_name
    ? `${user.profile.last_name.charAt(0)}${user.profile.first_name.charAt(0)}`
    : user.email.charAt(0).toUpperCase();

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: radius.md,
          border: "none",
          backgroundColor: menuOpen ? colors.primaryLight : "transparent",
          cursor: "pointer",
          width: "100%",
          transition: "background-color 0.15s ease",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.full,
            backgroundColor: colors.primaryMedium,
            color: colors.primaryDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: typography.caption.fontSize,
            fontWeight: "600",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ textAlign: "left", overflow: "hidden", flex: 1, minWidth: 0 }}>
          <div
            style={{
              ...typography.body,
              fontWeight: "500",
              color: colors.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              ...typography.caption,
              color: colors.textMuted,
            }}
          >
            {roleLabels[user.role] ?? user.role}
          </div>
        </div>
      </button>

      {menuOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate("/profile");
            }}
            style={{
              display: "block",
              width: "100%",
              padding: `${spacing.sm} ${spacing.md}`,
              border: "none",
              backgroundColor: "transparent",
              textAlign: "left",
              cursor: "pointer",
              ...typography.body,
              color: colors.textPrimary,
            }}
          >
            Профиль
          </button>
          <div style={{ height: 1, backgroundColor: colors.borderLight }} />
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            style={{
              display: "block",
              width: "100%",
              padding: `${spacing.sm} ${spacing.md}`,
              border: "none",
              backgroundColor: "transparent",
              textAlign: "left",
              cursor: "pointer",
              ...typography.body,
              color: colors.danger,
            }}
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
