import { type FormEvent, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { colors, radius, spacing, typography } from "@/shared/config/theme";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(email, password);
    } catch {
      setError("Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      style={{ width: "100%", maxWidth: 420 }}
    >
      <div style={{ marginBottom: spacing.lg }}>
        <h2
          style={{
            ...typography.heading,
            color: colors.textPrimary,
            marginBottom: spacing.xs,
          }}
        >
          Войти в систему
        </h2>
        <p style={{ ...typography.body, color: colors.textSecondary }}>
          Введите учётные данные для доступа к рабочему пространству.
        </p>
      </div>

      <div
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@orange.dental"
          required
        />
        <Input
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
          required
        />
      </div>

      {error && (
        <div
          style={{
            marginTop: spacing.md,
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.dangerLight,
            color: colors.danger,
            borderRadius: radius.md,
            fontSize: typography.caption.fontSize,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginTop: spacing.lg }}>
        <Button type="submit" fullWidth loading={loading}>
          Войти
        </Button>
      </div>
    </form>
  );
}
