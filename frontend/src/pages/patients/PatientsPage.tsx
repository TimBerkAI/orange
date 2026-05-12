import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { Spinner } from "@/shared/ui/Spinner";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";
import { createPatient, listPatients } from "@/domains/patients/api";
import { PATIENT_STATUS_LABELS } from "@/domains/patients/constants";
import type { Patient } from "@/domains/patients/types";
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

export function PatientsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPatients = useCallback((q?: string) => {
    listPatients(q).then(setPatients).catch(() => null);
  }, []);

  useEffect(() => {
    listPatients()
      .then(setPatients)
      .finally(() => setLoading(false));
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadPatients(value || undefined), 350);
  };

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
        subtitle={`${patients.length} ${pluralPatients(patients.length)}`}
        actions={
          isAdmin ? (
            <Button onClick={() => setModalOpen(true)}>
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
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: colors.borderLight }}>
              <Th>ФИО</Th>
              <Th>Телефон</Th>
              <Th>Аллергии</Th>
              <Th>Статус</Th>
              <Th>Последний визит</Th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
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
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      colors.surfaceHover;
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <CreatePatientModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={(p) => {
            setPatients((prev) => [p, ...prev]);
            setModalOpen(false);
          }}
        />
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
  onCreated: (p: Patient) => void;
}) {
  const [userId, setUserId] = useState("");
  const [allergies, setAllergies] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setUserId("");
      setAllergies("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const patient = await createPatient({
        user_id: Number(userId),
        allergies,
      });
      onCreated(patient);
    } catch (err: unknown) {
      const detail = (err as Record<string, unknown>)?.detail;
      setError(typeof detail === "string" ? detail : "Ошибка при создании");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить пациента" width={440}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        <Input
          label="ID пользователя"
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Введите ID пользователя"
          required
        />
        <Input
          label="Аллергии"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Пенициллин, Лидокаин и т.д."
        />
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
