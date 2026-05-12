import { useNavigate } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { LoginForm } from "@/domains/authorization/ui/LoginForm";
import { colors } from "@/shared/config/theme";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    navigate("/", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
        padding: "24px",
      }}
    >
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}
