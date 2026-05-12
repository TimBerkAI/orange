import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Spinner } from "@/shared/ui/Spinner";
import { colors, spacing, typography } from "@/shared/config/theme";
import { getDoctorMe, listSpecializations, updateDoctorMe } from "../api";
import { WEEKDAY_LABELS } from "../weekdays";
import type { Doctor, Specialization } from "../types";

export function DoctorSelfCard() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      getDoctorMe().catch((e: unknown) => {
        if ((e as Record<string, unknown>)?.status === 404) setNotFound(true);
        return null;
      }),
      listSpecializations(),
    ])
      .then(([doc, specs]) => {
        if (doc) {
          setDoctor(doc);
          setNotes(doc.notes);
          setSelectedWeekdays(doc.preferred_weekdays);
          setSelectedSpecs(doc.specializations.map((s) => s.id));
        }
        setSpecializations(specs);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const toggleSpec = (id: number) => {
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateDoctorMe({
        notes,
        preferred_weekdays: selectedWeekdays,
        specialization_ids: selectedSpecs,
      });
      setDoctor(updated);
      setMessage("Данные сохранены");
    } catch {
      setMessage("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: spacing.xxl }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (notFound || !doctor) {
    return (
      <Card>
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: colors.textMuted,
            ...typography.body,
          }}
        >
          У вас нет карточки врача. Обратитесь к администратору.
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.primaryLight,
            borderRadius: "10px",
          }}
        >
          <div style={{ ...typography.subheading, color: colors.textPrimary }}>
            {doctor.full_name || doctor.user.email}
          </div>
          <div style={{ ...typography.caption, color: colors.textMuted, marginTop: "4px" }}>
            {doctor.user.email}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: typography.caption.fontSize,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: "10px",
            }}
          >
            Рабочие дни
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {Object.entries(WEEKDAY_LABELS).map(([day, label]) => {
              const d = Number(day);
              const active = selectedWeekdays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleWeekday(d)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${active ? colors.primary : colors.border}`,
                    backgroundColor: active ? colors.primaryLight : colors.surface,
                    color: active ? colors.primaryDark : colors.textSecondary,
                    fontSize: typography.caption.fontSize,
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {specializations.length > 0 && (
          <div>
            <div
              style={{
                fontSize: typography.caption.fontSize,
                fontWeight: "500",
                color: colors.textSecondary,
                marginBottom: "10px",
              }}
            >
              Специальности
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {specializations.map((spec) => {
                const active = selectedSpecs.includes(spec.id);
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => toggleSpec(spec.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${active ? colors.primary : colors.border}`,
                      backgroundColor: active ? colors.primaryLight : colors.surface,
                      color: active ? colors.primaryDark : colors.textSecondary,
                      fontSize: typography.caption.fontSize,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {spec.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label
            style={{
              display: "block",
              fontSize: typography.caption.fontSize,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: "6px",
            }}
          >
            Заметки
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              fontSize: typography.body.fontSize,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: "1.5",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {message && (
          <div
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: "8px",
              backgroundColor: message.includes("Ошибка") ? colors.dangerLight : colors.successLight,
              color: message.includes("Ошибка") ? colors.danger : colors.success,
              fontSize: typography.caption.fontSize,
            }}
          >
            {message}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => void handleSave()} loading={saving}>
            Сохранить
          </Button>
        </div>
      </div>
    </Card>
  );
}
