import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { colors, radius, spacing, typography } from "@/shared/config/theme";

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  doctor: "Врач",
  patient: "Пациент",
};

interface PopupPos { bottom: number; left: number; width: number }

export function UserIndicator() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [popupPos, setPopupPos] = useState<PopupPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (menuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPos({
        bottom: window.innerHeight - rect.top + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
        ref={btnRef}
        onClick={() => setMenuOpen((o) => !o)}
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
          <div style={{ ...typography.caption, color: colors.textMuted }}>
            {roleLabels[user.role] ?? user.role}
          </div>
        </div>
      </button>

      {menuOpen && popupPos && (
        <div
          style={{
            position: "fixed",
            bottom: popupPos.bottom,
            left: popupPos.left,
            width: popupPos.width,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden",
            zIndex: 500,
          }}
        >
          <button
            onClick={() => { setMenuOpen(false); void navigate("/profile"); }}
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
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.surfaceHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
          >
            Профиль
          </button>
          <div style={{ height: 1, backgroundColor: colors.borderLight }} />
          <button
            onClick={() => { setMenuOpen(false); logout(); void navigate("/login"); }}
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
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.dangerLight; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
