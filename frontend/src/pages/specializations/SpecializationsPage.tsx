import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { Spinner } from "@/shared/ui/Spinner";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";
import {
  createSpecialization,
  deleteSpecialization,
  listSpecializations,
  updateSpecialization,
} from "@/domains/doctors/api";
import type { Specialization } from "@/domains/doctors/types";

function SpecializationModal({
  open,
  spec,
  onClose,
  onSaved,
}: {
  open: boolean;
  spec: Specialization | null;
  onClose: () => void;
  onSaved: (s: Specialization) => void;
}) {
  const isEdit = !!spec;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(spec?.name ?? "");
      setDescription(spec?.description ?? "");
      setError("");
    }
  }, [open, spec]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = { name: name.trim(), description: description.trim() };
      const result = isEdit
        ? await updateSpecialization(spec!.id, payload)
        : await createSpecialization(payload);
      onSaved(result);
    } catch (err: unknown) {
      const detail = (err as Record<string, unknown>)?.detail;
      const nameErr = (err as Record<string, unknown>)?.name;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(nameErr)
            ? String(nameErr[0])
            : "Ошибка при сохранении",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Редактировать специальность" : "Добавить специальность"} width={440}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        <Input
          label="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Терапевт"
          required
        />
        <Input
          label="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Краткое описание (необязательно)"
        />
        {error && (
          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.dangerLight,
              color: colors.danger,
              borderRadius: radius.md,
              fontSize: typography.caption.fontSize,
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function SpecializationsPage() {
  const [specs, setSpecs] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editSpec, setEditSpec] = useState<Specialization | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    listSpecializations()
      .then(setSpecs)
      .finally(() => setLoading(false));
  }, []);

  const filtered = specs.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    try {
      await deleteSpecialization(id);
      setSpecs((prev) => prev.filter((s) => s.id !== id));
      setConfirmDeleteId(null);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = (result: Specialization) => {
    setSpecs((prev) => {
      const idx = prev.findIndex((s) => s.id === result.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = result;
        return next;
      }
      return [...prev, result];
    });
    setModalOpen(false);
    setEditSpec(null);
  };

  return (
    <div>
      <PageHeader
        title="Специальности"
        subtitle="Справочник медицинских специальностей"
        actions={
          <Button onClick={() => { setEditSpec(null); setModalOpen(true); }}>
            <PlusIcon /> Добавить
          </Button>
        }
      />

      <div style={{ marginBottom: spacing.md, maxWidth: 360 }}>
        <Input
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: spacing.xxl }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.sm,
            overflow: "hidden",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: colors.textMuted,
                ...typography.body,
              }}
            >
              {search ? "Специальности не найдены" : "Специальности не добавлены"}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: colors.borderLight }}>
                  <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: "left", fontSize: typography.caption.fontSize, fontWeight: "600", color: colors.textSecondary }}>
                    Название
                  </th>
                  <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: "left", fontSize: typography.caption.fontSize, fontWeight: "600", color: colors.textSecondary }}>
                    Описание
                  </th>
                  <th style={{ width: 200 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((spec, idx) => (
                  <tr
                    key={spec.id}
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
                    <td style={{ padding: `${spacing.md} ${spacing.md}` }}>
                      <span style={{ ...typography.body, fontWeight: "500", color: colors.textPrimary }}>
                        {spec.name}
                      </span>
                    </td>
                    <td style={{ padding: `${spacing.md} ${spacing.md}` }}>
                      <span style={{ ...typography.caption, color: colors.textSecondary }}>
                        {spec.description || "—"}
                      </span>
                    </td>
                    <td style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => { setEditSpec(spec); setModalOpen(true); }}
                          style={{
                            background: "none",
                            border: `1px solid ${colors.border}`,
                            borderRadius: radius.md,
                            padding: "5px 12px",
                            cursor: "pointer",
                            fontSize: typography.caption.fontSize,
                            color: colors.textSecondary,
                            transition: "all 0.15s ease",
                          }}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(spec.id)}
                          disabled={deletingId === spec.id}
                          style={{
                            background: "none",
                            border: `1px solid ${confirmDeleteId === spec.id ? colors.danger : colors.border}`,
                            borderRadius: radius.md,
                            padding: "5px 12px",
                            cursor: "pointer",
                            fontSize: typography.caption.fontSize,
                            color: confirmDeleteId === spec.id ? colors.danger : colors.textSecondary,
                            transition: "all 0.15s ease",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {confirmDeleteId === spec.id ? "Подтвердить" : "Удалить"}
                        </button>
                        {confirmDeleteId === spec.id && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: typography.caption.fontSize,
                              color: colors.textMuted,
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <SpecializationModal
        open={modalOpen}
        spec={editSpec}
        onClose={() => { setModalOpen(false); setEditSpec(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
