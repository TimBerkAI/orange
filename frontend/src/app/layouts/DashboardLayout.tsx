import { NavLink, Outlet } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { UserIndicator } from "@/domains/authorization/ui/UserIndicator";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
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

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M8 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const STORAGE_KEY = "sidebar_collapsed";

const navItems: NavItem[] = [
  { to: "/planning", label: "Планирование", icon: <CalendarIcon />, roles: ["admin", "doctor"] },
  { to: "/doctors", label: "Врачи", icon: <StethoscopeIcon />, roles: ["admin", "doctor"] },
  { to: "/specializations", label: "Специальности", icon: <ClipboardIcon />, roles: ["admin"] },
  { to: "/patients", label: "Пациенты", icon: <UsersIcon />, roles: ["admin", "doctor"] },
  { to: "/users", label: "Пользователи", icon: <PersonIcon />, roles: ["admin"] },
];

function SidebarLink({ to, label, icon, collapsed }: NavItem & { collapsed: boolean }) {
  const baseLinkStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: collapsed ? 0 : spacing.sm,
    padding: collapsed ? "10px 0" : `10px ${spacing.md}`,
    justifyContent: collapsed ? "center" : "flex-start",
    borderRadius: radius.md,
    textDecoration: "none",
    transition: "all 0.15s ease",
    ...typography.body,
    fontWeight: "500",
    position: "relative",
  };

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      style={({ isActive }) => ({
        ...baseLinkStyle,
        backgroundColor: isActive ? colors.primaryLight : "transparent",
        color: isActive ? colors.primaryDark : colors.textSecondary,
      })}
    >
      <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </span>
      {!collapsed && (
        <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {label}
        </span>
      )}
    </NavLink>
  );
}

export function DashboardLayout() {
  const { role } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const visibleItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  const sidebarWidth = isMobile ? SIDEBAR_WIDTH : collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const showLabels = isMobile || !collapsed;

  const sidebarContent = (
    <aside
      style={{
        width: sidebarWidth,
        backgroundColor: colors.surface,
        borderRight: isMobile ? "none" : `1px solid ${colors.borderLight}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        transition: isMobile ? "transform 0.25s ease" : "width 0.2s ease",
        ...(isMobile ? {
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100,
          boxShadow: mobileOpen ? "4px 0 24px rgba(0,0,0,0.12)" : "none",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        } : {}),
      }}
    >
      <div
        style={{
          padding: collapsed && !isMobile ? `${spacing.lg} ${spacing.sm}` : `${spacing.lg} ${spacing.md}`,
          borderBottom: `1px solid ${colors.borderLight}`,
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            borderRadius: radius.md,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontWeight: "600", fontSize: "16px" }}>O</span>
        </div>
        {showLabels && (
          <span
            style={{
              ...typography.subheading,
              color: colors.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Orange Office
          </span>
        )}
      </div>

      <nav
        style={{
          flex: 1,
          padding: collapsed && !isMobile ? `${spacing.md} ${spacing.xs}` : spacing.md,
          display: "flex",
          flexDirection: "column",
          gap: spacing.xs,
          overflowY: "auto",
        }}
      >
        {visibleItems.map((item) => (
          <SidebarLink key={item.to} {...item} collapsed={!showLabels} />
        ))}
      </nav>

      <div
        style={{
          padding: collapsed && !isMobile ? `${spacing.sm} ${spacing.xs}` : spacing.md,
          borderTop: `1px solid ${colors.borderLight}`,
          overflow: "visible",
          display: "flex",
          flexDirection: "column",
          gap: spacing.xs,
          position: "relative",
          zIndex: 101,
        }}
      >
        {showLabels ? (
          <UserIndicator />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.full,
              background: colors.primaryLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
            title="Профиль"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            </svg>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
            style={{
              background: "none",
              border: `1px solid ${colors.borderLight}`,
              borderRadius: radius.md,
              padding: "6px",
              cursor: "pointer",
              color: colors.textSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: collapsed ? 36 : 36,
              height: 36,
              margin: "0 auto",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: colors.surface,
      }}
    >
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 99,
            transition: "opacity 0.25s ease",
          }}
        />
      )}

      {sidebarContent}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {isMobile && (
          <header
            style={{
              height: 56,
              padding: `0 ${spacing.md}`,
              display: "flex",
              alignItems: "center",
              gap: spacing.sm,
              borderBottom: `1px solid ${colors.borderLight}`,
              backgroundColor: colors.surface,
              position: "sticky",
              top: 0,
              zIndex: 50,
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: "none",
                border: "none",
                padding: spacing.xs,
                cursor: "pointer",
                color: colors.textPrimary,
                display: "flex",
                alignItems: "center",
              }}
            >
              <MenuIcon />
            </button>
            <span style={{ ...typography.body, fontWeight: "600", color: colors.textPrimary }}>
              Orange Office
            </span>
          </header>
        )}
        <main
          style={{
            flex: 1,
            padding: isMobile ? spacing.md : spacing.xl,
            overflow: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
