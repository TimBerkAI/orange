import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Spinner } from "@/shared/ui/Spinner";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";
import {
  createSpecialization,
  deleteSpecialization,
  listSpecializations,
} from "@/domains/doctors/api";
import type { Specialization } from "@/domains/doctors/types";

export function SpecializationsPage() {
  const [specs, setSpecs] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    listSpecializations()
      .then(setSpecs)
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const spec = await createSpecialization({ name: name.trim(), description: description.trim() });
      setSpecs((prev) => [...prev, spec]);
      setName("");
      setDescription("");
    } catch (err: unknown) {
      const detail = (err as Record<string, unknown>)?.detail;
      const nameErr = (err as Record<string, unknown>)?.name;
      setAddError(
        typeof detail === "string"
          ? detail
          : Array.isArray(nameErr)
            ? String(nameErr[0])
            : "Ошибка при добавлении",
      );
    } finally {
      setAdding(false);
    }
  };

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

  return (
    <div>
      <PageHeader title="Специальности" subtitle="Справочник медицинских специальностей" />

      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.sm,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          maxWidth: 560,
        }}
      >
        <div
          style={{
            ...typography.body,
            fontWeight: "500",
            color: colors.textPrimary,
            marginBottom: spacing.md,
          }}
        >
          Добавить специальность
        </div>
        <form
          onSubmit={(e) => void handleAdd(e)}
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
          {addError && (
            <div
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: colors.dangerLight,
                color: colors.danger,
                borderRadius: radius.md,
                fontSize: typography.caption.fontSize,
              }}
            >
              {addError}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" loading={adding} disabled={!name.trim()}>
              Добавить
            </Button>
          </div>
        </form>
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
          {specs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: colors.textMuted,
                ...typography.body,
              }}
            >
              Специальности не добавлены
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: colors.borderLight }}>
                  <th
                    style={{
                      padding: `${spacing.sm} ${spacing.md}`,
                      textAlign: "left",
                      fontSize: typography.caption.fontSize,
                      fontWeight: "600",
                      color: colors.textSecondary,
                    }}
                  >
                    Название
                  </th>
                  <th
                    style={{
                      padding: `${spacing.sm} ${spacing.md}`,
                      textAlign: "left",
                      fontSize: typography.caption.fontSize,
                      fontWeight: "600",
                      color: colors.textSecondary,
                    }}
                  >
                    Описание
                  </th>
                  <th style={{ width: 140 }}></th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec, idx) => (
                  <tr
                    key={spec.id}
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
                    <td style={{ padding: `${spacing.md} ${spacing.md}` }}>
                      <span
                        style={{
                          ...typography.body,
                          fontWeight: "500",
                          color: colors.textPrimary,
                        }}
                      >
                        {spec.name}
                      </span>
                    </td>
                    <td style={{ padding: `${spacing.md} ${spacing.md}` }}>
                      <span style={{ ...typography.caption, color: colors.textSecondary }}>
                        {spec.description || "—"}
                      </span>
                    </td>
                    <td style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: "right" }}>
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
                            marginLeft: "6px",
                          }}
                        >
                          Отмена
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
