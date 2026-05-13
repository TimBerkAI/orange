import { type FormEvent, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { PhoneInput, isValidPhoneNumber } from "@/shared/ui/PhoneInput";
import { Modal } from "@/shared/ui/Modal";
import { Spinner } from "@/shared/ui/Spinner";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "@/domains/authorization/infrastructure/authApi";
import { parseApiFieldErrors } from "@/shared/api/httpClient";
import type { User } from "@/shared/types";
import type { ReactNode } from "react";

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  doctor: "Врач",
  patient: "Пациент",
};

const roleBadgeColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#FEF3C7", text: "#92400E" },
  doctor: { bg: "#DBEAFE", text: "#1E40AF" },
  patient: { bg: "#D1FAE5", text: "#065F46" },
};

function RoleBadge({ role }: { role: string }) {
  const c = roleBadgeColors[role] ?? { bg: colors.borderLight, text: colors.textMuted };
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: "500",
        backgroundColor: c.bg,
        color: c.text,
      }}
    >
      {roleLabels[role] ?? role}
    </span>
  );
}

function Th({ children }: { children?: ReactNode }) {
  return (
    <th
      style={{
        padding: `${spacing.sm} ${spacing.md}`,
        textAlign: "left",
        fontSize: typography.caption.fontSize,
        fontWeight: "600",
        color: colors.textSecondary,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children?: ReactNode }) {
  return <td style={{ padding: `${spacing.sm} ${spacing.md}` }}>{children}</td>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU");
}

function fullName(user: User): string {
  const p = user.profile;
  if (!p) return user.email;
  return [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(" ") || user.email;
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    if (!matchesRole) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.profile?.first_name ?? "").toLowerCase().includes(q) ||
      (u.profile?.last_name ?? "").toLowerCase().includes(q) ||
      (u.profile?.phone ?? "").includes(q)
    );
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Пользователи" subtitle="Управление учётными записями" />
        <div style={{ display: "flex", justifyContent: "center", padding: spacing.xxl }}>
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Пользователи"
        subtitle={`${filtered.length} из ${users.length}`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon /> Добавить
          </Button>
        }
      />

      <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.md, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 360 }}>
          <Input
            placeholder="Поиск по имени, email или телефону..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: spacing.xs }}>
          {(["all", "admin", "doctor", "patient"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              style={{
                padding: "8px 14px",
                borderRadius: radius.md,
                border: `1px solid ${roleFilter === r ? colors.primary : colors.border}`,
                backgroundColor: roleFilter === r ? colors.primaryLight : colors.surface,
                color: roleFilter === r ? colors.primaryDark : colors.textSecondary,
                fontSize: typography.caption.fontSize,
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {r === "all" ? "Все" : roleLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.sm,
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ backgroundColor: colors.borderLight }}>
              <Th>ФИО / Email</Th>
              <Th>Телефон</Th>
              <Th>Роль</Th>
              <Th>Статус</Th>
              <Th>Дата регистрации</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    color: colors.textMuted,
                    ...typography.body,
                  }}
                >
                  {search || roleFilter !== "all" ? "Пользователи не найдены" : "Нет пользователей"}
                </td>
              </tr>
            ) : (
              filtered.map((user, idx) => (
                <tr
                  key={user.id}
                  style={{
                    borderTop: idx === 0 ? "none" : `1px solid ${colors.borderLight}`,
                    transition: "background-color 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = colors.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent";
                  }}
                >
                  <Td>
                    <div style={{ ...typography.body, fontWeight: "500", color: colors.textPrimary }}>
                      {fullName(user)}
                    </div>
                    <div style={{ ...typography.caption, color: colors.textMuted }}>{user.email}</div>
                  </Td>
                  <Td>
                    <span style={{ ...typography.caption, color: colors.textSecondary }}>
                      {user.profile?.phone || "—"}
                    </span>
                  </Td>
                  <Td>
                    <RoleBadge role={user.role} />
                  </Td>
                  <Td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: "500",
                        backgroundColor: user.is_active ? "#D1FAE5" : colors.borderLight,
                        color: user.is_active ? "#065F46" : colors.textMuted,
                      }}
                    >
                      {user.is_active ? "Активен" : "Заблокирован"}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ ...typography.caption, color: colors.textSecondary }}>
                      {formatDate(user.date_joined)}
                    </span>
                  </Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setEditUser(user)}
                      style={{
                        background: "none",
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.sm,
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontSize: typography.caption.fontSize,
                        color: colors.textSecondary,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Изменить
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(u) => { setUsers((prev) => [u, ...prev]); setCreateOpen(false); }}
      />
      <UserFormModal
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
          setEditUser(null);
        }}
        onDeleted={(id) => {
          setUsers((prev) => prev.filter((u) => u.id !== id));
          setEditUser(null);
        }}
      />
    </div>
  );
}

