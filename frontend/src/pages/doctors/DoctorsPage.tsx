import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { UserEditModal } from "@/shared/ui/UserEditModal";
import type { User } from "@/shared/types";

export function DoctorsPage() {
  const { role } = useAuth();

  if (role !== "admin") {
    return (
      <div>
        <PageHeader title="Врачи" subtitle="Ваша карточка врача" />
        <DoctorSelfCard />
      </div>
    );
  }

  return <AdminDoctorsView />;
}

import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Spinner } from "@/shared/ui/Spinner";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";
import {
  createDoctor,
  deleteDoctor,
  listDoctorsPaginated,
  listSpecializations,
  updateDoctor,
} from "@/domains/doctors/api";
import { DoctorFormModal } from "@/domains/doctors/ui/DoctorFormModal";
import { DoctorSelfCard } from "@/domains/doctors/ui/DoctorSelfCard";
import { WEEKDAY_LABELS } from "@/domains/doctors/weekdays";
import type { Doctor, DoctorCreatePayload, Specialization } from "@/domains/doctors/types";
import type { ReactNode } from "react";

type SortDir = "asc" | "desc";

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (!dir) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {dir === "asc" ? <path d="M8 9l4-4 4 4" /> : <path d="M16 15l-4 4-4-4" />}
    </svg>
  );
}

