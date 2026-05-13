import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/domains/authorization/application/AuthContext";
import { Button } from "@/shared/ui/Button";
import { Spinner } from "@/shared/ui/Spinner";
import { RichTextEditor } from "@/shared/ui/RichTextEditor";
import { UserEditModal } from "@/shared/ui/UserEditModal";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";
import type { User } from "@/shared/types";
import {
  deleteVisit,
  getOdontogram,
  getPatient,
  getSoapNote,
  listVisits,
  updateOdontogramEntry,
  updateSoapNote,
  updateVisit,
} from "@/domains/patients/api";
import { VISIT_STATUS_COLORS, VISIT_STATUS_LABELS } from "@/domains/patients/constants";
import { Odontogram } from "@/domains/patients/ui/Odontogram";
import { SoapNoteEditor } from "@/domains/patients/ui/SoapNoteEditor";
import type {
  Odontogram as OdontogramType,
  Patient,
  SoapNote,
  ToothStatusValue,
  Visit,
} from "@/domains/patients/types";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const c = VISIT_STATUS_COLORS[status] ?? { bg: colors.borderLight, text: colors.textMuted };
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
      {VISIT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PatientCardPage() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [odontogram, setOdontogram] = useState<OdontogramType | null>(null);
  const [soap, setSoap] = useState<SoapNote | null>(null);
  const [loadingVisit, setLoadingVisit] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    Promise.all([getPatient(patientId), listVisits(patientId)])
      .then(([p, v]) => {
        setPatient(p);
        setVisits(v);
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  const selectVisit = useCallback(
    async (visitId: number) => {
      setSelectedVisitId(visitId);
      setLoadingVisit(true);
      try {
        const [od, sn] = await Promise.all([getOdontogram(visitId), getSoapNote(visitId)]);
        setOdontogram(od);
        setSoap(sn);
      } catch {
        setOdontogram(null);
        setSoap(null);
      } finally {
        setLoadingVisit(false);
      }
    },
    [],
  );

  const handleOdontogramUpdate = useCallback(
    async (toothId: number, status: ToothStatusValue) => {
      if (!selectedVisitId) return;
      const updated = await updateOdontogramEntry(selectedVisitId, toothId, status);
      setOdontogram(updated);
    },
    [selectedVisitId],
  );

  const handleSoapSave = useCallback(
    async (data: Partial<Record<string, string>>) => {
      if (!selectedVisitId) return;
      const updated = await updateSoapNote(selectedVisitId, data);
      setSoap(updated);
    },
    [selectedVisitId],
  );

  const handleVisitUpdate = useCallback(
    async (visitId: number, data: Record<string, unknown>) => {
      const updated = await updateVisit(visitId, data as Parameters<typeof updateVisit>[1]);
      setVisits((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    },
    [],
  );

  const handleVisitDelete = useCallback(
    async (visitId: number) => {
      await deleteVisit(visitId);
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
      if (selectedVisitId === visitId) {
        setSelectedVisitId(null);
        setOdontogram(null);
        setSoap(null);
      }
    },
    [selectedVisitId],
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: spacing.xxl }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ textAlign: "center", padding: spacing.xxl, color: colors.textMuted }}>
        Пациент не найден
      </div>
    );
  }

  const selectedVisit = visits.find((v) => v.id === selectedVisitId) ?? null;

  const patientAsUser: User | null = patient ? {
    id: patient.user.id,
    email: patient.user.email,
    role: "patient",
    is_active: true,
    date_joined: "",
    profile: {
      first_name: patient.user.first_name,
      last_name: patient.user.last_name,
      patronymic: patient.user.patronymic,
      phone: patient.user.phone,
      date_of_birth: patient.user.date_of_birth,
    },
  } : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "280px 1fr 320px",
        gap: spacing.md,
        height: isMobile ? "auto" : "calc(100vh - 96px)",
        overflow: isMobile ? "visible" : "hidden",
      }}
    >
      <LeftPanel
        patient={patient}
        visits={visits}
        selectedVisitId={selectedVisitId}
        onSelectVisit={selectVisit}
        isMobile={isMobile}
        isAdmin={isAdmin}
        onEditUser={() => setEditUserOpen(true)}
      />

      <UserEditModal
        open={editUserOpen}
        user={patientAsUser}
        onClose={() => setEditUserOpen(false)}
        onSaved={(updated) => {
          setPatient((p) => p ? {
            ...p,
            user: {
              ...p.user,
              email: updated.email,
              first_name: updated.profile?.first_name ?? p.user.first_name,
              last_name: updated.profile?.last_name ?? p.user.last_name,
              patronymic: updated.profile?.patronymic ?? p.user.patronymic,
              phone: updated.profile?.phone ?? p.user.phone,
              date_of_birth: updated.profile?.date_of_birth ?? p.user.date_of_birth,
            },
          } : null);
          setEditUserOpen(false);
        }}
      />

      <CenterPanel
        loadingVisit={loadingVisit}
        selectedVisitId={selectedVisitId}
        odontogram={odontogram}
        soap={soap}
        onOdontogramUpdate={handleOdontogramUpdate}
        onSoapSave={handleSoapSave}
      />

      <RightPanel
        visit={selectedVisit}
        onUpdate={handleVisitUpdate}
        isAdmin={isAdmin}
        onDelete={handleVisitDelete}
      />
    </div>
  );
}

