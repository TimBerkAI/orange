import { useCallback, useEffect, useRef } from "react";
import { colors, radius, spacing, typography } from "@/shared/config/theme";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  readonly?: boolean;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

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

export function RichTextEditor({
  value,
  onChange,
  readonly = false,
  placeholder,
  minHeight = 80,
  maxHeight = 300,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const internalValue = useRef(value);

  useEffect(() => {
    if (editorRef.current && value !== internalValue.current) {
      internalValue.current = value;
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      internalValue.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {!readonly && (
        <div style={{ display: "flex", gap: "4px" }}>
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
        data-placeholder={placeholder}
        style={{
          minHeight,
          maxHeight,
          overflowY: "auto",
          padding: spacing.sm,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
          backgroundColor: readonly ? colors.borderLight : colors.surface,
          fontSize: typography.body.fontSize,
          lineHeight: "1.6",
          color: colors.textPrimary,
          outline: "none",
        }}
      />
    </div>
  );
}