function WeekdayBadges({ days }: { days: number[] }) {
  return (
    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
      {Object.entries(WEEKDAY_LABELS).map(([day, label]) => {
        const d = Number(day);
        const active = days.includes(d);
        return (
          <span
            key={d}
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "500",
              backgroundColor: active ? colors.primaryMedium : colors.borderLight,
              color: active ? colors.primaryDark : colors.textMuted,
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function SpecTags({ specs }: { specs: Specialization[] }) {
  if (!specs.length) {
    return <span style={{ ...typography.caption, color: colors.textMuted }}>—</span>;
  }
  return (
    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
      {specs.map((s) => (
        <span
          key={s.id}
          style={{
            padding: "2px 8px",
            borderRadius: "9999px",
            fontSize: "11px",
            backgroundColor: colors.primaryLight,
            color: colors.primaryDark,
          }}
        >
          {s.name}
        </span>
      ))}
    </div>
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

function Td({ children }: { children: ReactNode }) {
  return <td style={{ padding: `${spacing.md} ${spacing.md}` }}>{children}</td>;
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

function pluralDoctors(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "врач";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "врача";
  return "врачей";
}

const DOCTORS_PAGE_SIZE = 25;

function AdminDoctorsView() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [editUserDoctor, setEditUserDoctor] = useState<Doctor | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDoctors = useCallback((q?: string, p = 1) => {
    listDoctorsPaginated({ search: q, page: p, page_size: DOCTORS_PAGE_SIZE })
      .then((res) => { setDoctors(res.results); setTotal(res.count); setPage(p); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    Promise.all([listDoctorsPaginated({ page: 1, page_size: DOCTORS_PAGE_SIZE }), listSpecializations()])
      .then(([res, specs]) => {
        setDoctors(res.results);
        setTotal(res.count);
        setSpecializations(specs);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadDoctors(value || undefined, 1), 350);
  };

  const totalPages = Math.max(1, Math.ceil(total / DOCTORS_PAGE_SIZE));

  const sortedDoctors = useMemo(
    () =>
      [...doctors].sort((a, b) => {
        const nameA = a.full_name.toLowerCase();
        const nameB = b.full_name.toLowerCase();
        return sortDir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }),
    [doctors, sortDir],
  );

  const openCreate = () => {
    setEditDoctor(null);
    setModalOpen(true);
  };

  const openEdit = (doctor: Doctor) => {
    setEditDoctor(doctor);
    setModalOpen(true);
  };

  const handleSave = async (data: DoctorCreatePayload) => {
    if (editDoctor) {
      const updated = await updateDoctor(editDoctor.id, data);
      setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } else {
      await createDoctor(data);
      loadDoctors(search || undefined, 1);
    }
  };

  const handleDelete = async () => {
    await deleteDoctor(editDoctor!.id);
    loadDoctors(search || undefined, page);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Врачи" subtitle="Управление профилями врачей" />
        <div style={{ display: "flex", justifyContent: "center", padding: spacing.xxl }}>
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Врачи"
        subtitle={`${total} ${pluralDoctors(total)}`}
        actions={
          <Button onClick={openCreate}>
            <PlusIcon /> Добавить врача
          </Button>
        }
      />

      <div style={{ marginBottom: spacing.md, maxWidth: 360 }}>
        <Input
          placeholder="Поиск по имени или email..."
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
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ backgroundColor: colors.borderLight }}>
              <Th>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: typography.caption.fontSize,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    padding: 0,
                  }}
                >
                  ФИО <SortIcon dir={sortDir} />
                </button>
              </Th>
              <Th>Email</Th>
              <Th>Специальности</Th>
              <Th>Рабочие дни</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {sortedDoctors.length === 0 ? (
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
                  {search ? "Врачи не найдены" : "Нет добавленных врачей"}
                </td>
              </tr>
            ) : (
              sortedDoctors.map((doctor, idx) => (
                <tr
                  key={doctor.id}
                  style={{
                    borderTop: idx === 0 ? "none" : `1px solid ${colors.borderLight}`,
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
                    <div
                      style={{
                        ...typography.body,
                        fontWeight: "500",
                        color: colors.textPrimary,
                      }}
                    >
                      {doctor.full_name || "—"}
                    </div>
                  </Td>
                  <Td>
                    <span style={{ ...typography.caption, color: colors.textSecondary }}>
                      {doctor.user.email}
                    </span>
                  </Td>
                  <Td>
                    <SpecTags specs={doctor.specializations} />
                  </Td>
                  <Td>
                    <WeekdayBadges days={doctor.preferred_weekdays} />
                  </Td>
                  <Td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => openEdit(doctor)}
                        style={{
                          background: "none",
                          border: `1px solid ${colors.border}`,
                          borderRadius: radius.md,
                          padding: "5px 12px",
                          cursor: "pointer",
                          fontSize: typography.caption.fontSize,
                          color: colors.textSecondary,
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditUserDoctor(doctor)}
                        style={{
                          background: "none",
                          border: `1px solid ${colors.border}`,
                          borderRadius: radius.md,
                          padding: "5px 12px",
                          cursor: "pointer",
                          fontSize: typography.caption.fontSize,
                          color: colors.textSecondary,
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Профиль
                      </button>
                    </div>
                  </Td>
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
            onClick={() => loadDoctors(search || undefined, page - 1)}
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
            onClick={() => loadDoctors(search || undefined, page + 1)}
            disabled={page >= totalPages}
            style={{ padding: "6px 14px", border: `1px solid ${colors.border}`, borderRadius: radius.md, backgroundColor: colors.surface, cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: typography.caption.fontSize, color: page >= totalPages ? colors.textMuted : colors.textPrimary, opacity: page >= totalPages ? 0.5 : 1 }}
          >
            Вперёд
          </button>
        </div>
      )}

      <DoctorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={editDoctor ? handleDelete : undefined}
        doctor={editDoctor}
        specializations={specializations}
      />

      <UserEditModal
        open={!!editUserDoctor}
        user={editUserDoctor ? {
          id: editUserDoctor.user.id,
          email: editUserDoctor.user.email,
          role: "doctor",
          is_active: true,
          date_joined: "",
          profile: {
            first_name: editUserDoctor.user.first_name,
            last_name: editUserDoctor.user.last_name,
            patronymic: editUserDoctor.user.patronymic,
            phone: "",
            date_of_birth: null,
          },
        } as User : null}
        onClose={() => setEditUserDoctor(null)}
        onSaved={(updated) => {
          setDoctors((prev) => prev.map((d) => d.id === editUserDoctor?.id ? {
            ...d,
            user: {
              ...d.user,
              email: updated.email,
              first_name: updated.profile?.first_name ?? d.user.first_name,
              last_name: updated.profile?.last_name ?? d.user.last_name,
              patronymic: updated.profile?.patronymic ?? d.user.patronymic,
            },
          } : d));
          setEditUserDoctor(null);
        }}
      />
    </div>
  );
}