function UserFormModal({
  open,
  user,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onSaved: (u: User) => void;
  onDeleted?: (id: number) => void;
}) {
  const isEdit = !!user;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [isActive, setIsActive] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setEmail(user?.email ?? "");
      setPassword("");
      setRole(user?.role ?? "patient");
      setIsActive(user?.is_active ?? true);
      setFirstName(user?.profile?.first_name ?? "");
      setLastName(user?.profile?.last_name ?? "");
      setPatronymic(user?.profile?.patronymic ?? "");
      setPhone(user?.profile?.phone ?? "");
      setDateOfBirth(user?.profile?.date_of_birth ?? "");
      setFieldErrors({});
      setConfirmDelete(false);
    }
  }, [open, user]);

  const validatePhone = (): boolean => {
    if (phone && !isValidPhoneNumber(phone)) {
      setFieldErrors((prev) => ({ ...prev, phone: "Введите корректный номер телефона" }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        email,
        role,
        first_name: firstName,
        last_name: lastName,
        patronymic,
        phone,
        date_of_birth: dateOfBirth || null,
        ...(password ? { password } : {}),
        ...(isEdit ? { is_active: isActive } : {}),
      };

      let result: User;
      if (isEdit) {
        result = await updateUser(user!.id, payload);
      } else {
        result = await createUser({ ...payload, password: password || undefined });
      }
      onSaved(result);
    } catch (err: unknown) {
      setFieldErrors(parseApiFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await deleteUser(user!.id);
      onDeleted?.(user!.id);
    } catch (err: unknown) {
      setFieldErrors(parseApiFieldErrors(err));
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Редактировать пользователя" : "Добавить пользователя"} width={500}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
          placeholder="user@clinic.ru"
          required
          error={fieldErrors.email}
        />

        <Input
          label={isEdit ? "Новый пароль (оставьте пустым без изменений)" : "Пароль"}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
          placeholder={isEdit ? "Не менять" : "Минимум 8 символов"}
          required={!isEdit}
          error={fieldErrors.password}
        />

        <div style={{ display: "flex", gap: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: typography.caption.fontSize, fontWeight: "500", color: colors.textSecondary, marginBottom: "6px" }}>
              Роль
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: radius.md,
                border: `1px solid ${colors.border}`,
                fontSize: typography.body.fontSize,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                outline: "none",
              }}
            >
              <option value="admin">Администратор</option>
              <option value="doctor">Врач</option>
              <option value="patient">Пациент</option>
            </select>
          </div>
          {isEdit && (
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: typography.caption.fontSize, fontWeight: "500", color: colors.textSecondary, marginBottom: "6px" }}>
                Статус
              </label>
              <select
                value={isActive ? "active" : "inactive"}
                onChange={(e) => setIsActive(e.target.value === "active")}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: radius.md,
                  border: `1px solid ${colors.border}`,
                  fontSize: typography.body.fontSize,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                  outline: "none",
                }}
              >
                <option value="active">Активен</option>
                <option value="inactive">Заблокирован</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <Input label="Фамилия" value={lastName} onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, last_name: "" })); }} placeholder="Иванов" error={fieldErrors.last_name} />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="Имя" value={firstName} onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, first_name: "" })); }} placeholder="Иван" error={fieldErrors.first_name} />
          </div>
        </div>

        <div style={{ display: "flex", gap: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <Input label="Отчество" value={patronymic} onChange={(e) => setPatronymic(e.target.value)} placeholder="Иванович" />
          </div>
          <div style={{ flex: 1 }}>
            <PhoneInput
              label="Телефон"
              value={phone}
              onChange={(v) => { setPhone(v); setFieldErrors((p) => ({ ...p, phone: "" })); }}
              error={fieldErrors.phone}
            />
          </div>
        </div>

        <Input
          label="Дата рождения"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />

        {fieldErrors._general && (
          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.dangerLight,
              color: colors.danger,
              borderRadius: radius.md,
              fontSize: typography.caption.fontSize,
            }}
          >
            {fieldErrors._general}
          </div>
        )}

        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "space-between" }}>
          {isEdit && onDeleted && (
            <Button type="button" variant="danger" loading={deleting} onClick={() => void handleDelete()}>
              {confirmDelete ? "Подтвердить" : "Удалить"}
            </Button>
          )}
          <div style={{ display: "flex", gap: spacing.sm, marginLeft: "auto" }}>
            <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
            <Button type="submit" loading={saving}>
              {isEdit ? "Сохранить" : "Добавить"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
