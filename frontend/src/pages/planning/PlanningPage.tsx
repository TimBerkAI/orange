import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { listDoctors } from "@/domains/doctors/api";
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  updateAppointment,
} from "@/domains/planning/api";
import {
  HOUR_HEIGHT,
  MAX_HOUR,
  MIN_HOUR,
  VISIT_STATUS_BG,
  VISIT_STATUS_FG,
  VISIT_STATUS_LABELS,
  WEEKDAY_SHORT,
} from "@/domains/planning/constants";
import { AppointmentFormModal } from "@/domains/planning/ui/AppointmentFormModal";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Spinner } from "@/shared/ui/Spinner";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";
import type { Doctor } from "@/domains/doctors/types";
import type { Appointment } from "@/domains/planning/types";

function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function formatHeaderDate(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function PlanningPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDoctorId, setFilterDoctorId] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const today = useMemo(() => new Date(), []);

  const loadAppointments = useCallback(
    (s?: string) => {
      const params: Record<string, string> = {
        date_from: weekStart.toISOString(),
        date_to: weekEnd.toISOString(),
      };
      if (filterDoctorId) params.doctor_id = String(filterDoctorId);
      if (s) params.search = s;

      listAppointments(params as Parameters<typeof listAppointments>[0])
        .then(setAppointments)
        .catch(() => null);
    },
    [weekStart, weekEnd, filterDoctorId],
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listAppointments({
        date_from: weekStart.toISOString(),
        date_to: weekEnd.toISOString(),
      }),
      listDoctors(),
    ])
      .then(([appts, docs]) => {
        setAppointments(appts);
        setDoctors(docs);
      })
      .finally(() => setLoading(false));
  }, [weekStart, weekEnd]);

  useEffect(() => {
    if (!loading) loadAppointments(searchValue || undefined);
  }, [filterDoctorId, loadAppointments, loading, searchValue]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchValue(value);
    }, 350);
  };

  const handleCreate = async (data: Parameters<typeof createAppointment>[0]) => {
    const appt = await createAppointment(data);
    setAppointments((prev) => [...prev, appt]);
  };

  const handleUpdate = async (data: Parameters<typeof updateAppointment>[1]) => {
    if (!editAppt) return;
    const updated = await updateAppointment(editAppt.id, data);
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditAppt(null);
    setDetailAppt(null);
  };

  const handleDelete = async () => {
    if (!detailAppt) return;
    setDeleting(true);
    try {
      await deleteAppointment(detailAppt.id);
      setAppointments((prev) => prev.filter((a) => a.id !== detailAppt.id));
      setDetailAppt(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  const totalHours = MAX_HOUR - MIN_HOUR;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 96px)",
        overflow: "hidden",
      }}
    >
      <PageHeader
        title="Планирование"
        subtitle="Управление расписанием и записями на прием"
        actions={
          isAdmin ? (
            <Button onClick={() => setModalOpen(true)}>
              <PlusIcon /> Новая запись
            </Button>
          ) : undefined
        }
      />

      <div
        style={{
          display: "flex",
          gap: spacing.md,
          alignItems: "center",
          marginBottom: spacing.md,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: spacing.xs, alignItems: "center" }}>
          <NavButton onClick={prevWeek} label="<" />
          <button
            onClick={goToday}
            style={{
              padding: "6px 12px",
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              cursor: "pointer",
              fontSize: typography.caption.fontSize,
              fontWeight: "500",
              color: colors.textPrimary,
            }}
          >
            Сегодня
          </button>
          <NavButton onClick={nextWeek} label=">" />
          <span
            style={{
              ...typography.body,
              fontWeight: "600",
              color: colors.textPrimary,
              marginLeft: spacing.sm,
            }}
          >
            {weekStart.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" — "}
            {addDays(weekStart, 6).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: spacing.sm,
            alignItems: "center",
          }}
        >
          <input
            placeholder="Поиск по имени/телефону..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              padding: "6px 12px",
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              fontSize: typography.caption.fontSize,
              color: colors.textPrimary,
              outline: "none",
              width: 200,
              backgroundColor: colors.surface,
            }}
          />
          <select
            value={filterDoctorId}
            onChange={(e) => setFilterDoctorId(e.target.value ? Number(e.target.value) : "")}
            style={{
              padding: "6px 12px",
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              fontSize: typography.caption.fontSize,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">Все врачи</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: spacing.xxl,
            flex: 1,
          }}
        >
          <Spinner size={32} />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflow: "auto",
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.sm,
          }}
        >
          <div style={{ display: "flex", minWidth: 800, position: "sticky", top: 0, zIndex: 5, backgroundColor: colors.surface }}>
            <div style={{ width: 56, flexShrink: 0 }} />
            {weekDays.map((day, idx) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: `${spacing.sm} 0`,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.borderLight}`,
                    backgroundColor: isToday ? colors.primaryLight : colors.surface,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: isToday ? colors.primaryDark : colors.textSecondary,
                      textTransform: "uppercase",
                    }}
                  >
                    {WEEKDAY_SHORT[idx]}
                  </div>
                  <div
                    style={{
                      fontSize: typography.body.fontSize,
                      fontWeight: isToday ? "700" : "500",
                      color: isToday ? colors.primaryDark : colors.textPrimary,
                      marginTop: "2px",
                    }}
                  >
                    {formatHeaderDate(day)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", position: "relative", minWidth: 800 }}>
            <div style={{ width: 56, flexShrink: 0 }}>
              {Array.from({ length: totalHours }, (_, i) => (
                <div
                  key={i}
                  style={{
                    height: HOUR_HEIGHT,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-end",
                    paddingRight: spacing.xs,
                    paddingTop: "2px",
                    fontSize: "10px",
                    color: colors.textMuted,
                    fontWeight: "500",
                  }}
                >
                  {pad2(MIN_HOUR + i)}:00
                </div>
              ))}
            </div>

            {weekDays.map((day, dayIdx) => {
              const dayAppts = appointments.filter((a) => isSameDay(new Date(a.start_at), day));
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={dayIdx}
                  style={{
                    flex: 1,
                    position: "relative",
                    borderLeft: `1px solid ${colors.borderLight}`,
                    backgroundColor: isToday ? "rgba(232,134,45,0.02)" : "transparent",
                  }}
                >
                  {Array.from({ length: totalHours }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        height: HOUR_HEIGHT,
                        borderBottom: `1px solid ${colors.borderLight}`,
                      }}
                    />
                  ))}

                  {dayAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appointment={appt}
                      onClick={() => setDetailAppt(appt)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && (
        <AppointmentFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {isAdmin && editAppt && (
        <AppointmentFormModal
          open={!!editAppt}
          onClose={() => setEditAppt(null)}
          onSubmit={async (data) => {
            await handleUpdate({
              reason: data.reason,
              doctor_id: data.doctor_id,
              start_at: data.start_at,
              end_at: data.end_at,
            });
          }}
          initialData={{
            phone: editAppt.phone,
            patient_name: editAppt.patient_name,
            reason: editAppt.reason,
            doctor_id: editAppt.doctor.id,
            start_date: new Date(editAppt.start_at).toISOString().slice(0, 10),
            start_time: new Date(editAppt.start_at).toTimeString().slice(0, 5),
            end_time: new Date(editAppt.end_at).toTimeString().slice(0, 5),
          }}
          title="Изменить запись"
          submitLabel="Сохранить"
        />
      )}

      <AppointmentDetailModal
        appointment={detailAppt}
        onClose={() => setDetailAppt(null)}
        isAdmin={isAdmin}
        onEdit={() => {
          if (detailAppt) {
            setEditAppt(detailAppt);
            setDetailAppt(null);
          }
        }}
        onDelete={handleDelete}
        deleting={deleting}
        onNavigateToPatient={(patientId) => void navigate(`/patients/${patientId}`)}
      />
    </div>
  );
}

function AppointmentCard({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  const start = new Date(appointment.start_at);
  const end = new Date(appointment.end_at);
  const startMinutes = (start.getHours() - MIN_HOUR) * 60 + start.getMinutes();
  const endMinutes = (end.getHours() - MIN_HOUR) * 60 + end.getMinutes();
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20);
  const bg = VISIT_STATUS_BG[appointment.visit_status] ?? colors.borderLight;
  const fg = VISIT_STATUS_FG[appointment.visit_status] ?? colors.textPrimary;

  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        top,
        left: 2,
        right: 2,
        height,
        backgroundColor: bg,
        borderLeft: `3px solid ${fg}`,
        borderRadius: "4px",
        padding: "3px 6px",
        cursor: "pointer",
        overflow: "hidden",
        transition: "box-shadow 0.15s ease, transform 0.1s ease",
        zIndex: 1,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = shadows.md;
        el.style.transform = "scale(1.01)";
        el.style.zIndex = "10";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "none";
        el.style.transform = "scale(1)";
        el.style.zIndex = "1";
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: "600",
          color: fg,
          lineHeight: "1.3",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {appointment.patient_name}
      </div>
      {height > 28 && (
        <div
          style={{
            fontSize: "9px",
            color: fg,
            opacity: 0.8,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {pad2(start.getHours())}:{pad2(start.getMinutes())} — {pad2(end.getHours())}:
          {pad2(end.getMinutes())}
        </div>
      )}
      {height > 44 && (
        <div
          style={{
            fontSize: "9px",
            color: fg,
            opacity: 0.7,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {appointment.doctor.full_name}
        </div>
      )}
    </div>
  );
}

function AppointmentDetailModal({
  appointment,
  onClose,
  isAdmin,
  onEdit,
  onDelete,
  deleting,
  onNavigateToPatient,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  onNavigateToPatient: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [appointment]);

  if (!appointment) return null;

  const start = new Date(appointment.start_at);
  const end = new Date(appointment.end_at);
  const statusLabel = VISIT_STATUS_LABELS[appointment.visit_status] ?? appointment.visit_status;
  const statusBg = VISIT_STATUS_BG[appointment.visit_status] ?? colors.borderLight;
  const statusFg = VISIT_STATUS_FG[appointment.visit_status] ?? colors.textPrimary;

  return (
    <Modal open={!!appointment} onClose={onClose} title="Детали записи" width={440}>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
        <DetailRow label="Пациент" value={appointment.patient_name} />
        <DetailRow label="Телефон" value={appointment.phone} />
        <DetailRow label="Врач" value={appointment.doctor.full_name} />
        <DetailRow
          label="Время"
          value={`${start.toLocaleDateString("ru-RU")} ${pad2(start.getHours())}:${pad2(start.getMinutes())} — ${pad2(end.getHours())}:${pad2(end.getMinutes())}`}
        />
        <div>
          <span
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              display: "block",
              marginBottom: "1px",
            }}
          >
            Причина
          </span>
          {appointment.reason ? (
            <div
              style={{ ...typography.body, fontWeight: "500", color: colors.textPrimary }}
              dangerouslySetInnerHTML={{ __html: appointment.reason }}
            />
          ) : (
            <span style={{ ...typography.body, fontWeight: "500", color: colors.textPrimary }}>—</span>
          )}
        </div>
        <div>
          <span
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              display: "block",
              marginBottom: "2px",
            }}
          >
            Статус
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: "500",
              backgroundColor: statusBg,
              color: statusFg,
            }}
          >
            {statusLabel}
          </span>
        </div>

        <button
          onClick={() => onNavigateToPatient(appointment.patient.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
            padding: "8px 12px",
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            cursor: "pointer",
            fontSize: typography.caption.fontSize,
            color: colors.primary,
            fontWeight: "500",
            transition: "background-color 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.primaryLight;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.surface;
          }}
        >
          Открыть карточку пациента
        </button>

        {isAdmin && (
          <div
            style={{
              display: "flex",
              gap: spacing.sm,
              justifyContent: "flex-end",
              borderTop: `1px solid ${colors.borderLight}`,
              paddingTop: spacing.md,
            }}
          >
            {confirmDelete ? (
              <>
                <span
                  style={{
                    ...typography.caption,
                    color: colors.danger,
                    alignSelf: "center",
                  }}
                >
                  Удалить запись?
                </span>
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                  Нет
                </Button>
                <Button variant="danger" onClick={onDelete} loading={deleting}>
                  Да, удалить
                </Button>
              </>
            ) : (
              <>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  Удалить
                </Button>
                <Button onClick={onEdit}>Изменить</Button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        style={{
          ...typography.caption,
          color: colors.textSecondary,
          display: "block",
          marginBottom: "1px",
        }}
      >
        {label}
      </span>
      <span style={{ ...typography.body, fontWeight: "500", color: colors.textPrimary }}>
        {value}
      </span>
    </div>
  );
}

function NavButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        cursor: "pointer",
        fontSize: typography.body.fontSize,
        fontWeight: "600",
        color: colors.textSecondary,
        transition: "background-color 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.surfaceHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.surface;
      }}
    >
      {label}
    </button>
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