function LeftPanel({
  patient,
  visits,
  selectedVisitId,
  onSelectVisit,
  isMobile,
  isAdmin,
  onEditUser,
}: {
  patient: Patient;
  visits: Visit[];
  selectedVisitId: number | null;
  onSelectVisit: (id: number) => void;
  isMobile: boolean;
  isAdmin: boolean;
  onEditUser: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
        overflowY: "auto",
        height: isMobile ? "auto" : "100%",
        maxHeight: isMobile ? "none" : "100%",
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderLight}`,
          boxShadow: shadows.sm,
          padding: spacing.md,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}>
          <div style={{ ...typography.subheading, color: colors.textPrimary }}>
            {patient.full_name}
          </div>
          {isAdmin && (
            <button
              onClick={onEditUser}
              style={{
                background: "none",
                border: `1px solid ${colors.border}`,
                borderRadius: radius.sm,
                padding: "3px 8px",
                cursor: "pointer",
                fontSize: "11px",
                color: colors.textSecondary,
                flexShrink: 0,
                marginLeft: spacing.sm,
              }}
            >
              Изменить
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <InfoRow label="Email" value={patient.user.email} />
          <InfoRow label="Телефон" value={patient.user.phone || "—"} />
          <InfoRow label="Дата рождения" value={formatDate(patient.user.date_of_birth)} />
          <InfoRow
            label="Аллергии"
            value={patient.allergies || "Нет"}
            valueColor={patient.allergies ? colors.warning : undefined}
          />
          <InfoRow label="Последний визит" value={formatDate(patient.last_visit?.start_at)} />
        </div>
      </div>

      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderLight}`,
          boxShadow: shadows.sm,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            borderBottom: `1px solid ${colors.borderLight}`,
            ...typography.caption,
            fontWeight: "600",
            color: colors.textSecondary,
          }}
        >
          История посещений ({visits.length})
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {visits.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: spacing.lg,
                color: colors.textMuted,
                ...typography.caption,
              }}
            >
              Нет посещений
            </div>
          ) : (
            visits.map((visit) => {
              const isSelected = visit.id === selectedVisitId;
              return (
                <div
                  key={visit.id}
                  onClick={() => void onSelectVisit(visit.id)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    cursor: "pointer",
                    backgroundColor: isSelected ? colors.primaryLight : "transparent",
                    transition: "background-color 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.surfaceHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: typography.caption.fontSize,
                        fontWeight: "500",
                        color: isSelected ? colors.primaryDark : colors.textPrimary,
                      }}
                    >
                      {formatDateTime(visit.start_at)}
                    </span>
                    <StatusBadge status={visit.status} />
                  </div>
                  <div style={{ ...typography.caption, color: colors.textSecondary }}>
                    {visit.doctor.full_name}
                  </div>
                  {visit.teeth.length > 0 && (
                    <div style={{ ...typography.caption, color: colors.textMuted, marginTop: "2px" }}>
                      Зубы: {visit.teeth.map((t) => t.number).join(", ")}
                    </div>
                  )}
                  {visit.reason && (
                    <div
                      style={{
                        ...typography.caption,
                        color: colors.textMuted,
                        marginTop: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {visit.reason}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function CenterPanel({
  loadingVisit,
  selectedVisitId,
  odontogram,
  soap,
  onOdontogramUpdate,
  onSoapSave,
}: {
  loadingVisit: boolean;
  selectedVisitId: number | null;
  odontogram: OdontogramType | null;
  soap: SoapNote | null;
  onOdontogramUpdate: (toothId: number, status: ToothStatusValue) => void;
  onSoapSave: (data: Partial<Record<string, string>>) => Promise<void>;
}) {
  if (!selectedVisitId) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: colors.textMuted,
          ...typography.body,
        }}
      >
        Выберите посещение из истории
      </div>
    );
  }

  if (loadingVisit) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div style={{ overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: spacing.md }}>
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderLight}`,
          boxShadow: shadows.sm,
          padding: spacing.md,
        }}
      >
        <div
          style={{
            ...typography.caption,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: spacing.sm,
          }}
        >
          Ортодонтограмма
        </div>
        {odontogram ? (
          <Odontogram
            entries={odontogram.entries}
            onUpdateEntry={(toothId, status) => void onOdontogramUpdate(toothId, status)}
          />
        ) : (
          <div style={{ textAlign: "center", padding: spacing.md, color: colors.textMuted, ...typography.caption }}>
            Ортодонтограмма не найдена
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderLight}`,
          boxShadow: shadows.sm,
          padding: spacing.md,
          flex: 1,
        }}
      >
        <div
          style={{
            ...typography.caption,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: spacing.sm,
          }}
        >
          SOAP-заметки
        </div>
        <SoapNoteEditor soap={soap} onSave={onSoapSave} />
      </div>
    </div>
  );
}

