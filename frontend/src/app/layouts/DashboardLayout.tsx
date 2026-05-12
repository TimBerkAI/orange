import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { UserIndicator } from "@/domains/authorization/ui/UserIndicator";
import { colors, radius, spacing, typography } from "@/shared/config/theme";
import type { CSSProperties } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: "/planning", label: "Планирование", icon: "📋" },
  { to: "/doctors", label: "Врачи", icon: "👨‍⚕️", roles: ["admin"] },
  { to: "/patients", label: "Пациенты", icon: "👥" },
];

function SidebarLink({ to, label, icon }: NavItem) {
  const baseLinkStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `10px ${spacing.md}`,
    borderRadius: radius.md,
    textDecoration: "none",
    transition: "all 0.15s ease",
    ...typography.body,
    fontWeight: "500",
  };

  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...baseLinkStyle,
        backgroundColor: isActive ? colors.primaryLight : "transparent",
        color: isActive ? colors.primaryDark : colors.textSecondary,
      })}
    >
      <span style={{ fontSize: "16px", width: 20, textAlign: "center" }}>{icon}</span>
      {label}
    </NavLink>
  );
}

export function DashboardLayout() {
  const { role } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: colors.background,
      }}
    >
      <aside
        style={{
          width: 260,
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.borderLight}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: `${spacing.lg} ${spacing.md}`,
            borderBottom: `1px solid ${colors.borderLight}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontWeight: "600", fontSize: "16px" }}>D</span>
            </div>
            <span
              style={{
                ...typography.subheading,
                color: colors.textPrimary,
              }}
            >
              Dental Office
            </span>
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            padding: spacing.md,
            display: "flex",
            flexDirection: "column",
            gap: spacing.xs,
          }}
        >
          {visibleItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>

        <div
          style={{
            padding: spacing.md,
            borderTop: `1px solid ${colors.borderLight}`,
          }}
        >
          <UserIndicator />
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          padding: spacing.xl,
          overflow: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
