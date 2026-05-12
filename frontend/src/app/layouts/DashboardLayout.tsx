import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { UserIndicator } from "@/domains/authorization/ui/UserIndicator";
import { colors, radius, spacing, typography } from "@/shared/config/theme";
import type { CSSProperties, ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function StethoscopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v6a8 8 0 0 0 16 0V4" />
      <circle cx="20" cy="16" r="2" />
      <path d="M20 18v2a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-1" />
      <path d="M4 2v2M20 2v2" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { to: "/planning", label: "Планирование", icon: <CalendarIcon /> },
  { to: "/doctors", label: "Врачи", icon: <StethoscopeIcon />, roles: ["admin"] },
  { to: "/patients", label: "Пациенты", icon: <UsersIcon /> },
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
      <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </span>
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
          <div
            style={{ display: "flex", alignItems: "center", gap: spacing.sm }}
          >
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
              <span
                style={{ color: "#fff", fontWeight: "600", fontSize: "16px" }}
              >
                O
              </span>
            </div>
            <span
              style={{
                ...typography.subheading,
                color: colors.textPrimary,
              }}
            >
              Orange Office
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