function RightPanel({
  visit,
  onUpdate,
  isAdmin,
  onDelete,
}: {
  visit: Visit | null;
  onUpdate: (visitId: number, data: Record<string, unknown>) => Promise<void>;
  isAdmin: boolean;
  onDelete: (visitId: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visit) {
      setReason(visit.reason);
      setStatus(visit.status);
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [visit]);

  if (!visit) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: colors.textMuted,
          ...typography.caption,
          textAlign: "center",
          padding: spacing.md,
        }}
      >
        Детали визита будут отображены после выбора записи из истории
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(visit.id, { reason, status });
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderLight}`,
          boxShadow: shadows.sm,
          padding: spacing.md,
          display: "flex",
          flexDirection: "column",
          gap: spacing.md,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ ...typography.body, fontWeight: "600", color: colors.textPrimary }}>
            Детали визита
          </span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: "none",
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: typography.caption.fontSize,
                color: colors.textSecondary,
                transition: "all 0.15s ease",
              }}
            >
              Изменить
            </button>
          )}
        </div>

        <InfoRow label="Дата и время" value={formatDateTime(visit.start_at)} />
        <InfoRow label="Врач" value={visit.doctor.full_name} />

        {editing ? (
          <>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: typography.caption.fontSize,
                  fontWeight: "500",
                  color: colors.textSecondary,
                  marginBottom: "4px",
                }}
              >
                Причина обращения
              </label>
              <RichTextEditor
                value={reason}
                onChange={setReason}
                placeholder="Причина визита"
                minHeight={60}
                maxHeight={150}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: typography.caption.fontSize,
                  fontWeight: "500",
                  color: colors.textSecondary,
                  marginBottom: "4px",
                }}
              >
                Статус
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: radius.md,
                  border: `1px solid ${colors.border}`,
                  fontSize: typography.body.fontSize,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="planned">Запланировано</option>
                <option value="confirmed">Подтверждено</option>
                <option value="completed">Завершено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setReason(visit.reason);
                  setStatus(visit.status);
                  setEditing(false);
                }}
                style={{
                  padding: "6px 14px",
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                  cursor: "pointer",
                  fontSize: typography.caption.fontSize,
                  color: colors.textSecondary,
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                style={{
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: radius.md,
                  backgroundColor: colors.primary,
                  color: "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: typography.caption.fontSize,
                  fontWeight: "500",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "..." : "Сохранить"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <span style={{ ...typography.caption, color: colors.textSecondary, display: "block", marginBottom: "2px" }}>
                Причина
              </span>
              {visit.reason ? (
                <div
                  style={{ ...typography.caption, fontWeight: "500", color: colors.textPrimary }}
                  dangerouslySetInnerHTML={{ __html: visit.reason }}
                />
              ) : (
                <span style={{ ...typography.caption, fontWeight: "500", color: colors.textPrimary }}>—</span>
              )}
            </div>
            <div>
              <span style={{ ...typography.caption, color: colors.textSecondary, display: "block", marginBottom: "2px" }}>
                Статус
              </span>
              <StatusBadge status={visit.status} />
            </div>
          </>
        )}

        {visit.teeth.length > 0 && (
          <div>
            <span
              style={{
                ...typography.caption,
                color: colors.textSecondary,
                display: "block",
                marginBottom: "4px",
              }}
            >
              Затронутые зубы
            </span>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {visit.teeth.map((t) => (
                <span
                  key={t.id}
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    backgroundColor: colors.primaryLight,
                    color: colors.primaryDark,
                    fontWeight: "500",
                  }}
                >
                  {t.number}
                </span>
              ))}
            </div>
          </div>
        )}

        {isAdmin && !editing && (
          <div
            style={{
              borderTop: `1px solid ${colors.borderLight}`,
              paddingTop: spacing.md,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {confirmDelete ? (
              <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                <span style={{ ...typography.caption, color: colors.danger }}>Удалить визит?</span>
                <Button variant="secondary" onClick={() => setConfirmDelete(false)} style={{ padding: "4px 10px" }}>
                  Нет
                </Button>
                <Button
                  variant="danger"
                  loading={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try { await onDelete(visit.id); } catch { /* ignore */ }
                    setDeleting(false);
                  }}
                  style={{ padding: "4px 10px" }}
                >
                  Да, удалить
                </Button>
              </div>
            ) : (
              <Button variant="danger" onClick={() => setConfirmDelete(true)} style={{ padding: "4px 10px" }}>
                Удалить визит
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
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
      <span
        style={{
          ...typography.caption,
          fontWeight: "500",
          color: valueColor ?? colors.textPrimary,
        }}
      >
        {value}
      </span>
    </div>
  );
}
