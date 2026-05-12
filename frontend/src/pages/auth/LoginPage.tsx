import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { LoginForm } from "@/domains/authorization/ui/LoginForm";
import { colors, radius, spacing, typography } from "@/shared/config/theme";

type Tab = "login" | "register";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("login");

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    navigate("/", { replace: true });
  };

  const tabStyle = (tab: Tab) => ({
    flex: 1,
    padding: "10px 0",
    border: "none",
    borderRadius: radius.full,
    backgroundColor: activeTab === tab ? colors.surface : "transparent",
    color: activeTab === tab ? colors.textPrimary : colors.textMuted,
    fontSize: typography.body.fontSize,
    fontWeight: activeTab === tab ? ("500" as const) : ("400" as const),
    cursor: "pointer" as const,
    transition: "all 0.2s ease",
    boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
  });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <div
        className="login-hero"
        style={{
          flex: 1,
          background: "linear-gradient(180deg, #F5A623 0%, #E8862D 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 48px",
          color: "#ffffff",
          minHeight: "100vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.lg,
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            O
          </div>
          <span style={{ fontSize: "18px", fontWeight: "600" }}>
            Orange Dental
          </span>
        </div>

        <div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "700",
              lineHeight: "1.15",
              marginBottom: spacing.lg,
              maxWidth: 400,
            }}
          >
            Спокойная цифровая клиника
          </h1>
          <p
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              opacity: 0.85,
              maxWidth: 440,
            }}
          >
            Расписание, карты пациентов, одонтограмма и SOAP-заметки — всё в
            одном понятном интерфейсе для администраторов и врачей.
          </p>
        </div>

        <p
          style={{
            fontSize: typography.caption.fontSize,
            opacity: 0.6,
          }}
        >
          &copy; Orange Dental — рабочее пространство клиники
        </p>
      </div>

      <div
        className="login-form-panel"
        style={{
          flex: 1,
          backgroundColor: colors.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "4px",
              borderRadius: radius.full,
              backgroundColor: colors.borderLight,
              marginBottom: "32px",
            }}
          >
            <button style={tabStyle("login")} onClick={() => setActiveTab("login")}>
              Вход
            </button>
            <button style={tabStyle("register")} onClick={() => setActiveTab("register")}>
              Регистрация
            </button>
          </div>

          {activeTab === "login" ? (
            <LoginForm onSubmit={handleLogin} />
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: colors.textMuted,
                ...typography.body,
              }}
            >
              Регистрация доступна через администратора
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
