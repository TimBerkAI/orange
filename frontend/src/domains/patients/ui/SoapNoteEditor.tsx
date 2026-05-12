import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { RichTextEditor } from "@/shared/ui/RichTextEditor";
import { colors, spacing, typography } from "@/shared/config/theme";
import { SOAP_TABS } from "../constants";
import type { SoapNote } from "../types";

interface SoapNoteEditorProps {
  soap: SoapNote | null;
  onSave: (data: Partial<Record<string, string>>) => Promise<void>;
  readonly?: boolean;
}

type SoapKey = "subjective" | "objective" | "assessment" | "plan";

export function SoapNoteEditor({ soap, onSave, readonly = false }: SoapNoteEditorProps) {
  const [activeTab, setActiveTab] = useState<SoapKey>("subjective");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const contentRef = useRef<Record<SoapKey, string>>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  useEffect(() => {
    if (soap) {
      contentRef.current = {
        subjective: soap.subjective,
        objective: soap.objective,
        assessment: soap.assessment,
        plan: soap.plan,
      };
    }
  }, [soap]);

  const handleChange = useCallback(
    (html: string) => {
      contentRef.current[activeTab] = html;
    },
    [activeTab],
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await onSave(contentRef.current);
      setMessage("Сохранено");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (!soap) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: spacing.lg,
          color: colors.textMuted,
          ...typography.caption,
        }}
      >
        SOAP-заметка не найдена
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${colors.border}`, flexWrap: "wrap" }}>
        {SOAP_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 16px",
                border: "none",
                borderBottom: isActive ? `2px solid ${colors.primary}` : "2px solid transparent",
                backgroundColor: isActive ? colors.primaryLight : "transparent",
                color: isActive ? colors.primaryDark : colors.textSecondary,
                cursor: "pointer",
                fontSize: typography.caption.fontSize,
                fontWeight: "600",
                transition: "all 0.15s ease",
                marginBottom: "-1px",
              }}
              title={tab.title}
            >
              {tab.label} — {tab.title}
            </button>
          );
        })}
      </div>

      <RichTextEditor
        value={contentRef.current[activeTab]}
        onChange={handleChange}
        readonly={readonly}
        minHeight={120}
        maxHeight={300}
      />

      {!readonly && (
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, justifyContent: "flex-end" }}>
          {message && (
            <span
              style={{
                fontSize: typography.caption.fontSize,
                color: message.includes("Ошибка") ? colors.danger : colors.success,
              }}
            >
              {message}
            </span>
          )}
          <Button onClick={() => void handleSave()} loading={saving} style={{ padding: "6px 16px" }}>
            Сохранить
          </Button>
        </div>
      )}
    </div>
  );
}
