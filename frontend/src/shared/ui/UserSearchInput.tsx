import { useCallback, useEffect, useRef, useState } from "react";
import { searchUsers } from "@/domains/authorization/infrastructure/authApi";
import type { User } from "@/shared/types";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";

interface UserSearchInputProps {
  value: number | null;
  onChange: (userId: number | null, user: User | null) => void;
  label?: string;
  placeholder?: string;
}

function formatUserLabel(user: User): string {
  const p = user.profile;
  if (!p) return user.email;
  const name = [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(" ");
  const phone = p.phone ? ` · ${p.phone}` : "";
  return name ? `${name}${phone} (${user.email})` : user.email;
}

export function UserSearchInput({ value, onChange, label, placeholder }: UserSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const users = await searchUsers(q);
      setResults(users);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query) return;
    timerRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    if (value === null) {
      setSelectedLabel("");
      setQuery("");
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(user: User) {
    setSelectedLabel(formatUserLabel(user));
    setQuery("");
    setResults([]);
    setOpen(false);
    onChange(user.id, user);
  }

  function handleClear() {
    setSelectedLabel("");
    setQuery("");
    setResults([]);
    setOpen(false);
    onChange(null, null);
  }

  const inputStyle = {
    padding: "10px 14px",
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label style={{ fontSize: typography.caption.fontSize, fontWeight: "500", color: colors.textSecondary }}>
          {label}
        </label>
      )}
      {selectedLabel ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            padding: "10px 14px",
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surfaceHover,
            fontSize: typography.body.fontSize,
            color: colors.textPrimary,
          }}
        >
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedLabel}
          </span>
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.textSecondary,
              padding: "0 2px",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
            placeholder={placeholder ?? "Введите email, ФИО или телефон..."}
            style={inputStyle}
          />
          {loading && (
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: colors.textMuted, fontSize: "12px" }}>
              ...
            </span>
          )}
        </div>
      )}
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: label ? "calc(100% + 2px)" : "calc(100% + 2px)",
            left: 0,
            right: 0,
            zIndex: 200,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            boxShadow: shadows.lg,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={() => handleSelect(user)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: `${spacing.sm} ${spacing.md}`,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: typography.body.fontSize,
                color: colors.textPrimary,
                borderBottom: `1px solid ${colors.borderLight}`,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.surfaceHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
            >
              <div style={{ fontWeight: "500" }}>
                {user.profile
                  ? [user.profile.last_name, user.profile.first_name, user.profile.patronymic].filter(Boolean).join(" ") || user.email
                  : user.email}
              </div>
              <div style={{ fontSize: typography.caption.fontSize, color: colors.textSecondary }}>
                {user.email}{user.profile?.phone ? ` · ${user.profile.phone}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            zIndex: 200,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            boxShadow: shadows.md,
            padding: spacing.md,
            fontSize: typography.body.fontSize,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Пользователи не найдены
        </div>
      )}
    </div>
  );
}
