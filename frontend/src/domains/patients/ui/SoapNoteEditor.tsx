import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { colors, radius, spacing, typography } from "@/shared/config/theme";
import { SOAP_TABS } from "../constants";
import type { SoapNote } from "../types";

interface SoapNoteEditorProps {
  soap: SoapNote | null;
  onSave: (data: Partial<Record<string, string>>) => Promise<void>;
  readonly?: boolean;
}

type SoapKey = "subjective" | "objective" | "assessment" | "plan";

function ToolbarButton({
  label,
  command,
  editorRef,
}: {
  label: string;
  command: string;
  editorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const handleClick = () => {
    editorRef.current?.focus();
    document.execCommand(command, false);
  };

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleClick}
      style={{
        padding: "3px 8px",
        border: `1px solid ${colors.border}`,
        borderRadius: "4px",
        backgroundColor: colors.surface,
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "600",
        color: colors.textSecondary,
        transition: "all 0.1s ease",
        lineHeight: 1.4,
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

export function SoapNoteEditor({ soap, onSave, readonly = false }: SoapNoteEditorProps) {
  const [activeTab, setActiveTab] = useState<SoapKey>("subjective");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = contentRef.current[activeTab];
    }
  }, [activeTab, soap]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      contentRef.current[activeTab] = editorRef.current.innerHTML;
    }
  }, [activeTab]);

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
      <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${colors.border}` }}>
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

      {!readonly && (
        <div style={{ display: "flex", gap: "4px", padding: `0 ${spacing.xs}` }}>
          <ToolbarButton label="B" command="bold" editorRef={editorRef} />
          <ToolbarButton label="I" command="italic" editorRef={editorRef} />
          <ToolbarButton label="U" command="underline" editorRef={editorRef} />
          <ToolbarButton label="OL" command="insertOrderedList" editorRef={editorRef} />
          <ToolbarButton label="UL" command="insertUnorderedList" editorRef={editorRef} />
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!readonly}
        onInput={handleInput}
        suppressContentEditableWarning
        style={{
          minHeight: 120,
          maxHeight: 300,
          overflowY: "auto",
          padding: spacing.md,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
          backgroundColor: readonly ? colors.borderLight : colors.surface,
          fontSize: typography.body.fontSize,
          lineHeight: "1.6",
          color: colors.textPrimary,
          outline: "none",
        }}
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
