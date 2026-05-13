import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { Spinner } from "@/shared/ui/Spinner";
import { UserSearchInput } from "@/shared/ui/UserSearchInput";
import { UserEditModal } from "@/shared/ui/UserEditModal";
import { PhoneInput, isValidPhoneNumber } from "@/shared/ui/PhoneInput";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";
import { parseApiFieldErrors } from "@/shared/api/httpClient";
import { createPatient, deletePatient, listPatients, updatePatient } from "@/domains/patients/api";
import { PATIENT_STATUS_LABELS } from "@/domains/patients/constants";
import type { Patient } from "@/domains/patients/types";
import type { User } from "@/shared/types";
import type { FormEvent, ReactNode } from "react";

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
  return <td style={{ padding: `${spacing.md} ${spacing.md}` }}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: "500",
        backgroundColor: isActive ? "#D1FAE5" : colors.borderLight,
        color: isActive ? "#065F46" : colors.textMuted,
      }}
    >
      {PATIENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const PAGE_SIZE = 25;

export function PatientsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editProfileUser, setEditProfileUser] = useState<User | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPatients = useCallback((q?: string, p = 1) => {
    listPatients({ search: q, page: p, page_size: PAGE_SIZE })
      .then((res) => { setPatients(res.results); setTotal(res.count); setPage(p); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    listPatients({ page: 1, page_size: PAGE_SIZE })
      .then((res) => { setPatients(res.results); setTotal(res.count); setPage(1); })
      .finally(() => setLoading(false));
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadPatients(value || undefined, 1), 350);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading) {
    return (
      <div>
        <PageHeader title="Пациенты" subtitle="Управление карточками пациентов" />
        <div style={{ display: "flex", justifyContent: "center", padding: spacing.xxl }}>
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Пациенты"
        subtitle={`${total} ${pluralPatients(total)}`}
        actions={
          isAdmin ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Добавить пациента
            </Button>
          ) : undefined
        }
      />

      <div style={{ marginBottom: spacing.md, maxWidth: 360 }}>
        <Input
          placeholder="Поиск по имени, email или телефону..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
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
              <Th>ФИО</Th>
              <Th>Телефон</Th>
              <Th>Аллергии</Th>
              <Th>Статус</Th>
              <Th>Последний визит</Th>
              {isAdmin && <Th />}
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    color: colors.textMuted,
                    ...typography.body,
                  }}
                >
                  {search ? "Пациенты не найдены" : "Нет добавленных пациентов"}
                </td>
              </tr>
            ) : (
              patients.map((patient, idx) => (
                <tr
                  key={patient.id}
                  onClick={() => void navigate(`/patients/${patient.id}`)}
                  style={{
                    borderTop: idx === 0 ? "none" : `1px solid ${colors.borderLight}`,
                    cursor: "pointer",
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
                      {patient.full_name || "—"}
                    </div>
                    <div style={{ ...typography.caption, color: colors.textMuted }}>{patient.user.email}</div>
                  </Td>
                  <Td>
                    <span style={{ ...typography.caption, color: colors.textSecondary }}>
                      {patient.user.phone || "—"}
                    </span>
                  </Td>
                  <Td>
                    <span
                      style={{
                        ...typography.caption,
                        color: patient.allergies ? colors.warning : colors.textMuted,
                      }}
                    >
                      {patient.allergies ? patient.allergies.substring(0, 40) : "—"}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={patient.status} />
                  </Td>
                  <Td>
                    <span style={{ ...typography.caption, color: colors.textSecondary }}>
                      {formatDate(patient.last_visit?.start_at)}
                    </span>
                  </Td>
                  {isAdmin && (
                    <Td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditPatient(patient);
                        }}
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
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: spacing.sm, marginTop: spacing.md }}>
          <button
            type="button"
            onClick={() => loadPatients(search || undefined, page - 1)}
            disabled={page <= 1}
            style={{ padding: "6px 14px", border: `1px solid ${colors.border}`, borderRadius: radius.md, backgroundColor: colors.surface, cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: typography.caption.fontSize, color: page <= 1 ? colors.textMuted : colors.textPrimary, opacity: page <= 1 ? 0.5 : 1 }}
          >
            Назад
          </button>
          <span style={{ ...typography.caption, color: colors.textSecondary }}>
            Страница {page} из {totalPages}
          </span>
          <button
            type="button"
            onClick={() => loadPatients(search || undefined, page + 1)}
            disabled={page >= totalPages}
            style={{ padding: "6px 14px", border: `1px solid ${colors.border}`, borderRadius: radius.md, backgroundColor: colors.surface, cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: typography.caption.fontSize, color: page >= totalPages ? colors.textMuted : colors.textPrimary, opacity: page >= totalPages ? 0.5 : 1 }}
          >
            Вперёд
          </button>
        </div>
      )}

      {isAdmin && (
        <>
          <CreatePatientModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              loadPatients(search || undefined, 1);
            }}
          />
          <EditPatientModal
            open={!!editPatient}
            patient={editPatient}
            onClose={() => setEditPatient(null)}
            onSaved={(updated) => {
              setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              setEditPatient(null);
            }}
            onDeleted={() => {
              setEditPatient(null);
              loadPatients(search || undefined, page);
            }}
            onEditProfile={(patientUser) => {
              setEditPatient(null);
              setEditProfileUser({
                id: patientUser.id,
                email: patientUser.email,
                role: "patient",
                is_active: true,
                date_joined: "",
                profile: {
                  first_name: patientUser.first_name,
                  last_name: patientUser.last_name,
                  patronymic: patientUser.patronymic,
                  phone: patientUser.phone,
                  date_of_birth: patientUser.date_of_birth,
                },
              });
            }}
          />
          <UserEditModal
            open={!!editProfileUser}
            user={editProfileUser}
            onClose={() => setEditProfileUser(null)}
            onSaved={(updatedUser) => {
              setPatients((prev) =>
                prev.map((p) => {
                  if (p.user.id !== updatedUser.id) return p;
                  const profile = updatedUser.profile;
                  return {
                    ...p,
                    user: {
                      id: updatedUser.id,
                      email: updatedUser.email,
                      first_name: profile?.first_name ?? "",
                      last_name: profile?.last_name ?? "",
                      patronymic: profile?.patronymic ?? "",
                      phone: profile?.phone ?? "",
                      date_of_birth: profile?.date_of_birth ?? null,
                    },
                    full_name: profile
                      ? `${profile.last_name} ${profile.first_name}`.trim()
                      : p.full_name,
                  };
                })
              );
              setEditProfileUser(null);
            }}
          />
        </>
      )}
    </div>
  );
}

function CreatePatientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  type UserMode = "new" | "existing";
  const [userMode, setUserMode] = useState<UserMode>("new");
  const [userId, setUserId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [phone, setPhone] = useState("");
  const [allergies, setAllergies] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setUserMode("new");
      setUserId(null);
      setEmail("");
      setFirstName("");
      setLastName("");
      setPatronymic("");
      setPhone("");
      setAllergies("");
      setFieldErrors({});
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (userMode === "new" && phone && !isValidPhoneNumber(phone)) {
      setFieldErrors({ phone: "Введите корректный номер телефона" });
      return;
    }
    if (userMode === "existing" && !userId) {
      setFieldErrors({ _general: "Выберите пользователя" });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      const payload: Parameters<typeof createPatient>[0] = { allergies };
      if (userMode === "existing") {
        payload.user_id = userId!;
      } else {
        payload.new_user = {
          email,
          first_name: firstName,
          last_name: lastName,
          patronymic: patronymic || undefined,
          phone: phone || undefined,
        };
      }
      await createPatient(payload);
      onCreated();
    } catch (err: unknown) {
      setFieldErrors(parseApiFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const tabStyle = (active: boolean) => ({
    padding: "6px 14px",
    border: `1px solid ${active ? colors.primary : colors.border}`,
    borderRadius: radius.md,
    backgroundColor: active ? colors.primaryLight : colors.surface,
    color: active ? colors.primaryDark : colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: "500" as const,
    cursor: "pointer" as const,
    transition: "all 0.15s ease",
  });

  return (
    <Modal open={open} onClose={onClose} title="Добавить пациента" width={480}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        <div>
          <div
            style={{
              fontSize: typography.caption.fontSize,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: spacing.sm,
            }}
          >
            Пользователь
          </div>
          <div style={{ display: "flex", gap: spacing.xs, marginBottom: spacing.sm }}>
            <button type="button" onClick={() => setUserMode("new")} style={tabStyle(userMode === "new")}>
              Создать нового
            </button>
            <button type="button" onClick={() => setUserMode("existing")} style={tabStyle(userMode === "existing")}>
              Поиск пользователя
            </button>
          </div>
          {userMode === "existing" ? (
            <UserSearchInput
              label="Поиск пользователя"
              value={userId}
              onChange={(id) => setUserId(id)}
              placeholder="Введите email, ФИО или телефон..."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                placeholder="patient@email.ru"
                required
                error={fieldErrors.email}
              />
              <div style={{ display: "flex", gap: spacing.sm }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Фамилия"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, last_name: "" })); }}
                    placeholder="Иванов"
                    required
                    error={fieldErrors.last_name}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Имя"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, first_name: "" })); }}
                    placeholder="Иван"
                    required
                    error={fieldErrors.first_name}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: spacing.sm }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Отчество"
                    value={patronymic}
                    onChange={(e) => setPatronymic(e.target.value)}
                    placeholder="Иванович"
                  />
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
            </div>
          )}
        </div>
        <Input
          label="Аллергии"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Пенициллин, Лидокаин и т.д."
        />
        {fieldErrors._general && (
          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.dangerLight,
              color: colors.danger,
              borderRadius: "8px",
              fontSize: typography.caption.fontSize,
            }}
          >
            {fieldErrors._general}
          </div>
        )}
        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={saving}>
            Добавить
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditPatientModal({
  open,
  patient,
  onClose,
  onSaved,
  onDeleted,
  onEditProfile,
}: {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSaved: (p: Patient) => void;
  onDeleted: () => void;
  onEditProfile: (user: import("@/domains/patients/types").PatientUser) => void;
}) {
  const [allergies, setAllergies] = useState("");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && patient) {
      setAllergies(patient.allergies ?? "");
      setStatus(patient.status);
      setError("");
      setConfirmDelete(false);
    }
  }, [open, patient]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updatePatient(patient.id, { allergies, status });
      onSaved(updated);
    } catch (err: unknown) {
      const detail = (err as Record<string, unknown>)?.detail;
      setError(typeof detail === "string" ? detail : "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (!patient) return;
    setDeleting(true);
    try {
      await deletePatient(patient.id);
      onDeleted();
    } catch {
      setError("Ошибка при удалении");
      setDeleting(false);
    }
  };

  if (!patient) return null;

  return (
    <Modal open={open} onClose={onClose} title="Редактировать пациента" width={440}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.primaryLight,
            borderRadius: radius.md,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ ...typography.caption, color: colors.textSecondary }}>Пациент</div>
            <div style={{ ...typography.body, fontWeight: "500", color: colors.textPrimary }}>
              {patient.full_name || patient.user.email}
            </div>
            <div style={{ ...typography.caption, color: colors.textMuted }}>{patient.user.email}</div>
          </div>
          <button
            type="button"
            onClick={() => onEditProfile(patient.user)}
            style={{
              background: "none",
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm,
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: typography.caption.fontSize,
              color: colors.textSecondary,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Профиль
          </button>
        </div>

        <Input
          label="Аллергии"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Пенициллин, Лидокаин и т.д."
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: typography.caption.fontSize, fontWeight: "500", color: colors.textSecondary }}>
            Статус
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "archived")}
            style={{
              padding: "10px 14px",
              borderRadius: radius.md,
              border: `1px solid ${colors.border}`,
              fontSize: typography.body.fontSize,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              outline: "none",
            }}
          >
            <option value="active">Активный</option>
            <option value="archived">Архивный</option>
          </select>
        </div>

        {error && (
          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.dangerLight,
              color: colors.danger,
              borderRadius: "8px",
              fontSize: typography.caption.fontSize,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "space-between" }}>
          <Button type="button" variant="danger" loading={deleting} onClick={() => void handleDelete()}>
            {confirmDelete ? "Подтвердить удаление" : "Удалить"}
          </Button>
          <div style={{ display: "flex", gap: spacing.sm }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              Сохранить
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function pluralPatients(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "пациент";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "пациента";
  return "пациентов";
}
